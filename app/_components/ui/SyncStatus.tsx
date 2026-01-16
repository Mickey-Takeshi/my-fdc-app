'use client';

import { Check, AlertCircle, Loader2 } from 'lucide-react';

export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStatusProps {
  state: SyncState;
  errorMessage?: string;
}

export function SyncStatus({ state, errorMessage }: SyncStatusProps) {
  if (state === 'idle') return null;

  const config = {
    saving: {
      icon: <Loader2 size={14} className="spin" aria-hidden="true" />,
      text: '保存中...',
      bg: '#f3f4f6',
      color: '#6b7280',
    },
    saved: {
      icon: <Check size={14} aria-hidden="true" />,
      text: '保存済み',
      bg: '#f0fdf4',
      color: '#16a34a',
    },
    error: {
      icon: <AlertCircle size={14} aria-hidden="true" />,
      text: 'エラー',
      bg: '#fef2f2',
      color: '#dc2626',
    },
  }[state];

  return (
    <div
      role="status"
      aria-live="polite"
      title={state === 'error' ? errorMessage : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: config.bg,
        color: config.color,
      }}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
