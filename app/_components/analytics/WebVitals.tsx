/**
 * app/_components/analytics/WebVitals.tsx
 *
 * Phase 22: Core Web Vitals 計測
 * - LCP, INP, CLS を計測してコンソールに出力
 * - 本番では分析サービスに送信可能
 */

'use client';

import { useEffect } from 'react';

type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface Metric {
  name: string;
  value: number;
  rating: MetricRating;
}

export function WebVitals() {
  useEffect(() => {
    // web-vitals ライブラリを動的インポート
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        // 開発環境: コンソールに出力
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

        // 本番環境: 分析サービスに送信（例）
        // if (process.env.NODE_ENV === 'production') {
        //   sendToAnalytics({
        //     name: metric.name,
        //     value: metric.value,
        //     rating: metric.rating,
        //   });
        // }
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
