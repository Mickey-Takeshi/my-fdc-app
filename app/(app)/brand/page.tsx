/**
 * app/(app)/brand/page.tsx
 *
 * Phase 15: ブランド戦略ページ
 */

'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { BrandProvider } from '@/lib/contexts/BrandContext';
import {
  BrandSelector,
  BrandProfile,
  BrandPoints,
  TonmanaCheck,
} from '@/app/_components/brand';

function BrandPageContent() {
  const { workspace, loading } = useWorkspace();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        ワークスペースを選択してください
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '24px',
        margin: '-24px',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: 'white' }}>
            ブランド戦略
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            10ポイントフレームワークでブランドを定義・管理
          </p>
        </div>

        {/* ブランド選択 */}
        <BrandSelector />

        {/* ブランド基本情報 */}
        <div style={{ marginBottom: '32px' }}>
          <BrandProfile />
        </div>

        {/* 10ポイント */}
        <div style={{ marginBottom: '32px' }}>
          <BrandPoints />
        </div>

        {/* トーン&マナーチェック */}
        <div style={{ maxWidth: '600px' }}>
          <TonmanaCheck />
        </div>
      </div>
    </div>
  );
}

export default function BrandPage() {
  return (
    <BrandProvider>
      <BrandPageContent />
    </BrandProvider>
  );
}
