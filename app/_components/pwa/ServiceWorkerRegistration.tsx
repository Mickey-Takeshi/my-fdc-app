'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((r) => console.log('[SW] Registered:', r.scope))
        .catch((e) => console.error('[SW] Registration failed:', e));
    }
  }, []);

  return null;
}
