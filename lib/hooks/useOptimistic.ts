/**
 * lib/hooks/useOptimistic.ts
 *
 * Custom hook for optimistic UI updates (Phase 25)
 */

import { useState, useCallback } from 'react';

interface UseOptimisticOptions<T> {
  onAction: (data: T) => Promise<boolean>;
  onRollback?: () => void;
}

export function useOptimistic<T>({ onAction, onRollback }: UseOptimisticOptions<T>) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (data: T) => {
      setIsPending(true);
      setError(null);

      try {
        const success = await onAction(data);
        if (!success) {
          onRollback?.();
          setError('Operation failed');
        }
        return success;
      } catch {
        onRollback?.();
        setError('Network error');
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [onAction, onRollback]
  );

  return { execute, isPending, error };
}
