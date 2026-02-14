const STORAGE_KEY = 'letterboxed-stats';

export interface SolveRecord {
  date: string;
  wordCount: number;
  words: string[];
  solveTimeSeconds: number;
}

export interface UserStats {
  totalWins: number;
  streak: number;
  lastPlayedDate: string | null;
  solves: Record<string, SolveRecord>; // date -> record
}

const DEFAULT_STATS: UserStats = {
  totalWins: 0,
  streak: 0,
  lastPlayedDate: null,
  solves: {},
};

function loadStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      solves: parsed.solves ?? {},
    };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function getStats(): UserStats {
  return loadStats();
}

export function recordSolve(
  date: string,
  wordCount: number,
  words: string[],
  solveTimeSeconds: number
): UserStats {
  const stats = loadStats();
  const alreadySolved = !!stats.solves[date];
  if (alreadySolved) return stats; // Don't overwrite, keep first solve

  const newSolves = { ...stats.solves, [date]: { date, wordCount, words, solveTimeSeconds } };
  const totalWins = Object.keys(newSolves).length;

  // Compute streak: count consecutive days going backward from today
  let streak = 0;
  let checkDate = date;
  for (let i = 0; i < 365; i++) {
    if (newSolves[checkDate]) {
      streak++;
      const d = new Date(checkDate + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  const newStats: UserStats = {
    ...stats,
    totalWins,
    streak,
    lastPlayedDate: date,
    solves: newSolves,
  };

  saveStats(newStats);
  return newStats;
}

export function getTodaysSolve(date: string): SolveRecord | null {
  const stats = loadStats();
  return stats.solves[date] ?? null;
}
