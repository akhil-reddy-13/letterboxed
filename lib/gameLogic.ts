// Game logic for Letter Boxed

export interface Letter {
  char: string;
  side: number; // 0 = top, 1 = right, 2 = bottom, 3 = left
  index: number; // position on that side (0-2)
}

export interface GameState {
  letters: Letter[];
  currentWord: Letter[];
  completedWords: string[]; // Just the word strings
  completedWordPaths: Letter[][]; // Full letter paths for rendering
  selectedSide: number | null; // Last selected side in current word
  lastWordEndSide: number | null; // Side of last letter from previous word (for starting new word)
  allUsedLetters: Set<string>; // Track all letters used (for win condition)
}

// Generate a daily puzzle based on date (deterministic)
export function generateDailyPuzzle(date: Date = new Date()): Letter[] {
  // Use date as seed for consistent daily puzzles
  const seed = date.toISOString().split('T')[0]; // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Fixed puzzle from the image for now, but can be randomized
  // Top: O, T, K
  // Right: P, I, A
  // Bottom: W, E, C
  // Left: R, V, N
  
  const puzzle: Letter[] = [
    { char: 'O', side: 0, index: 0 },
    { char: 'T', side: 0, index: 1 },
    { char: 'K', side: 0, index: 2 },
    { char: 'P', side: 1, index: 0 },
    { char: 'I', side: 1, index: 1 },
    { char: 'A', side: 1, index: 2 },
    { char: 'W', side: 2, index: 0 },
    { char: 'E', side: 2, index: 1 },
    { char: 'C', side: 2, index: 2 },
    { char: 'R', side: 3, index: 0 },
    { char: 'V', side: 3, index: 1 },
    { char: 'N', side: 3, index: 2 },
  ];
  
  return puzzle;
}

export function getSideForLetter(letters: Letter[], char: string): number | null {
  const letter = letters.find(l => l.char === char);
  return letter ? letter.side : null;
}

export function canSelectLetter(
  letter: Letter,
  lastSide: number | null,
  currentWord: Letter[]
): boolean {
  // Enforce rule: cannot select from same side as previous letter
  if (lastSide !== null && letter.side === lastSide) {
    return false;
  }
  
  // Letters can be reused, but not immediately after the same letter from same side
  // This is already handled by the side check above
  
  return true;
}

// Check if letter can be used to START a new word
export function canStartNewWord(
  letter: Letter,
  lastWordEndSide: number | null
): boolean {
  // When starting a new word, cannot start from same side as previous word ended
  if (lastWordEndSide !== null && letter.side === lastWordEndSide) {
    return false;
  }
  return true;
}

export function createInitialState(puzzle: Letter[]): GameState {
  return {
    letters: puzzle,
    currentWord: [],
    completedWords: [],
    completedWordPaths: [],
    selectedSide: null,
    lastWordEndSide: null,
    allUsedLetters: new Set(),
  };
}

export function checkWinCondition(state: GameState): boolean {
  // Check if all 12 letters have been used at least once
  return state.allUsedLetters.size === 12;
}

export function getWordCount(state: GameState): number {
  return state.completedWords.length;
}