/**
 * Security utilities for Task Analysis Studio
 */

/**
 * Validates whether a URL uses a safe protocol (http: or https: or mailto:).
 * Explicitly rejects javascript:, data:text/html, vbscript: to protect against XSS.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Allow relative URLs starting with /
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  // Allow safe data URLs for images only
  if (trimmed.startsWith("data:image/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates maximum file size (default 5MB) to avoid DB bloat & memory exhaustion.
 */
export function validateFileSize(sizeInBytes: number, maxMb: number = 5): boolean {
  const maxBytes = maxMb * 1024 * 1024;
  return sizeInBytes <= maxBytes;
}

/**
 * Disallows dangerous executable file extensions
 */
export function isAllowedFileType(filename: string): boolean {
  if (!filename) return false;
  const dangerousExtensions = [
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".php", ".phtml", ".vbs", ".scr", ".com", ".js", ".mjs"
  ];
  const lower = filename.toLowerCase();
  return !dangerousExtensions.some((ext) => lower.endsWith(ext));
}
