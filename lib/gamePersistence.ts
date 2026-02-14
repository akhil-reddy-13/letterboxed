import type { GameState, Letter } from './gameLogic';

const GAME_STATE_KEY = 'letterboxed-game';

interface PersistedRef {
  char: string;
  side: number;
  index: number;
}

function letterToRef(l: Letter): PersistedRef {
  return { char: l.char, side: l.side, index: l.index };
}

function refToLetter(ref: PersistedRef, puzzle: Letter[]): Letter | null {
  if (
    typeof ref?.char !== 'string' ||
    typeof ref?.side !== 'number' ||
    typeof ref?.index !== 'number'
  ) {
    return null;
  }
  const found = puzzle.find(
    (l) => l.char === ref.char && l.side === ref.side && l.index === ref.index
  );
  return found ?? null;
}

export function saveGameState(state: GameState, puzzleDate: string): void {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      puzzleDate,
      completedWords: state.completedWords,
      completedWordPaths: state.completedWordPaths.map((path) => path.map(letterToRef)),
      currentWord: state.currentWord.map(letterToRef),
      allUsedLetters: Array.from(state.allUsedLetters),
      selectedSide: state.selectedSide,
      lastWordEndSide: state.lastWordEndSide,
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadGameState(
  puzzleDate: string,
  puzzle: Letter[]
): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.puzzleDate !== puzzleDate) return null;

    const completedWordPaths = (data.completedWordPaths ?? [])
      .map((path: PersistedRef[]) => {
        const letters = path.map((ref) => refToLetter(ref, puzzle));
        if (letters.some((l) => l === null)) return null;
        return letters as Letter[];
      })
      .filter(Boolean) as Letter[][];

    const currentWord = (data.currentWord ?? [])
      .map((ref: PersistedRef) => refToLetter(ref, puzzle))
      .filter((l: Letter | null): l is Letter => l !== null);

    return {
      letters: puzzle,
      completedWords: data.completedWords ?? [],
      completedWordPaths,
      currentWord,
      allUsedLetters: new Set(data.allUsedLetters ?? []),
      selectedSide: data.selectedSide ?? null,
      lastWordEndSide: data.lastWordEndSide ?? null,
    };
  } catch {
    try {
      localStorage.removeItem(GAME_STATE_KEY);
    } catch {}
    return null;
  }
}

export function clearGameState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch {}
}
