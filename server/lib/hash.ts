import { createHash } from 'crypto';

/**
 * Hash an email address for privacy-preserving storage.
 * Uses SHA-256 to create a consistent, irreversible identifier.
 */
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}
