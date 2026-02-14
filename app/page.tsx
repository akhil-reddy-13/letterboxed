'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  generateDailyPuzzle, 
  createInitialState,
  type Letter,
  type GameState,
  canSelectLetter,
  canStartNewWord,
  checkWinCondition,
  getWordCount,
} from '@/lib/gameLogic';
import { getDisplayDatePST, getTodayPST } from '@/lib/dateUtils';
import { isValidWord } from '@/lib/wordList';
import { recordSolve, getTodaysSolve, getStats } from '@/lib/stats';
import { saveGameState, loadGameState } from '@/lib/gamePersistence';
import LetterSquare from '@/components/LetterSquare';
import WordInput from '@/components/WordInput';
import ControlButtons from '@/components/ControlButtons';
import WinModal, { type WinStats } from '@/components/WinModal';
import InfoModal from '@/components/InfoModal';
import { buildShareText } from '@/lib/shareUtils';

export default function Home() {
  const [puzzle, setPuzzle] = useState<Letter[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const gameStartTime = useRef<number | null>(null);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  const [winStats, setWinStats] = useState<WinStats | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [userStats, setUserStats] = useState({ totalWins: 0, streak: 0 });
  const [showInfoModal, setShowInfoModal] = useState(false);

  const today = getTodayPST();
  const hasSolvedToday = winStats !== null;

  // Initialize puzzle and load state on mount
  useEffect(() => {
    const dailyPuzzle = generateDailyPuzzle();
    setPuzzle(dailyPuzzle);
    isValidWord('test').catch(() => {});

    const saved = loadGameState(today, dailyPuzzle);
    if (saved) {
      setGameState(saved);
    } else {
      setGameState(createInitialState(dailyPuzzle));
    }
    gameStartTime.current = Date.now();

    const todaysSolve = getTodaysSolve(today);
    if (todaysSolve) {
      setWinStats({
        wordCount: todaysSolve.wordCount,
        words: todaysSolve.words,
        solveTimeSeconds: todaysSolve.solveTimeSeconds,
      });
    }
    setUserStats(getStats());
  }, [today]);

  // Persist game state whenever it changes
  useEffect(() => {
    if (gameState && puzzle.length) {
      saveGameState(gameState, today);
    }
  }, [gameState, puzzle, today]);

  const handleLetterClick = useCallback((letter: Letter) => {
    if (!gameState) return;

    // If starting a new word, check if we can start from this letter
    if (gameState.currentWord.length === 0) {
      if (!canStartNewWord(letter, gameState.lastWordEndSide)) {
        setError('Cannot start from the same side as previous word ended!');
        return;
      }
      
      const newAllUsedLetters = new Set(gameState.allUsedLetters);
      newAllUsedLetters.add(`${letter.side}-${letter.index}`);
      
      setGameState({
        ...gameState,
        currentWord: [letter],
        selectedSide: letter.side,
        allUsedLetters: newAllUsedLetters,
      });
      setError(null);
      return;
    }

    // Check if we can select this letter (cannot be from same side as last letter)
    if (canSelectLetter(letter, gameState.selectedSide, gameState.currentWord)) {
      const newAllUsedLetters = new Set(gameState.allUsedLetters);
      newAllUsedLetters.add(`${letter.side}-${letter.index}`);
      
      setGameState({
        ...gameState,
        currentWord: [...gameState.currentWord, letter],
        selectedSide: letter.side,
        allUsedLetters: newAllUsedLetters,
      });
      setError(null);
    } else {
      const lastLetter = gameState.currentWord[gameState.currentWord.length - 1];
      const isLastLetter = lastLetter.side === letter.side && lastLetter.index === letter.index;
      if (isLastLetter && gameState.currentWord.length >= 2) {
        // Click on current last letter (when 2+ letters): remove it from end
        const newWord = gameState.currentWord.slice(0, -1);
        const newAllUsedLetters = new Set(gameState.allUsedLetters);
        const isInCompletedWords = gameState.completedWordPaths.some((path) =>
          path.some((l) => l.side === lastLetter.side && l.index === lastLetter.index)
        );
        if (!isInCompletedWords) {
          newAllUsedLetters.delete(`${lastLetter.side}-${lastLetter.index}`);
        }
        setGameState({
          ...gameState,
          currentWord: newWord,
          selectedSide: newWord.length > 0 ? newWord[newWord.length - 1].side : null,
          allUsedLetters: newAllUsedLetters,
        });
        setError(null);
      } else if (isLastLetter && gameState.currentWord.length === 1) {
        // Tap/click on only letter - no-op (avoids add-then-remove from tap-to-add)
      } else if (gameState.selectedSide === letter.side) {
        setError('Cannot select from the same side consecutively!');
      }
    }
  }, [gameState]);

  const handleLetterDragStart = useCallback((letter: Letter) => {
    if (!gameState) return;

    // Resume drag from last letter (continue building word)
    if (gameState.currentWord.length > 0) {
      const lastLetter = gameState.currentWord[gameState.currentWord.length - 1];
      if (lastLetter.side === letter.side && lastLetter.index === letter.index) {
        isDraggingRef.current = true;
        setIsDragging(true);
        return;
      }
    }

    // Start new word if needed
    if (gameState.currentWord.length === 0) {
      if (canStartNewWord(letter, gameState.lastWordEndSide)) {
        isDraggingRef.current = true;
        setIsDragging(true);
        const newAllUsedLetters = new Set(gameState.allUsedLetters);
        newAllUsedLetters.add(`${letter.side}-${letter.index}`);
        setGameState({
          ...gameState,
          currentWord: [letter],
          selectedSide: letter.side,
          allUsedLetters: newAllUsedLetters,
        });
        setError(null);
      }
    }
  }, [gameState]);

  const handleLetterDragEnter = useCallback((letter: Letter) => {
    if (!gameState || !isDraggingRef.current) return;
    handleLetterClick(letter);
  }, [gameState, handleLetterClick]);

  const handleLetterDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (!gameState) return;

    if (gameState.currentWord.length > 0) {
      // Remove last letter from current word
      const newWord = gameState.currentWord.slice(0, -1);
      const newAllUsedLetters = new Set(gameState.allUsedLetters);
      const lastLetter = gameState.currentWord[gameState.currentWord.length - 1];
      const isInCompletedWords = gameState.completedWordPaths.some((path) =>
        path.some((l) => l.side === lastLetter.side && l.index === lastLetter.index)
      );
      if (!isInCompletedWords) {
        newAllUsedLetters.delete(`${lastLetter.side}-${lastLetter.index}`);
      }

      setGameState({
        ...gameState,
        currentWord: newWord,
        selectedSide: newWord.length > 0 ? newWord[newWord.length - 1].side : null,
        allUsedLetters: newAllUsedLetters,
      });
      setError(null);
      return;
    }

    // Current word empty - restore last completed word so user can backspace through it
    if (gameState.completedWords.length > 0 && gameState.completedWordPaths.length > 0) {
      const lastPath = gameState.completedWordPaths[gameState.completedWordPaths.length - 1];
      const newCompletedWords = gameState.completedWords.slice(0, -1);
      const newCompletedWordPaths = gameState.completedWordPaths.slice(0, -1);
      const newAllUsedLetters = new Set<string>();
      newCompletedWordPaths.forEach((path) => {
        path.forEach((l) => newAllUsedLetters.add(`${l.side}-${l.index}`));
      });
      lastPath.forEach((l) => newAllUsedLetters.add(`${l.side}-${l.index}`));

      setGameState({
        ...gameState,
        currentWord: [...lastPath],
        completedWords: newCompletedWords,
        completedWordPaths: newCompletedWordPaths,
        selectedSide: lastPath[lastPath.length - 1].side,
        lastWordEndSide:
          newCompletedWordPaths.length > 0
            ? newCompletedWordPaths[newCompletedWordPaths.length - 1][
                newCompletedWordPaths[newCompletedWordPaths.length - 1].length - 1
              ].side
            : null,
        allUsedLetters: newAllUsedLetters,
      });
      setError(null);
    }
  }, [gameState]);

  const handleEnter = useCallback(async () => {
    if (!gameState) return;

    const word = gameState.currentWord.map(l => l.char).join('');
    
    if (word.length < 2) {
      setError('Word must be at least 2 letters!');
      return;
    }

    // Validate word using dictionary
    const isValid = await isValidWord(word);
    
    if (!isValid) {
      setError('Not a valid word!');
      return;
    }

    // Store the current word path before modifying
    const currentWordPath = [...gameState.currentWord];
    const lastLetter = currentWordPath[currentWordPath.length - 1];
    
    // Add word to completed words
    const newCompletedWords = [...gameState.completedWords, word];
    const newCompletedWordPaths = [...gameState.completedWordPaths, currentWordPath];
    
    // Start next word with the last letter of this word
    // Note: lastLetter is already in allUsedLetters from the previous word,
    // so we don't need to add it again (but it's fine if we do since Sets don't duplicate)
    const newAllUsedLetters = new Set(gameState.allUsedLetters);
    newAllUsedLetters.add(`${lastLetter.side}-${lastLetter.index}`);
    
    // Check win condition before updating state
    const newState = {
      ...gameState,
      currentWord: [lastLetter], // Start next word with last letter
      completedWords: newCompletedWords,
      completedWordPaths: newCompletedWordPaths,
      selectedSide: lastLetter.side, // Set to last letter's side
      lastWordEndSide: lastLetter.side, // Remember where this word ended (for word 3+)
      allUsedLetters: newAllUsedLetters,
    };
    
    const won = checkWinCondition(newState);
    
    setGameState(newState);
    setError(null);

    if (won) {
      const wordCount = newCompletedWords.length;
      const solveTimeSeconds = gameStartTime.current
        ? Math.round((Date.now() - gameStartTime.current) / 1000)
        : 0;
      setWinStats({
        wordCount,
        words: newCompletedWords,
        solveTimeSeconds,
      });
      setShowWinModal(true);
      const updated = recordSolve(today, wordCount, newCompletedWords, solveTimeSeconds);
      setUserStats(updated);
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    if (!puzzle.length) return;
    const newState = createInitialState(puzzle);
    setGameState(newState);
    setError(null);
    gameStartTime.current = Date.now();
    saveGameState(newState, today);
  }, [puzzle, today]);

  const handleCopyShare = useCallback(() => {
    if (!winStats) return;
    const text = buildShareText(winStats.wordCount, winStats.solveTimeSeconds);
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [winStats]);

  const handleKeyPress = useCallback((key: string) => {
    if (!gameState || !puzzle.length) return;

    const upperKey = key.toUpperCase();
    const letter = puzzle.find(l => l.char === upperKey);
    
    if (letter) {
      handleLetterClick(letter);
    }
  }, [gameState, puzzle, handleLetterClick]);

  if (!gameState || puzzle.length === 0) {
    return <div style={{ padding: '20px', color: '#888' }}>Loading...</div>;
  }

  const currentWord = gameState.currentWord.map(l => l.char).join('');
  const wordCount = getWordCount(gameState);

  return (
    <div className="game-layout">
      {/* Info button - top right */}
      <button
        onClick={() => setShowInfoModal(true)}
        className="game-info-btn"
        style={{
          borderRadius: '4px',
          border: '1px solid #444',
          backgroundColor: '#1a1a1a',
          color: '#888',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="About"
      >
        ?
      </button>

      {/* Left side - Text area */}
      <div className="game-left">
        <div className="game-date">
          {getDisplayDatePST()} • Pacific
          {userStats.totalWins > 0 && (
            <span style={{ marginLeft: '12px', color: '#666' }}>
              · {userStats.totalWins} win{userStats.totalWins !== 1 ? 's' : ''}
              {userStats.streak > 0 && ` · ${userStats.streak} day streak`}
            </span>
          )}
        </div>
        <div className="game-word-display">
          {currentWord || <span className="cursor-blink" style={{ color: '#888' }}>_</span>}
        </div>
        
        <div className="game-divider" />

        <div className="game-subtitle">
          Try to solve in 5 words
        </div>

        {error && (
          <div style={{
            color: '#e57373',
            fontSize: '14px',
            marginTop: '10px',
          }}>
            {error}
          </div>
        )}

        {gameState.completedWords.length > 0 && (
          <div className="game-completed-words">
            <div style={{ marginBottom: '10px', fontWeight: '600', color: '#e0e0e0' }}>
              Completed words ({wordCount}):
            </div>
            {gameState.completedWords.map((word, idx) => (
              <div key={idx} style={{ marginBottom: '5px' }}>
                {word.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Spacer to push buttons down (minimal on mobile) */}
        <div className="game-spacer" />
      </div>

      {/* Right side - Letter Square */}
      <div className="game-right">
        <LetterSquare
          letters={puzzle}
          currentWord={gameState.currentWord}
          completedWordPaths={gameState.completedWordPaths}
          onLetterClick={handleLetterClick}
          onLetterDragStart={handleLetterDragStart}
          onLetterDragEnter={handleLetterDragEnter}
          onLetterDragEnd={handleLetterDragEnd}
        />
      </div>

      {/* Bottom - Control Buttons */}
      <div className="game-controls">
        {hasSolvedToday && (
          <button
            onClick={() => setShowWinModal(true)}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '500',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '25px',
              cursor: 'pointer',
              color: '#e0e0e0',
            }}
          >
            Results
          </button>
        )}
        <ControlButtons
          onRestart={handleRestart}
          onDelete={handleDelete}
          onEnter={handleEnter}
        />
      </div>

      {/* Keyboard input handler */}
      <WordInput 
        onKeyPress={handleKeyPress}
        onEnter={handleEnter}
        onDelete={handleDelete}
      />

      {/* Info modal */}
      {showInfoModal && (
        <InfoModal onClose={() => setShowInfoModal(false)} />
      )}

      {/* Win modal */}
      {showWinModal && winStats && (
        <WinModal
          stats={winStats}
          onClose={() => setShowWinModal(false)}
          copySuccess={copySuccess}
          onCopy={handleCopyShare}
        />
      )}
    </div>
  );
}