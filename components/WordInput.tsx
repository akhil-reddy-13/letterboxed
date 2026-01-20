'use client';

import { useEffect } from 'react';

interface WordInputProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
}

export default function WordInput({ onKeyPress, onEnter, onDelete }: WordInputProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
        return;
      }

      // Handle Backspace/Delete keys
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onDelete();
        return;
      }

      // Handle letter keys
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        onKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress, onEnter, onDelete]);

  // This component doesn't render anything visible
  return null;
}