/**
 * Core Web Vitals 計測コンポーネント
 */

'use client';

import { useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function WebVitals() {
  useEffect(() => {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        if (process.env.NODE_ENV === 'development') {
          const color =
            metric.rating === 'good'
              ? '#22c55e'
              : metric.rating === 'needs-improvement'
                ? '#f59e0b'
                : '#ef4444';

          console.log(
            `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
            `color: ${color}; font-weight: bold;`
          );
        }
      };

      onCLS(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onFCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, []);

  return null;
}
