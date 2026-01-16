'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Snackbar } from '@/app/_components/ui/Snackbar';

interface SnackbarOptions {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarOptions | null>(null);

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    setSnackbar(options);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          action={snackbar.action}
          duration={snackbar.duration}
          onClose={hideSnackbar}
        />
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
