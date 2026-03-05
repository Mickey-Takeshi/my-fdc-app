'use client';

/**
 * components/ServiceWorkerRegistration.tsx
 *
 * Service Worker registration component (Phase 23)
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // useEffect はマウント後（= load 後）に実行されるため、直接登録
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // SW registration failed - silent
        });
    }
  }, []);

  return null;
}
