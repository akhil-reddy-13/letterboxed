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
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const clientToSvg = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * squareSize;
    const y = ((clientY - rect.top) / rect.height) * squareSize;
    const min = padding;
    const max = padding + sideLength;
    return {
      x: Math.max(min, Math.min(max, x)),
      y: Math.max(min, Math.min(max, y)),
    };
  };

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

  // Draw lines connecting letters in current word (dashed, pink), with live cursor tail when dragging
  const drawCurrentWordPath = () => {
    if (currentWord.length === 0) return null;

    const points = currentWord.map(letter => getLetterPosition(letter));
    let pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Extend line to follow cursor/finger when dragging
    if (isDragging && cursorPos) {
      pathData += ` L ${cursorPos.x} ${cursorPos.y}`;
    }

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
    const pos = clientToSvg(e.clientX, e.clientY);
    setCursorPos(pos);
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
      setCursorPos(null);
      setIsDragging(false);
      onLetterDragEnd();
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setCursorPos(null);
        setIsDragging(false);
        onLetterDragEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, onLetterDragEnd]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const pos = clientToSvg(e.clientX, e.clientY);
      if (pos) setCursorPos(pos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  const touchStartLetterRef = useRef<Letter | null>(null);

  const handleTouchStart = (letter: Letter, e: React.TouchEvent) => {
    e.preventDefault();
    touchStartLetterRef.current = letter;
    const touch = e.touches[0];
    const pos = clientToSvg(touch.clientX, touch.clientY);
    setCursorPos(pos);
    isDraggingRef.current = true;
    setIsDragging(true);
    onLetterDragStart(letter);
  };

  const handleTouchEnd = () => {
    if (touchStartLetterRef.current) {
      touchStartLetterRef.current = null;
    }
    if (isDraggingRef.current) {
      setCursorPos(null);
      isDraggingRef.current = false;
      setIsDragging(false);
      onLetterDragEnd();
    }
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches.length) return;
      const touch = e.touches[0];
      const pos = clientToSvg(touch.clientX, touch.clientY);
      if (pos) setCursorPos(pos);

      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = squareSize / rect.width;
      const scaleY = squareSize / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      let closest: Letter | null = null;
      let minDist = 40;
      letters.forEach((letter) => {
        const letterPos = getLetterPosition(letter);
        const d = Math.hypot(x - letterPos.x, y - letterPos.y);
        if (d < minDist) {
          minDist = d;
          closest = letter;
        }
      });
      if (closest) onLetterDragEnter(closest);
    };

    const handleTouchEndGlobal = () => {
      if (isDraggingRef.current) {
        setCursorPos(null);
        setIsDragging(false);
        isDraggingRef.current = false;
        onLetterDragEnd();
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEndGlobal);
    window.addEventListener('touchcancel', handleTouchEndGlobal);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEndGlobal);
      window.removeEventListener('touchcancel', handleTouchEndGlobal);
    };
  }, [onLetterDragEnter, letters]);

  return (
    <div className="letter-square-wrapper" style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${squareSize} ${squareSize}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
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
                onTouchStart={(e) => handleTouchStart(letter, e)}
                onTouchEnd={handleTouchEnd}
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