import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tagline: { contains: search } },
        { problemStatement: { contains: search } },
        { valueProposition: { contains: search } },
      ];
    }

    const ideas = await prisma.productIdea.findMany({
      where,
      include: {
        phases: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ideas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      tagline,
      category = "SaaS",
      problemStatement,
      targetAudience,
      valueProposition,
      status = "BRAINSTORMING",
      priority = "MEDIUM",
      targetLaunchDate,
      estimatedBudget,
      notes,
      phases = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Product idea title is required." }, { status: 400 });
    }

    const idea = await prisma.productIdea.create({
      data: {
        title: title.trim(),
        tagline: tagline?.trim() || null,
        category: category || "SaaS",
        problemStatement: problemStatement?.trim() || null,
        targetAudience: targetAudience?.trim() || null,
        valueProposition: valueProposition?.trim() || null,
        status: status || "BRAINSTORMING",
        priority: priority || "MEDIUM",
        targetLaunchDate: targetLaunchDate ? new Date(targetLaunchDate) : null,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : null,
        notes: notes?.trim() || null,
        phases: {
          create: phases.map((p: any, idx: number) => ({
            title: p.title || `Phase ${idx + 1}`,
            description: p.description || null,
            order: p.order !== undefined ? p.order : idx,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            status: p.status || "PLANNED",
            deliverables: p.deliverables || null,
          })),
        },
      },
      include: {
        phases: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, idea });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      tagline,
      category,
      problemStatement,
      targetAudience,
      valueProposition,
      status,
      priority,
      targetLaunchDate,
      estimatedBudget,
      notes,
      phases,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Idea ID is required." }, { status: 400 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (tagline !== undefined) data.tagline = tagline?.trim() || null;
    if (category !== undefined) data.category = category;
    if (problemStatement !== undefined) data.problemStatement = problemStatement?.trim() || null;
    if (targetAudience !== undefined) data.targetAudience = targetAudience?.trim() || null;
    if (valueProposition !== undefined) data.valueProposition = valueProposition?.trim() || null;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (targetLaunchDate !== undefined)
      data.targetLaunchDate = targetLaunchDate ? new Date(targetLaunchDate) : null;
    if (estimatedBudget !== undefined)
      data.estimatedBudget = estimatedBudget ? Number(estimatedBudget) : null;
    if (notes !== undefined) data.notes = notes?.trim() || null;

    if (Array.isArray(phases)) {
      // Recreate phases
      await prisma.productExecutionPhase.deleteMany({
        where: { ideaId: id },
      });
      data.phases = {
        create: phases.map((p: any, idx: number) => ({
          title: p.title || `Phase ${idx + 1}`,
          description: p.description || null,
          order: p.order !== undefined ? p.order : idx,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          status: p.status || "PLANNED",
          deliverables: p.deliverables || null,
        })),
      };
    }

    const idea = await prisma.productIdea.update({
      where: { id },
      data,
      include: {
        phases: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, idea });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
