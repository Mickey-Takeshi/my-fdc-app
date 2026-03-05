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
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch(() => {
            // SW registration failed - silent
          });
      });
    }
  }, []);

  return null;
}
