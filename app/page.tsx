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
import { isValidWord } from '@/lib/wordList';
import LetterSquare from '@/components/LetterSquare';
import WordInput from '@/components/WordInput';
import ControlButtons from '@/components/ControlButtons';

export default function Home() {
  const [puzzle, setPuzzle] = useState<Letter[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize puzzle on mount
  useEffect(() => {
    const dailyPuzzle = generateDailyPuzzle();
    setPuzzle(dailyPuzzle);
    setGameState(createInitialState(dailyPuzzle));
    
    // Pre-load dictionary in background
    isValidWord('test').catch(() => {
      // Silent fail, will retry on actual validation
    });
  }, []);

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
      if (gameState.selectedSide === letter.side) {
        setError('Cannot select from the same side consecutively!');
      }
    }
  }, [gameState]);

  const handleLetterDragStart = useCallback((letter: Letter) => {
    if (!gameState) return;
    
    // Start new word if needed
    if (gameState.currentWord.length === 0) {
      if (canStartNewWord(letter, gameState.lastWordEndSide)) {
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
    if (!gameState || !isDragging) return;
    handleLetterClick(letter);
  }, [gameState, isDragging, handleLetterClick]);

  const handleLetterDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (!gameState) return;
    
    if (gameState.currentWord.length > 0) {
      // Remove last letter from current word
      const newWord = gameState.currentWord.slice(0, -1);
      const newAllUsedLetters = new Set(gameState.allUsedLetters);
      
      // Remove the last letter from used letters (only for current word tracking)
      if (gameState.currentWord.length > 0) {
        const lastLetter = gameState.currentWord[gameState.currentWord.length - 1];
        // Only remove if it's not in any completed word
        const isInCompletedWords = gameState.completedWordPaths.some(path =>
          path.some(l => l.side === lastLetter.side && l.index === lastLetter.index)
        );
        if (!isInCompletedWords) {
          newAllUsedLetters.delete(`${lastLetter.side}-${lastLetter.index}`);
        }
      }

      setGameState({
        ...gameState,
        currentWord: newWord,
        selectedSide: newWord.length > 0 ? newWord[newWord.length - 1].side : null,
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
      if (wordCount === 2) {
        alert('Perfect! You solved it in 2 words! 🎉');
      } else if (wordCount <= 5) {
        alert(`Congratulations! You solved it in ${wordCount} words!`);
      }
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    if (!puzzle.length) return;
    const newState = createInitialState(puzzle);
    setGameState(newState);
    setError(null);
  }, [puzzle]);

  const handleKeyPress = useCallback((key: string) => {
    if (!gameState || !puzzle.length) return;

    const upperKey = key.toUpperCase();
    const letter = puzzle.find(l => l.char === upperKey);
    
    if (letter) {
      handleLetterClick(letter);
    }
  }, [gameState, puzzle, handleLetterClick]);

  if (!gameState || puzzle.length === 0) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const currentWord = gameState.currentWord.map(l => l.char).join('');
  const wordCount = getWordCount(gameState);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#f5c2c7',
      padding: '20px',
      gap: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Left side - Text area */}
      <div style={{ 
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
        }}>
          {currentWord || <span style={{ color: '#666' }}>_</span>}
        </div>
        
        <div style={{
          width: '100%',
          height: '2px',
          backgroundColor: '#000',
        }} />

        <div style={{
          fontSize: '16px',
          color: '#333',
        }}>
          Try to solve in 5 words
        </div>

        {error && (
          <div style={{
            color: '#d32f2f',
            fontSize: '14px',
            marginTop: '10px',
          }}>
            {error}
          </div>
        )}

        {gameState.completedWords.length > 0 && (
          <div style={{
            marginTop: '20px',
            fontSize: '16px',
          }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              Completed words ({wordCount}):
            </div>
            {gameState.completedWords.map((word, idx) => (
              <div key={idx} style={{ marginBottom: '5px' }}>
                {word.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Spacer to push buttons down */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Right side - Letter Square */}
      <div style={{ 
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '15px',
      }}>
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
    </div>
  );
}