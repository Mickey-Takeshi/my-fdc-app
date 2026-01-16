'use client';

import { useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const RATING_COLORS = { good: '#22c55e', 'needs-improvement': '#f59e0b', poor: '#ef4444' };

export function WebVitals() {
  useEffect(() => {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (m: Metric) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`%c[Web Vitals] ${m.name}: ${m.value.toFixed(2)} (${m.rating})`, `color: ${RATING_COLORS[m.rating]}; font-weight: bold;`);
        }
      };
      [onCLS, onINP, onLCP, onFCP, onTTFB].forEach((fn) => fn(report));
    });
  }, []);

  return null;
}
