/**
 * Normalize username by removing @ prefix if present
 */
export function normalizeUsername(username: string): string {
  return username.startsWith('@') ? username.slice(1) : username;
}