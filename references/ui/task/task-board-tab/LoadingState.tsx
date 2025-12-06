/**
 * app/_components/todo/task-board-tab/LoadingState.tsx
 *
 * ローディング表示コンポーネント
 */

import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  todayLabel: string;
}

export function LoadingState({ todayLabel }: LoadingStateProps) {
  return (
    <div className="section">
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <Calendar size={24} />
        {todayLabel}
      </h2>
      <div
        className="card"
        style={{
          padding: '60px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: 'var(--loading)' }}
        />
        <p style={{ color: 'var(--text-light)' }}>読み込み中...</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
