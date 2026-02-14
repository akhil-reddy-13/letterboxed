// Game logic for Letter Boxed

import { getTodayPST, getDatePST, hashString } from './dateUtils';
import puzzlesJson from './puzzles.json';

// Puzzle format: [[side0 letters], [side1], [side2], [side3]]
const puzzles = (puzzlesJson as { puzzles: string[][][] }).puzzles;

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

/**
 * Get today's puzzle. Changes at midnight Pacific Time.
 * Same date (in PST) = same puzzle for everyone.
 */
export function generateDailyPuzzle(date?: Date): Letter[] {
  const dateStr = date ? getDatePST(date) : getTodayPST();
  const index = hashString(dateStr) % puzzles.length;
  const raw = puzzles[index];

  const letters: Letter[] = [];
  raw.forEach((sideLetters, side) => {
    sideLetters.forEach((char, idx) => {
      letters.push({ char, side, index: idx });
    });
  });
  return letters;
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