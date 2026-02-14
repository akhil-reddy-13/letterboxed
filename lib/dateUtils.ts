/**
 * Date utilities for daily puzzle selection.
 * Puzzles change at midnight Pacific Time (America/Los_Angeles).
 */

/**
 * Get today's date string (YYYY-MM-DD) in Pacific time.
 * Uses America/Los_Angeles which automatically handles PST/PDT.
 */
export function getTodayPST(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Get the date string for a given date in Pacific time.
 * Useful for testing or when passing a specific date.
 */
export function getDatePST(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Get a human-readable date string for display (e.g. "February 14, 2026").
 */
export function getDisplayDatePST(date?: Date): string {
  const d = date ?? new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Stable hash from a string to a number.
 * Same string always produces the same hash.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
