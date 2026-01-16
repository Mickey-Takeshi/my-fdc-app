/**
 * 動的インポートによるコード分割
 */

import dynamic from 'next/dynamic';

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
}

export const DynamicCanvasGrid = dynamic(
  () =>
    import('@/app/_components/lean-canvas/CanvasGrid').then(
      (mod) => mod.CanvasGrid
    ),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export const DynamicCustomerJourney = dynamic(
  () =>
    import('@/app/_components/lean-canvas/CustomerJourney').then(
      (mod) => mod.CustomerJourney
    ),
  { loading: () => <LoadingSpinner />, ssr: false }
);
