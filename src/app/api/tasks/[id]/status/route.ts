import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      role, // "ADMIN" | "EMPLOYEE"
      userId,
      employeeStatus, // "TODO" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED"
      adminStatus, // "PENDING_REVIEW" | "FINAL_COMPLETED" | "REVISION_REQUESTED"
    } = body;

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        timeLogs: {
          where: { isRunning: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {};
    const now = new Date();

    // 1. Updating Employee Status
    if (employeeStatus) {
      updateData.employeeStatus = employeeStatus;

      // When employee/admin sets TODO -> Reset adminStatus and stop running timer
      if (employeeStatus === "TODO") {
        updateData.adminStatus = "NOT_SUBMITTED";
        if (task.isTimerRunning) {
          updateData.isTimerRunning = false;
          updateData.currentTimerStartedAt = null;

          let addedSeconds = 0;
          for (const log of task.timeLogs) {
            const start = new Date(log.startTime);
            const sessionSecs = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));
            await prisma.timeLog.update({
              where: { id: log.id },
              data: {
                endTime: now,
                isRunning: false,
                durationSeconds: sessionSecs,
              },
            });
            addedSeconds += sessionSecs;
          }
          updateData.totalDurationSeconds = (task.totalDurationSeconds || 0) + addedSeconds;
        }
      }

      if (employeeStatus === "COMPLETED") {
        // If Admin sets it to completed, finalize it; if Employee, submit for review
        if (role === "ADMIN" && adminStatus === "FINAL_COMPLETED") {
          updateData.adminStatus = "FINAL_COMPLETED";
        } else {
          updateData.adminStatus = role === "ADMIN" ? "FINAL_COMPLETED" : "PENDING_REVIEW";
        }

        // Stop any running timer for this task
        if (task.isTimerRunning) {
          updateData.isTimerRunning = false;
          updateData.currentTimerStartedAt = null;

          let addedSeconds = 0;
          for (const log of task.timeLogs) {
            const start = new Date(log.startTime);
            const sessionSecs = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));
            await prisma.timeLog.update({
              where: { id: log.id },
              data: {
                endTime: now,
                isRunning: false,
                durationSeconds: sessionSecs,
              },
            });
            addedSeconds += sessionSecs;
          }
          updateData.totalDurationSeconds = (task.totalDurationSeconds || 0) + addedSeconds;
        }
      }

      // If marked ON_HOLD -> Pause running timer
      if (employeeStatus === "ON_HOLD") {
        updateData.adminStatus = "NOT_SUBMITTED";
        if (task.isTimerRunning) {
          updateData.isTimerRunning = false;
          updateData.currentTimerStartedAt = null;

          let addedSeconds = 0;
          for (const log of task.timeLogs) {
            const start = new Date(log.startTime);
            const sessionSecs = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));
            await prisma.timeLog.update({
              where: { id: log.id },
              data: {
                endTime: now,
                isRunning: false,
                durationSeconds: sessionSecs,
              },
            });
            addedSeconds += sessionSecs;
          }
          updateData.totalDurationSeconds = (task.totalDurationSeconds || 0) + addedSeconds;
        }
      }

      // If marked IN_PROGRESS and timer was not running -> can start timer
      if (employeeStatus === "IN_PROGRESS") {
        updateData.adminStatus = "NOT_SUBMITTED";
        if (!task.isTimerRunning) {
          const targetUserId = userId || task.assignedToId || task.createdById;
          if (targetUserId) {
            const userExists = await prisma.user.findUnique({
              where: { id: targetUserId },
              select: { id: true },
            });
            if (userExists) {
              updateData.isTimerRunning = true;
              updateData.currentTimerStartedAt = now;
              await prisma.timeLog.create({
                data: {
                  taskId: task.id,
                  userId: userExists.id,
                  startTime: now,
                  isRunning: true,
                },
              });
            }
          }
        }
      }
    }

    // 2. Admin explicitly updating Admin Status (Final Approval / Revision Workflow)
    if (adminStatus && !employeeStatus) {
      if (role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admin can approve or update Admin Status." },
          { status: 403 }
        );
      }

      updateData.adminStatus = adminStatus;

      // When Admin gives Final Approval
      if (adminStatus === "FINAL_COMPLETED") {
        updateData.employeeStatus = "COMPLETED";

        // Stop running timer if any
        if (task.isTimerRunning) {
          updateData.isTimerRunning = false;
          updateData.currentTimerStartedAt = null;

          let addedSeconds = 0;
          for (const log of task.timeLogs) {
            const start = new Date(log.startTime);
            const sessionSecs = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));
            await prisma.timeLog.update({
              where: { id: log.id },
              data: {
                endTime: now,
                isRunning: false,
                durationSeconds: sessionSecs,
              },
            });
            addedSeconds += sessionSecs;
          }
          updateData.totalDurationSeconds = (task.totalDurationSeconds || 0) + addedSeconds;
        }
      } else if (adminStatus === "REVISION_REQUESTED") {
        updateData.employeeStatus = "IN_PROGRESS";
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
        timeLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Status successfully updated: Employee [${updatedTask.employeeStatus}], Admin [${updatedTask.adminStatus}]`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
