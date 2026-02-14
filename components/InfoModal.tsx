'use client';

interface InfoModalProps {
  onClose: () => void;
}

const LINKEDIN_URL = 'https://linkedin.com/in/akhilreddy1312';

export default function InfoModal({ onClose }: InfoModalProps) {
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
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid #333',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
          About
        </h3>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#bbb',
          }}
        >
          Hi, I'm Akhil! I built this because I love NYT Letter Boxed, but it&apos;s paywalled... 😢 This is a free
          fan-made clone: not affiliated with or endorsed by The New York Times.
        </p>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#bbb',
          }}
        >
          Built with Next.js, React, and a Collins 2019 English dictionary for validation! Daily puzzles are
          randomly generated from a curated set.
        </p>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            color: '#7eb8da',
            textDecoration: 'underline',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          Connect with me on LinkedIn! 🐡
        </a>
        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 16px',
            borderRadius: '4px',
            border: '1px solid #444',
            backgroundColor: '#2a2a2a',
            color: '#e0e0e0',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
