/**
 * app/_components/brand/BrandPoints.tsx
 *
 * Phase 15: 10ポイント一覧コンポーネント
 */

'use client';

import { BRAND_POINT_ORDER } from '@/lib/types/brand';
import { useBrand } from '@/lib/contexts/BrandContext';
import { BrandPointCard } from './BrandPointCard';

export function BrandPoints() {
  const { currentBrand, loading } = useBrand();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  if (!currentBrand) {
    return null;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: '20px', color: 'white' }}>10ポイントブランド戦略</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
        }}
      >
        {BRAND_POINT_ORDER.map((pointType, index) => (
          <BrandPointCard key={pointType} pointType={pointType} index={index} />
        ))}
      </div>
    </div>
  );
}
