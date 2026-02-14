'use client';

import { useState, useRef, useEffect } from 'react';
import type { Letter } from '@/lib/gameLogic';

interface LetterSquareProps {
  letters: Letter[];
  currentWord: Letter[];
  completedWordPaths: Letter[][];
  onLetterClick: (letter: Letter) => void;
  onLetterDragStart: (letter: Letter) => void;
  onLetterDragEnter: (letter: Letter) => void;
  onLetterDragEnd: () => void;
}

export default function LetterSquare({
  letters,
  currentWord,
  completedWordPaths,
  onLetterClick,
  onLetterDragStart,
  onLetterDragEnter,
  onLetterDragEnd,
}: LetterSquareProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState<Letter | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Organize letters by side
  const lettersBySide: Letter[][] = [[], [], [], []];
  letters.forEach(letter => {
    lettersBySide[letter.side].push(letter);
  });

  // Calculate positions for letters around a square
  const squareSize = 400;
  const padding = 60;
  const centerX = squareSize / 2;
  const centerY = squareSize / 2;
  const sideLength = squareSize - padding * 2;

  const getLetterPosition = (letter: Letter) => {
    const side = letter.side;
    const index = letter.index;
    const positions = 3; // 3 letters per side

    switch (side) {
      case 0: // Top
        return {
          x: centerX - sideLength / 2 + (index + 0.5) * (sideLength / positions),
          y: padding,
        };
      case 1: // Right
        return {
          x: squareSize - padding,
          y: centerY - sideLength / 2 + (index + 0.5) * (sideLength / positions),
        };
      case 2: // Bottom (right to left)
        return {
          x: centerX + sideLength / 2 - (index + 0.5) * (sideLength / positions),
          y: squareSize - padding,
        };
      case 3: // Left (bottom to top)
        return {
          x: padding,
          y: centerY + sideLength / 2 - (index + 0.5) * (sideLength / positions),
        };
      default:
        return { x: 0, y: 0 };
    }
  };

  const isInCurrentWord = (letter: Letter) => {
    return currentWord.some(
      l => l.side === letter.side && l.index === letter.index
    );
  };

  const isFirstInWord = (letter: Letter) => {
    return currentWord.length > 0 && 
           currentWord[0].side === letter.side && 
           currentWord[0].index === letter.index;
  };

  const isLastInWord = (letter: Letter) => {
    return currentWord.length > 0 && 
           currentWord[currentWord.length - 1].side === letter.side && 
           currentWord[currentWord.length - 1].index === letter.index;
  };

  // Draw lines connecting letters in current word (dashed, pink)
  const drawCurrentWordPath = () => {
    if (currentWord.length < 2) return null;

    const points = currentWord.map(letter => getLetterPosition(letter));
    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <path
        key="current-word"
        d={pathData}
        fill="none"
        stroke="#e57373"
        strokeWidth="5"
        strokeDasharray="10,5"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />
    );
  };

  // Draw lines for completed words (solid, duller gray)
  const drawCompletedWordPaths = () => {
    return completedWordPaths.map((wordPath, wordIdx) => {
      if (wordPath.length < 2) return null;

      const points = wordPath.map(letter => getLetterPosition(letter));
      const pathData = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

      return (
        <path
          key={`completed-word-${wordIdx}`}
          d={pathData}
          fill="none"
          stroke="#555"
          strokeWidth="3"
          strokeOpacity="0.8"
          strokeLinecap="round"
        />
      );
    });
  };

  // Check if letter is in any completed word
  const isInCompletedWords = (letter: Letter) => {
    return completedWordPaths.some(path =>
      path.some(l => l.side === letter.side && l.index === letter.index)
    );
  };

  const handleMouseDown = (letter: Letter, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onLetterDragStart(letter);
  };

  const handleMouseEnter = (letter: Letter) => {
    setHoveredLetter(letter);
    if (isDragging) {
      onLetterDragEnter(letter);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onLetterDragEnd();
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onLetterDragEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, onLetterDragEnd]);

  return (
    <div style={{ position: 'relative', width: squareSize, height: squareSize }}>
      <svg
        ref={svgRef}
        width={squareSize}
        height={squareSize}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Draw square outline */}
        <rect
          x={padding}
          y={padding}
          width={sideLength}
          height={sideLength}
          fill="none"
          stroke="#444"
          strokeWidth="2"
        />

        {/* Draw completed word paths first (behind current word) */}
        {drawCompletedWordPaths()}

        {/* Draw current word path (on top, dashed) */}
        {drawCurrentWordPath()}

        {/* Draw letters */}
        {letters.map((letter, idx) => {
          const pos = getLetterPosition(letter);
          const inCurrentWord = isInCurrentWord(letter);
          const inCompleted = isInCompletedWords(letter);
          const isFirst = isFirstInWord(letter);
          const isLast = isLastInWord(letter);
          const isHovered = hoveredLetter?.side === letter.side && 
                           hoveredLetter?.index === letter.index;

          return (
            <g key={`${letter.side}-${letter.index}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={
                  isLast ? '#c44' : // Accent for last selected in current word
                  isFirst ? '#e0e0e0' : // Light for first in current word
                  inCurrentWord ? '#555' : // Dark gray for in current word
                  inCompleted ? '#444' : // Dark for used in completed words
                  '#2a2a2a' // Dark for unused
                }
                stroke="#555"
                strokeWidth="2"
                style={{
                  cursor: 'pointer',
                  transition: 'fill 0.2s',
                }}
                onMouseDown={(e) => handleMouseDown(letter, e)}
                onMouseEnter={() => handleMouseEnter(letter)}
                onMouseUp={handleMouseUp}
                onClick={() => onLetterClick(letter)}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fontWeight="bold"
                fill={isFirst ? '#1a1a1a' : '#e0e0e0'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {letter.char}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}