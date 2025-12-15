/**
 * app/_components/lean-canvas/CanvasGrid.tsx
 *
 * Phase 16: 9ブロックグリッドレイアウト
 */

'use client';

import { LEAN_CANVAS_BLOCKS } from '@/lib/types/lean-canvas';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { BlockCard } from './BlockCard';

export function CanvasGrid() {
  const { currentCanvas, loading } = useLeanCanvas();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  if (!currentCanvas) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.5)' }}>
        Canvasを選択してください
      </div>
    );
  }

  // Lean Canvas グリッドレイアウト
  // +----------+----------+----------+----------+----------+
  // | Problem  | Solution |  Unique  | Unfair   | Customer |
  // |          |          |  Value   | Advantage| Segments |
  // +----------+----------+          +----------+----------+
  // | Key      | Channels |          | Revenue  | Cost     |
  // | Metrics  |          |          | Streams  | Structure|
  // +----------+----------+----------+----------+----------+

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: 'white' }}>
        {currentCanvas.title}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(2, minmax(200px, auto))',
          gridTemplateAreas: `
            "problem solution value advantage segments"
            "metrics channels value revenue cost"
          `,
          gap: '12px',
        }}
      >
        {/* 課題 (Problem) */}
        <div style={{ gridArea: 'problem' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'problem')!} />
        </div>

        {/* ソリューション (Solution) */}
        <div style={{ gridArea: 'solution' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'solution')!} />
        </div>

        {/* 独自の価値提案 (Unique Value) - 2行にまたがる */}
        <div style={{ gridArea: 'value' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'unique_value')!} />
        </div>

        {/* 圧倒的な優位性 (Unfair Advantage) */}
        <div style={{ gridArea: 'advantage' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'unfair_advantage')!} />
        </div>

        {/* 顧客セグメント (Customer Segments) */}
        <div style={{ gridArea: 'segments' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'customer_segments')!} />
        </div>

        {/* 主要指標 (Key Metrics) */}
        <div style={{ gridArea: 'metrics' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'key_metrics')!} />
        </div>

        {/* チャネル (Channels) */}
        <div style={{ gridArea: 'channels' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'channels')!} />
        </div>

        {/* 収益の流れ (Revenue Streams) */}
        <div style={{ gridArea: 'revenue' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'revenue_streams')!} />
        </div>

        {/* コスト構造 (Cost Structure) */}
        <div style={{ gridArea: 'cost' }}>
          <BlockCard definition={LEAN_CANVAS_BLOCKS.find(b => b.type === 'cost_structure')!} />
        </div>
      </div>

      {/* セクション説明 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
            PRODUCT（製品）
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
            課題・ソリューション・主要指標
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6', marginBottom: '4px' }}>
            MARKET（市場）
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
            独自価値・優位性・顧客・チャネル
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4', marginBottom: '4px' }}>
            BUSINESS（ビジネス）
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
            収益の流れ・コスト構造
          </div>
        </div>
      </div>
    </div>
  );
}
