/**
 * app/(app)/mvv/page.tsx
 *
 * Phase 17: MVV 統合ページ
 */

'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { BrandProvider, useBrand } from '@/lib/contexts/BrandContext';
import { LeanCanvasProvider } from '@/lib/contexts/LeanCanvasContext';
import { MVVProvider } from '@/lib/contexts/MVVContext';
import { BrandSelector } from '@/app/_components/brand';
import { CanvasSelector } from '@/app/_components/lean-canvas';
import { MVVEditor, UnifiedView } from '@/app/_components/mvv';

type ViewMode = 'edit' | 'unified';

function MVVPageContent() {
  const { workspace, loading } = useWorkspace();
  const { currentBrand } = useBrand();
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

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
            MVV（Mission/Vision/Value）
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            企業理念を定義し、ブランド戦略と統合表示
          </p>
        </div>

        {/* ビューモード切り替え */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setViewMode('edit')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: viewMode === 'edit' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              background: viewMode === 'edit' ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            MVV 編集
          </button>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: viewMode === 'unified' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              background: viewMode === 'unified' ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            統合ビュー
          </button>
        </div>

        {/* ブランド選択 */}
        <div style={{ marginBottom: '24px' }}>
          <BrandSelector />
        </div>

        {/* メインコンテンツ */}
        {viewMode === 'edit' ? (
          <MVVEditor />
        ) : (
          <>
            {/* Lean Canvas 選択（統合ビューのみ） */}
            {currentBrand && (
              <div style={{ marginBottom: '24px' }}>
                <CanvasSelector />
              </div>
            )}
            <UnifiedView />
          </>
        )}
      </div>
    </div>
  );
}

export default function MVVPage() {
  return (
    <BrandProvider>
      <LeanCanvasProvider>
        <MVVProvider>
          <MVVPageContent />
        </MVVProvider>
      </LeanCanvasProvider>
    </BrandProvider>
  );
}
