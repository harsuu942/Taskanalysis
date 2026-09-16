import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (clientId && clientId !== "ALL") {
      where.clientId = clientId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { scopeOfWork: { contains: search } },
        { notes: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { company: { contains: search } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        discussions: {
          orderBy: { meetingDate: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            employeeStatus: true,
            adminStatus: true,
            priority: true,
            totalDurationSeconds: true,
          },
        },
        _count: {
          select: {
            discussions: true,
            attachments: true,
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("[Projects API GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      clientId,
      status = "ONBOARD",
      scopeOfWork,
      initialEstimation,
      approvedAmount,
      currency = "$",
      approvedTimeframe,
      startDate,
      targetDeliveryDate,
      isApproved = false,
      notes,
      attachments = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Project title is required." }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client is required for project." }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        clientId,
        status,
        scopeOfWork: scopeOfWork?.trim() || null,
        initialEstimation: initialEstimation?.trim() || null,
        approvedAmount:
          approvedAmount !== undefined && approvedAmount !== null && approvedAmount !== ""
            ? Number(approvedAmount)
            : null,
        currency: currency || "$",
        approvedTimeframe: approvedTimeframe?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
        isApproved: Boolean(isApproved),
        approvedAt: isApproved ? new Date() : null,
        notes: notes?.trim() || null,
        attachments: {
          create: attachments.map((att: any) => ({
            name: att.name,
            url: att.url,
            fileType: att.fileType || "link",
            fileSize: att.fileSize || null,
          })),
        },
      },
      include: {
        client: true,
        discussions: true,
        attachments: true,
        _count: {
          select: { discussions: true, attachments: true, tasks: true },
        },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("[Projects API POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      clientId,
      status,
      scopeOfWork,
      initialEstimation,
      approvedAmount,
      currency,
      approvedTimeframe,
      startDate,
      targetDeliveryDate,
      isApproved,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (clientId !== undefined) data.clientId = clientId;
    if (status !== undefined) data.status = status;
    if (scopeOfWork !== undefined) data.scopeOfWork = scopeOfWork?.trim() || null;
    if (initialEstimation !== undefined) data.initialEstimation = initialEstimation?.trim() || null;
    if (approvedAmount !== undefined) {
      data.approvedAmount =
        approvedAmount !== "" && approvedAmount !== null ? Number(approvedAmount) : null;
    }
    if (currency !== undefined) data.currency = currency;
    if (approvedTimeframe !== undefined) data.approvedTimeframe = approvedTimeframe?.trim() || null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (targetDeliveryDate !== undefined)
      data.targetDeliveryDate = targetDeliveryDate ? new Date(targetDeliveryDate) : null;
    if (isApproved !== undefined) {
      data.isApproved = Boolean(isApproved);
      if (isApproved) {
        data.approvedAt = new Date();
      }
    }
    if (notes !== undefined) data.notes = notes?.trim() || null;

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        discussions: {
          orderBy: { meetingDate: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { discussions: true, attachments: true, tasks: true },
        },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("[Projects API PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
