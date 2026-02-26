'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onClose: () => void;
}

export function Snackbar({ message, action, duration = 5000, onClose }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1f2937',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="閉じる"
        style={{
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
