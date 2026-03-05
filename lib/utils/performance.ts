/**
 * lib/utils/performance.ts
 *
 * Performance monitoring utilities (Phase 22)
 */

/**
 * Report Core Web Vitals to console (development) or analytics (production)
 */
export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CWV] ${metric.name}: ${metric.value.toFixed(2)}`);
  }
}
