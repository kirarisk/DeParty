/**
 * A simple helper function to generate a random user identity.
 */
export function generateRandomUserId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}