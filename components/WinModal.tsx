'use client';

import { useState } from 'react';
import { formatTime, getShareUrl, buildShareText } from '@/lib/shareUtils';

export interface WinStats {
  wordCount: number;
  words: string[];
  solveTimeSeconds: number;
}

interface WinModalProps {
  stats: WinStats;
  onClose: () => void;
  copySuccess: boolean;
  onCopy: () => void;
}

export default function WinModal({ stats, onClose, copySuccess, onCopy }: WinModalProps) {
  const [shareSuccess, setShareSuccess] = useState(false);
  const shareText = buildShareText(stats.wordCount, stats.solveTimeSeconds);
  const url = getShareUrl();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onCopy();
        }
      }
    } else {
      onCopy();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '6px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px' }}>
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '16px',
              fontWeight: 500,
              color: '#e0e0e0',
              lineHeight: 1.5,
            }}
          >
            I solved today&apos;s Letter Boxed in {stats.wordCount} word
            {stats.wordCount === 1 ? '' : 's'}
            {stats.solveTimeSeconds > 0 && ` in ${formatTime(stats.solveTimeSeconds)}`}. Play
            here!{' '}
            <a
              href={url}
              style={{ color: '#7eb8da', textDecoration: 'underline' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {url.replace(/^https?:\/\//, '')}
            </a>
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCopy}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: copySuccess ? '#2d7d46' : '#2a2a2a',
                color: copySuccess ? '#fff' : '#e0e0e0',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: shareSuccess ? '#2d7d46' : '#2a2a2a',
                color: shareSuccess ? '#fff' : '#e0e0e0',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {shareSuccess ? 'Shared!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
