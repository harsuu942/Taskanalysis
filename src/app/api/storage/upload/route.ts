import { NextResponse } from "next/server";
import { isSupabaseConfigured, uploadToSupabaseStorage } from "@/lib/supabase";
import { isAllowedFileType, validateFileSize } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string | null) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Security validation 1: File size limit (10MB)
    if (!validateFileSize(file.size, 10)) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 10MB." },
        { status: 400 }
      );
    }

    // Security validation 2: Reject dangerous executable extensions
    if (!isAllowedFileType(file.name)) {
      return NextResponse.json(
        { error: "Security validation failed: Executable or script files (.exe, .sh, .bat, etc.) are prohibited." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${projectId}/${Date.now()}_${safeFilename}`;
    const contentType = file.type || "application/octet-stream";

    // 1. If Supabase is configured, upload to Supabase Storage bucket
    if (isSupabaseConfigured()) {
      try {
        const { publicUrl } = await uploadToSupabaseStorage({
          bucket: "project-attachments",
          filePath,
          fileBuffer,
          contentType,
        });

        return NextResponse.json({
          success: true,
          url: publicUrl,
          name: file.name,
          fileSize: file.size,
          contentType,
          storage: "supabase",
        });
      } catch (uploadErr: any) {
        console.error("[Storage API] Supabase upload failed:", uploadErr);
        return NextResponse.json(
          { error: `Supabase upload error: ${uploadErr.message}` },
          { status: 502 }
        );
      }
    }

    // 2. Fallback for local development when Supabase keys are not yet configured:
    // Convert to safe data URI with helpful advice
    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      name: file.name,
      fileSize: file.size,
      contentType,
      storage: "local-fallback",
      message: "Uploaded locally. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable Supabase Cloud Storage.",
    });
  } catch (error: any) {
    console.error("[Storage API] General error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload." }, { status: 500 });
  }
}
