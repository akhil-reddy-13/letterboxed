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
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '25px',
    cursor: 'pointer',
    color: '#e0e0e0',
    minWidth: '100px',
    transition: 'all 0.2s',
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: '#333',
    borderColor: '#555',
    transform: 'scale(1.02)',
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