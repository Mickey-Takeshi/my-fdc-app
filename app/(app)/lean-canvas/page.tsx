/**
 * app/(app)/lean-canvas/page.tsx
 *
 * Phase 16: Lean Canvas ページ
 */

'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { LeanCanvasProvider } from '@/lib/contexts/LeanCanvasContext';
import {
  CanvasSelector,
  CanvasGrid,
  CustomerJourney,
} from '@/app/_components/lean-canvas';

function LeanCanvasPageContent() {
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
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: 'white' }}>
            Lean Canvas
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            9ブロックでビジネスモデルを設計・検証
          </p>
        </div>

        {/* Canvas選択 */}
        <CanvasSelector />

        {/* 9ブロックグリッド */}
        <CanvasGrid />

        {/* カスタマージャーニー */}
        <CustomerJourney />
      </div>
    </div>
  );
}

export default function LeanCanvasPage() {
  return (
    <LeanCanvasProvider>
      <LeanCanvasPageContent />
    </LeanCanvasProvider>
  );
}
