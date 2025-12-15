/**
 * app/_components/mvv/UnifiedView.tsx
 *
 * Phase 17: Brand + Lean Canvas + MVV 統合ビュー
 */

'use client';

import { useBrand } from '@/lib/contexts/BrandContext';
import { useMVV } from '@/lib/contexts/MVVContext';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { Collapsible } from './Collapsible';
import { BRAND_POINT_LABELS, BRAND_POINT_ORDER } from '@/lib/types/brand';
import { LEAN_CANVAS_BLOCKS } from '@/lib/types/lean-canvas';

export function UnifiedView() {
  const { currentBrand, getPointContent } = useBrand();
  const { mvv } = useMVV();
  const { currentCanvas, getBlockContent } = useLeanCanvas();

  if (!currentBrand) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        ブランドを選択すると、統合ビューが表示されます
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* MVV セクション */}
      <Collapsible
        title="MVV（Mission/Vision/Value）"
        subtitle="企業理念・ビジョン"
        icon="🎯"
        defaultOpen={true}
        headerColor="rgba(239, 68, 68, 0.15)"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Mission */}
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>🎯</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>Mission</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
              {mvv?.mission || '未設定'}
            </p>
          </div>

          {/* Vision */}
          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>🔭</span>
              <span style={{ fontWeight: 600, color: '#8b5cf6' }}>Vision</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
              {mvv?.vision || '未設定'}
            </p>
          </div>

          {/* Values */}
          <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>💎</span>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>Values</span>
            </div>
            {mvv?.values && mvv.values.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {mvv.values.map((v, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '4px' }}>
                    {v}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>未設定</p>
            )}
          </div>
        </div>
      </Collapsible>

      {/* Brand セクション */}
      <Collapsible
        title="ブランド戦略（10ポイント）"
        subtitle={currentBrand.name}
        icon="✨"
        headerColor="rgba(139, 92, 246, 0.15)"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {BRAND_POINT_ORDER.map((pointType) => {
            const label = BRAND_POINT_LABELS[pointType];
            const content = getPointContent(pointType);
            return (
              <div
                key={pointType}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginBottom: '6px' }}>
                  {label.label}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: content ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                  lineHeight: 1.5,
                }}>
                  {content || '未設定'}
                </p>
              </div>
            );
          })}
        </div>
      </Collapsible>

      {/* Lean Canvas セクション */}
      <Collapsible
        title="Lean Canvas"
        subtitle={currentCanvas?.title || 'キャンバスを選択'}
        icon="📋"
        headerColor="rgba(6, 182, 212, 0.15)"
      >
        {currentCanvas ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {LEAN_CANVAS_BLOCKS.map((block) => {
              const blockData = getBlockContent(block.type);
              return (
                <div
                  key={block.type}
                  style={{
                    padding: '12px',
                    background: `${block.color}15`,
                    border: `1px solid ${block.color}30`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: block.color, marginBottom: '6px' }}>
                    {block.label}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: blockData?.content ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                    lineHeight: 1.4,
                  }}>
                    {blockData?.content || '未設定'}
                  </p>
                  {blockData?.items && blockData.items.length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: '16px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {blockData.items.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                      {blockData.items.length > 3 && (
                        <li style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          他 {blockData.items.length - 3} 件
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            Lean Canvas を選択してください
          </div>
        )}
      </Collapsible>
    </div>
  );
}
