import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isFavorite = searchParams.get("favorite");

    const where: any = {};
    if (subject && subject !== "ALL") where.subject = subject;
    if (status && status !== "ALL") where.status = status;
    if (isFavorite === "true") where.isFavorite = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
        { tags: { contains: search } },
        { url: { contains: search } },
      ];
    }

    const items = await prisma.learningItem.findMany({
      where,
      orderBy: [
        { isFavorite: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      subject = "AI",
      url,
      resourceType = "ARTICLE",
      status = "TO_LEARN",
      notes,
      isFavorite = false,
      tags,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Learning title / topic is required." }, { status: 400 });
    }

    const item = await prisma.learningItem.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        url: url?.trim() || null,
        resourceType: resourceType || "ARTICLE",
        status: status || "TO_LEARN",
        notes: notes?.trim() || null,
        isFavorite: Boolean(isFavorite),
        tags: tags?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, subject, url, resourceType, status, notes, isFavorite, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (subject !== undefined) data.subject = subject.trim();
    if (url !== undefined) data.url = url?.trim() || null;
    if (resourceType !== undefined) data.resourceType = resourceType;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (isFavorite !== undefined) data.isFavorite = Boolean(isFavorite);
    if (tags !== undefined) data.tags = tags?.trim() || null;

    const item = await prisma.learningItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
