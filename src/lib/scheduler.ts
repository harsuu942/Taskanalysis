import prisma from "./prisma";

let isProcessingRecurring = false;
let lastProcessedTime = 0;

export function getLastSchedulerRunTime(): number {
  return lastProcessedTime;
}

function getLocalParts(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10), // 1-12
      day: parseInt(map.day, 10),
      hour: parseInt(map.hour, 10),
      minute: parseInt(map.minute, 10),
      second: parseInt(map.second, 10),
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
}

function localToUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  timeZone: string = "Asia/Kolkata"
): Date {
  try {
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const local = getLocalParts(d, timeZone);
    const localAsUtc = new Date(
      Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
    );
    const diffMs = localAsUtc.getTime() - d.getTime();
    return new Date(d.getTime() - diffMs);
  } catch {
    return new Date(year, month - 1, day, hour, minute, second);
  }
}

export async function processRecurringTasks(options?: { timezone?: string }) {
  if (isProcessingRecurring) {
    console.log("[Scheduler] Recurring task processing already in progress. Skipping concurrent run.");
    return {
      processedAt: new Date(),
      generatedCount: 0,
      tasks: [],
      message: "Processing already in progress",
    };
  }

  isProcessingRecurring = true;
  try {
    const timeZone = options?.timezone || "Asia/Kolkata";
    const now = new Date();
    const localNow = getLocalParts(now, timeZone);

    const todayStr = `${localNow.year}-${String(localNow.month).padStart(2, "0")}-${String(localNow.day).padStart(2, "0")}`;
    const dayOfWeek = new Date(localNow.year, localNow.month - 1, localNow.day).getDay(); // 0 = Sun, 1 = Mon ...
    const dayOfMonth = localNow.day;
    const currentMonth = localNow.month - 1; // 0-11
    const currentYear = localNow.year;

    // Start & End of today in UTC corresponding to local timezone
    const startOfDayUtc = localToUtcDate(localNow.year, localNow.month, localNow.day, 0, 0, 0, timeZone);
    const endOfDayUtc = localToUtcDate(localNow.year, localNow.month, localNow.day, 23, 59, 59, timeZone);

    console.log(`[Scheduler] Processing recurring tasks for ${todayStr} (${timeZone}). Range: ${startOfDayUtc.toISOString()} -> ${endOfDayUtc.toISOString()}`);

    // Find all recurring template tasks
    const recurringTemplates = await prisma.task.findMany({
      where: {
        isRecurringTemplate: true,
      },
      include: {
        assignedTo: true,
        taskClients: true,
        assignees: true,
        learningItem: true,
        productIdea: true,
      },
    });

    if (recurringTemplates.length === 0) {
      lastProcessedTime = Date.now();
      return {
        processedAt: now,
        generatedCount: 0,
        tasks: [],
      };
    }

    const templateIds = recurringTemplates.map((t) => t.id);

    // One single batch query to find all tasks already generated or active for today for these templates
    const existingTasksToday = await prisma.task.findMany({
      where: {
        isRecurringTemplate: false,
        parentRecurringId: { in: templateIds },
        OR: [
          {
            createdAt: {
              gte: startOfDayUtc,
              lte: endOfDayUtc,
            },
          },
          {
            startDate: {
              gte: startOfDayUtc,
              lte: endOfDayUtc,
            },
          },
        ],
      },
      select: {
        id: true,
        parentRecurringId: true,
      },
    });

    const existingParentIds = new Set(existingTasksToday.map((t) => t.parentRecurringId));

    const templatesToGenerate: typeof recurringTemplates = [];

    for (const tpl of recurringTemplates) {
      // If already generated/active for today, skip!
      if (existingParentIds.has(tpl.id)) {
        continue;
      }

      let shouldGenerateToday = false;
      const lastGen = tpl.lastGeneratedDate ? new Date(tpl.lastGeneratedDate) : null;
      const lastGenLocal = lastGen ? getLocalParts(lastGen, timeZone) : null;
      const lastGenToday =
        lastGenLocal &&
        lastGenLocal.year === localNow.year &&
        lastGenLocal.month === localNow.month &&
        lastGenLocal.day === localNow.day;

      if (lastGenToday) {
        continue;
      }

      if (tpl.recurrence === "DAILY") {
        shouldGenerateToday = true;
      } else if (tpl.recurrence === "WEEKEND") {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          shouldGenerateToday = true;
        }
      } else if (tpl.recurrence === "WEEKLY") {
        const dayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const targetDay = tpl.weeklyDay
          ? dayMap[tpl.weeklyDay.toLowerCase()] ?? 1
          : tpl.monthlyDay
          ? tpl.monthlyDay % 7
          : 1;
        if (dayOfWeek === targetDay) {
          shouldGenerateToday = true;
        }
      } else if (tpl.recurrence === "MONTHLY") {
        const targetDate = tpl.monthlyDay || 1;
        if (dayOfMonth === targetDate) {
          const lastGenMonth = lastGenLocal ? lastGenLocal.month - 1 : -1;
          const lastGenYear = lastGenLocal ? lastGenLocal.year : -1;
          if (lastGenMonth !== currentMonth || lastGenYear !== currentYear) {
            shouldGenerateToday = true;
          }
        }
      } else if (tpl.recurrence === "QUARTERLY") {
        const targetDate = tpl.monthlyDay || 1;
        if (dayOfMonth === targetDate && [0, 3, 6, 9].includes(currentMonth)) {
          const diffMonths = lastGenLocal
            ? (currentYear - lastGenLocal.year) * 12 + (currentMonth - (lastGenLocal.month - 1))
            : 99;
          if (diffMonths >= 3) {
            shouldGenerateToday = true;
          }
        }
      } else if (tpl.recurrence === "HALF_YEARLY") {
        const targetDate = tpl.monthlyDay || 1;
        if (dayOfMonth === targetDate && [0, 6].includes(currentMonth)) {
          const diffMonths = lastGenLocal
            ? (currentYear - lastGenLocal.year) * 12 + (currentMonth - (lastGenLocal.month - 1))
            : 99;
          if (diffMonths >= 6) {
            shouldGenerateToday = true;
          }
        }
      } else if (tpl.recurrence === "YEARLY") {
        const targetDate = tpl.monthlyDay || 1;
        if (dayOfMonth === targetDate && currentMonth === 0) {
          if (!lastGenLocal || lastGenLocal.year !== currentYear) {
            shouldGenerateToday = true;
          }
        }
      }

      if (shouldGenerateToday) {
        templatesToGenerate.push(tpl);
      }
    }

    // Process templates to generate in parallel
    const generatedTasks = await Promise.all(
      templatesToGenerate.map(async (tpl) => {
        // Compute startDate and dueDate respecting template times and target day
        const tplStartLocal = tpl.startDate
          ? getLocalParts(new Date(tpl.startDate), timeZone)
          : { hour: 7, minute: 0 };
        const tplDueLocal = tpl.dueDate
          ? getLocalParts(new Date(tpl.dueDate), timeZone)
          : { hour: 23, minute: 59 };

        const startDate = localToUtcDate(
          localNow.year,
          localNow.month,
          localNow.day,
          tplStartLocal.hour,
          tplStartLocal.minute,
          0,
          timeZone
        );

        let dueDate: Date;
        if (tpl.recurrence === "DAILY" || tpl.recurrence === "WEEKEND") {
          dueDate = localToUtcDate(
            localNow.year,
            localNow.month,
            localNow.day,
            tplDueLocal.hour,
            tplDueLocal.minute,
            59,
            timeZone
          );
        } else if (tpl.recurrence === "WEEKLY") {
          const dueDayLocal = new Date(localNow.year, localNow.month - 1, localNow.day + 6);
          dueDate = localToUtcDate(
            dueDayLocal.getFullYear(),
            dueDayLocal.getMonth() + 1,
            dueDayLocal.getDate(),
            tplDueLocal.hour,
            tplDueLocal.minute,
            59,
            timeZone
          );
        } else if (tpl.recurrence === "MONTHLY") {
          const dueDayLocal = new Date(localNow.year, localNow.month - 1, localNow.day + 14);
          dueDate = localToUtcDate(
            dueDayLocal.getFullYear(),
            dueDayLocal.getMonth() + 1,
            dueDayLocal.getDate(),
            tplDueLocal.hour,
            tplDueLocal.minute,
            59,
            timeZone
          );
        } else {
          const dueDayLocal = new Date(localNow.year, localNow.month - 1, localNow.day + 30);
          dueDate = localToUtcDate(
            dueDayLocal.getFullYear(),
            dueDayLocal.getMonth() + 1,
            dueDayLocal.getDate(),
            tplDueLocal.hour,
            tplDueLocal.minute,
            59,
            timeZone
          );
        }

        const newTask = await prisma.task.create({
          data: {
            title: tpl.title,
            description: tpl.description,
            recurrence: tpl.recurrence,
            monthlyDay: tpl.monthlyDay,
            weeklyDay: tpl.weeklyDay,
            priority: tpl.priority,
            startDate: startDate,
            dueDate: dueDate,
            employeeStatus: "TODO",
            adminStatus: "NOT_SUBMITTED",
            assignedToId: tpl.assignedToId,
            clientId: tpl.clientId,
            learningItemId: tpl.learningItemId,
            productIdeaId: tpl.productIdeaId,
            billableHours: tpl.billableHours,
            createdById: tpl.createdById,
            parentRecurringId: tpl.id,
            isRecurringTemplate: false,
            taskClients: tpl.taskClients?.length
              ? {
                  create: tpl.taskClients.map((tc: any) => ({ clientId: tc.clientId })),
                }
              : undefined,
            assignees: tpl.assignees?.length
              ? {
                  create: tpl.assignees.map((ta: any) => ({ userId: ta.userId })),
                }
              : undefined,
          },
        });

        // Update template lastGeneratedDate
        await prisma.task.update({
          where: { id: tpl.id },
          data: { lastGeneratedDate: now },
        });

        console.log(
          `[Scheduler] Spawned task "${newTask.title}" for ${todayStr} (Assignee: ${tpl.assignedTo?.name || "Unassigned"})`
        );
        return newTask;
      })
    );

    lastProcessedTime = Date.now();
    return {
      processedAt: now,
      generatedCount: generatedTasks.length,
      tasks: generatedTasks,
    };
  } finally {
    isProcessingRecurring = false;
  }
}

export async function checkAndProcessAbsentEmployees() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
  });

  const absentFlags: any[] = [];

  for (const emp of employees) {
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: emp.id,
          date: todayStr,
        },
      },
    });

    // If no record exists, register as ABSENT_LEAVE
    if (!existing) {
      const record = await prisma.attendance.create({
        data: {
          userId: emp.id,
          date: todayStr,
          status: "ABSENT_LEAVE",
          notes: "Auto-flagged: No check-in recorded for today.",
        },
      });
      absentFlags.push(record);
    }
  }

  return {
    date: todayStr,
    flaggedAbsentCount: absentFlags.length,
  };
}
