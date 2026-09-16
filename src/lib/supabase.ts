import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/**
 * Returns whether Supabase credentials have been configured in environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));
}

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client using Service Role Key (or anon key fallback)
 * Used for admin operations like uploading directly to public storage buckets.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

/**
 * Client-side or public operations using Anon Key
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return publicClient;
}

/**
 * Uploads a file buffer directly to a Supabase Storage bucket.
 * Automatically ensures the bucket exists and returns the CDN public URL.
 */
export async function uploadToSupabaseStorage({
  bucket = "project-attachments",
  filePath,
  fileBuffer,
  contentType,
}: {
  bucket?: string;
  filePath: string;
  fileBuffer: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ publicUrl: string; path: string }> {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(
      "Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment variables."
    );
  }

  // 1. Ensure bucket exists
  try {
    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucket);
    if (!exists) {
      await client.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
      });
    }
  } catch (bucketErr) {
    // Non-fatal if bucket already exists or permissions don't allow listing
    console.warn("[Supabase Storage] Bucket check/create note:", bucketErr);
  }

  // 2. Upload file
  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // 3. Get Public URL
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);

  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Deletes an object from Supabase Storage bucket given its path or public URL.
 */
export async function deleteFromSupabaseStorage(
  bucket: string,
  filePathOrUrl: string
): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  try {
    let path = filePathOrUrl;
    // Extract path if a full Supabase URL was passed
    if (filePathOrUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
      path = filePathOrUrl.split(`/storage/v1/object/public/${bucket}/`)[1];
    }

    const { error } = await client.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
}
