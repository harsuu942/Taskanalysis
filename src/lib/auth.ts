import crypto from "crypto";

const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512 and a cryptographically secure random salt.
 * Formatted as: pbkdf2:<iterations>:<salt>:<hash>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored combined salt:hash string using timingSafeEqual.
 * Supports modern pbkdf2:<iter>:<salt>:<hash>, legacy <salt>:<hash>, and plaintext fallback.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  if (!password || !combinedHash) return false;

  try {
    // 1. Modern PBKDF2 format: pbkdf2:<iterations>:<salt>:<hash>
    if (combinedHash.startsWith("pbkdf2:")) {
      const parts = combinedHash.split(":");
      if (parts.length !== 4) return false;
      const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      const salt = parts[2];
      const expectedHash = parts[3];
      const testHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
      return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(testHash, "hex"));
    }

    // 2. Legacy salt:hash format (1000 iterations)
    if (combinedHash.includes(":")) {
      const [salt, expectedHash] = combinedHash.split(":");
      if (!salt || !expectedHash) return false;
      const testHash = crypto.pbkdf2Sync(password, salt, 1000, KEY_LEN, DIGEST).toString("hex");
      return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(testHash, "hex"));
    }

    // 3. Fallback direct match (for initial development seed)
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(combinedHash));
  } catch (err) {
    return false;
  }
}
