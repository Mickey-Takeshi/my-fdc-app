'use client';

/**
 * components/SyncStatusIndicator.tsx
 *
 * Sync status indicator for data save operations (Phase 25)
 */

import { Loader, Check, AlertCircle } from 'lucide-react';

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

export default function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={`sync-indicator sync-indicator-${status}`}>
      {status === 'saving' && (
        <>
          <Loader size={12} className="sync-spinner" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={12} />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={12} />
          <span>Error</span>
        </>
      )}
    </div>
  );
}
