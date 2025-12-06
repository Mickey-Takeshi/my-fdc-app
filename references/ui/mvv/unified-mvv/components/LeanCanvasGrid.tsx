/**
 * app/_components/mvv/unified-mvv/components/LeanCanvasGrid.tsx
 * リーンキャンバス9要素グリッド
 */

'use client';

import { FileText } from 'lucide-react';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';

interface LeanCanvasGridProps {
  leanCanvas: ReturnType<typeof useLeanCanvasViewModel>['leanCanvas'];
  editLeanCanvas: ReturnType<typeof useLeanCanvasViewModel>['editLeanCanvas'];
  leanEditMode: boolean;
  updateEditLeanCanvas: ReturnType<typeof useLeanCanvasViewModel>['updateEditLeanCanvas'];
}

export function LeanCanvasGrid({
  leanCanvas,
  editLeanCanvas,
  leanEditMode,
  updateEditLeanCanvas,
}: LeanCanvasGridProps) {
  const gridElements = {
    problem: { key: 'problem' as const, label: 'Problem', sublabel: 'ユーザーが抱える課題', gridColumn: '1 / 2', gridRow: '1 / 3', minHeight: '200px', rows: 14, isHighlight: false, bgLight: false },
    solution: { key: 'solution' as const, label: 'Solution', sublabel: 'ソリューション', gridColumn: '2 / 3', gridRow: '1 / 2', minHeight: '80px', rows: 5, isHighlight: false, bgLight: false },
    uniqueValue: { key: 'uniqueValue' as const, label: 'Unique Value Proposition', sublabel: '独自の価値提案', gridColumn: '3 / 4', gridRow: '1 / 3', minHeight: '200px', rows: 14, isHighlight: true, bgLight: false },
    unfairAdvantage: { key: 'unfairAdvantage' as const, label: 'Unfair Advantage', sublabel: '競合優位性', gridColumn: '4 / 5', gridRow: '1 / 2', minHeight: '80px', rows: 5, isHighlight: false, bgLight: false },
    customerSegment: { key: 'customerSegment' as const, label: 'Customer Segments', sublabel: '顧客セグメント', gridColumn: '5 / 6', gridRow: '1 / 3', minHeight: '200px', rows: 14, isHighlight: false, bgLight: false },
    keyMetrics: { key: 'keyMetrics' as const, label: 'Key Metrics', sublabel: '主要指標', gridColumn: '2 / 3', gridRow: '2 / 3', minHeight: '80px', rows: 5, isHighlight: false, bgLight: true },
    channels: { key: 'channels' as const, label: 'Channels', sublabel: '顧客との接点', gridColumn: '4 / 5', gridRow: '2 / 3', minHeight: '80px', rows: 5, isHighlight: false, bgLight: true },
    costStructure: { key: 'costStructure' as const, label: 'Cost Structure', sublabel: 'コスト構造', gridColumn: '1 / 3', gridRow: '3 / 4', minHeight: '100px', rows: 6, isHighlight: false, bgLight: false },
    revenueStreams: { key: 'revenueStreams' as const, label: 'Revenue Streams', sublabel: '収益の流れ', gridColumn: '3 / 6', gridRow: '3 / 4', minHeight: '100px', rows: 6, isHighlight: false, bgLight: false },
  };
  const elementOrder = ['problem', 'solution', 'uniqueValue', 'unfairAdvantage', 'customerSegment', 'keyMetrics', 'channels', 'costStructure', 'revenueStreams'] as const;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: 'var(--primary-dark)',
        fontSize: '18px',
        fontWeight: '700',
        borderLeft: '4px solid var(--primary)',
        paddingLeft: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FileText size={20} /> リーンキャンバス
      </h3>

      {/* 横スクロールラッパー（スマホ対応） */}
      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '8px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))',
          gridTemplateRows: 'auto auto auto',
          gap: '15px',
          background: 'linear-gradient(135deg, var(--primary-alpha-03) 0%, var(--primary-alpha-08) 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '3px solid var(--primary-alpha-30)',
          minWidth: '900px',
        }}>
        {elementOrder.map((key) => {
          const el = gridElements[key];
          return (
            <div
              key={el.key}
              className="card"
              style={{
                gridColumn: el.gridColumn,
                gridRow: el.gridRow,
                background: el.isHighlight
                  ? 'linear-gradient(135deg, var(--primary-alpha-85) 0%, var(--primary) 100%)'
                  : el.bgLight ? 'var(--primary-alpha-05)' : 'white',
                border: el.isHighlight ? '3px solid var(--primary-dark)' : '2px solid var(--primary-alpha-25)',
                borderRadius: '12px',
                padding: '15px',
              }}
            >
              <h4 style={{
                fontSize: el.isHighlight ? '14px' : '12px',
                color: el.isHighlight ? 'white' : 'var(--primary-dark)',
                marginBottom: '8px',
                fontWeight: el.isHighlight ? '700' : '600',
                textShadow: el.isHighlight ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
              }}>
                {el.label}<br/>{el.sublabel}
              </h4>
              {leanEditMode ? (
                <textarea
                  value={(editLeanCanvas[el.key] as string) || ''}
                  onChange={(e) => updateEditLeanCanvas(el.key, e.target.value)}
                  rows={el.rows}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    fontWeight: el.isHighlight ? '500' : '400',
                    border: '1px solid #e0e0e0',
                    background: el.isHighlight ? 'rgba(255,255,255,0.95)' : 'white',
                    minHeight: el.minHeight,
                    resize: 'vertical',
                    padding: '8px',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: el.isHighlight ? 'white' : '#37474f',
                  fontWeight: el.isHighlight ? '500' : '400',
                  whiteSpace: 'pre-wrap',
                  minHeight: el.minHeight,
                }}>
                  {(leanCanvas[el.key] as string) || '未設定'}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
