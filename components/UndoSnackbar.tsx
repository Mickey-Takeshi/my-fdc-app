'use client';

/**
 * components/UndoSnackbar.tsx
 *
 * Undo snackbar for reversible actions (Phase 25)
 */

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoSnackbar({
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoSnackbarProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);

  const handleUndo = () => {
    onUndo();
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className={`snackbar ${visible ? 'snackbar-visible' : 'snackbar-hidden'}`}>
      <span className="snackbar-message">{message}</span>
      <button className="snackbar-undo" onClick={handleUndo}>
        Undo
      </button>
      <button className="snackbar-close" onClick={dismiss}>
        <X size={14} />
      </button>
    </div>
  );
}
