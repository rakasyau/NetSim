import crypto from 'crypto';

/* ---------------------------------------------------------
 * Helper kriptografi: token & hash sederhana
 * ------------------------------------------------------- */

// Token acak untuk publicShareToken, session, dll.
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// Hash token untuk penyimpanan aman (mis. share token di DB)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// SHA-256 untuk cache key prompt AI
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
