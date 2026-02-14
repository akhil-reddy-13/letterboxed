/**
 * Share utilities
 */

export function buildShareText(
  wordCount: number,
  solveTimeSeconds?: number
): string {
  const url = getShareUrl();
  const timeStr = solveTimeSeconds ? ` in ${formatTime(solveTimeSeconds)}` : '';
  return `I solved today's Letter Boxed in ${wordCount} word${wordCount === 1 ? '' : 's'}${timeStr}. Play here! ${url}`;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function getShareUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://letterboxed.vercel.app';
}
