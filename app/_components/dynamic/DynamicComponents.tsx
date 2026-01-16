/**
 * app/_components/dynamic/DynamicComponents.tsx
 *
 * Phase 22: 動的インポートによるコード分割
 * - 重いコンポーネントを遅延読み込み
 * - 初期バンドルサイズを削減
 */

import dynamic from 'next/dynamic';

// ローディングコンポーネント
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

// CanvasGrid を動的インポート（重いコンポーネントの例）
export const DynamicCanvasGrid = dynamic(
  () =>
    import('@/app/_components/lean-canvas/CanvasGrid').then(
      (mod) => mod.CanvasGrid
    ),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // クライアントサイドのみ
  }
);

// CustomerJourney を動的インポート
export const DynamicCustomerJourney = dynamic(
  () =>
    import('@/app/_components/lean-canvas/CustomerJourney').then(
      (mod) => mod.CustomerJourney
    ),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);
