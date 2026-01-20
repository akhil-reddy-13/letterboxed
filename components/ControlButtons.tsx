'use client';

import { useState } from 'react';

interface ControlButtonsProps {
  onRestart: () => void;
  onDelete: () => void;
  onEnter: () => void;
}

export default function ControlButtons({
  onRestart,
  onDelete,
  onEnter,
}: ControlButtonsProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: '#f5c2c7',
    border: '2px solid #e0a5ab',
    borderRadius: '25px',
    cursor: 'pointer',
    color: '#000',
    minWidth: '100px',
    transition: 'all 0.2s',
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: '#e0a5ab',
    transform: 'scale(1.05)',
  };

  return (
    <>
      <button
        style={{
          ...buttonStyle,
          ...(hovered === 'restart' ? hoverStyle : {}),
        }}
        onMouseEnter={() => setHovered('restart')}
        onMouseLeave={() => setHovered(null)}
        onClick={onRestart}
      >
        Restart
      </button>
      <button
        style={{
          ...buttonStyle,
          ...(hovered === 'delete' ? hoverStyle : {}),
        }}
        onMouseEnter={() => setHovered('delete')}
        onMouseLeave={() => setHovered(null)}
        onClick={onDelete}
      >
        Delete
      </button>
      <button
        style={{
          ...buttonStyle,
          ...(hovered === 'enter' ? hoverStyle : {}),
        }}
        onMouseEnter={() => setHovered('enter')}
        onMouseLeave={() => setHovered(null)}
        onClick={onEnter}
      >
        Enter
      </button>
    </>
  );
}