import { isSafeUrl, validateFileSize } from "@/lib/security";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const attachments = await prisma.projectAttachment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ attachments });
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
    const { name, url, fileType = "link", fileSize } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Attachment name is required." }, { status: 400 });
    }
    if (!url || !url.trim()) {
      return NextResponse.json({ error: "Attachment URL or file data is required." }, { status: 400 });
    }
    if (!isSafeUrl(url)) {
      return NextResponse.json(
        { error: "Security validation failed: Invalid or unsafe URL protocol. Only http, https, and safe images are permitted." },
        { status: 400 }
      );
    }

    const attachment = await prisma.projectAttachment.create({
      data: {
        projectId,
        name: name.trim(),
        url: url.trim(),
        fileType: fileType || "link",
        fileSize: fileSize || null,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID required." }, { status: 400 });
    }

    await prisma.projectAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
