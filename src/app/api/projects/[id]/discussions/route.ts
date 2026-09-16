import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const discussions = await prisma.projectDiscussion.findMany({
      where: { projectId },
      orderBy: { meetingDate: "desc" },
    });
    return NextResponse.json({ discussions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();
    const { title, meetingDate, discussionNotes, clientFeedback, actionItems } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Discussion title / topic is required." }, { status: 400 });
    }

    if (!discussionNotes || !discussionNotes.trim()) {
      return NextResponse.json({ error: "Discussion notes are required." }, { status: 400 });
    }

    const discussion = await prisma.projectDiscussion.create({
      data: {
        projectId,
        title: title.trim(),
        meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
        discussionNotes: discussionNotes.trim(),
        clientFeedback: clientFeedback?.trim() || null,
        actionItems: actionItems?.trim() || null,
      },
    });

    // Touch project updatedAt
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, discussion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get("discussionId");

    if (!discussionId) {
      return NextResponse.json({ error: "Discussion ID required." }, { status: 400 });
    }

    await prisma.projectDiscussion.delete({
      where: { id: discussionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
