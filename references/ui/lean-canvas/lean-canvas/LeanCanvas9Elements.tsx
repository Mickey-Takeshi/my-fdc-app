'use client';

import { memo } from 'react';
import { FileText } from 'lucide-react';
import type { LeanCanvasViewModel } from './types';

interface LeanCanvas9ElementsProps {
  vm: LeanCanvasViewModel;
}

// スマホ用のスタイル
const mobileStyles = `
  @media (max-width: 768px) {
    .lean-canvas-grid {
      grid-template-columns: 1fr !important;
      padding: 12px !important;
      gap: 12px !important;
    }
    .lean-canvas-grid > div {
      grid-column: 1 / -1 !important;
      grid-row: auto !important;
    }
  }
`;

// 旧UIの配置に合わせた要素定義
const gridElements = {
  // Row 1-2 左端: Problem（2行分）
  problem: {
    key: 'problem' as const,
    label: 'Problem',
    sublabel: 'ユーザーが抱える課題',
    placeholder: '例：外注依存・仕様伝達コスト・自分で創れない閉塞感',
    gridColumn: '1 / 2',
    gridRow: '1 / 3',
    minHeight: '200px',
    rows: 14,
    border: 'var(--primary-alpha-40)',
    isHighlight: false,
    bgLight: false
  },
  // Row 1 2列目: Solution
  solution: {
    key: 'solution' as const,
    label: 'Solution',
    sublabel: 'ソリューション',
    placeholder: '例：Founders × AI × Direct Creation',
    gridColumn: '2 / 3',
    gridRow: '1 / 2',
    minHeight: '80px',
    rows: 5,
    border: 'var(--primary-alpha-25)',
    isHighlight: false,
    bgLight: false
  },
  // Row 1-2 中央: Unique Value Proposition（2行分、ハイライト）
  uniqueValue: {
    key: 'uniqueValue' as const,
    label: 'Unique Value Proposition',
    sublabel: '独自の価値提案',
    placeholder: '例：創造の自由を、すべての創業者へ',
    gridColumn: '3 / 4',
    gridRow: '1 / 3',
    minHeight: '200px',
    rows: 14,
    border: 'var(--primary-dark)',
    isHighlight: true,
    bgLight: false
  },
  // Row 1 4列目: Unfair Advantage
  unfairAdvantage: {
    key: 'unfairAdvantage' as const,
    label: 'Unfair Advantage',
    sublabel: '競合優位性',
    placeholder: '例：世界観×AI実装の両立（思想×技術）',
    gridColumn: '4 / 5',
    gridRow: '1 / 2',
    minHeight: '80px',
    rows: 5,
    border: 'var(--primary-alpha-25)',
    isHighlight: false,
    bgLight: false
  },
  // Row 1-2 右端: Customer Segments（2行分）
  customerSegment: {
    key: 'customerSegment' as const,
    label: 'Customer Segments',
    sublabel: '顧客セグメント',
    placeholder: '例：コードを書けない創業者／非技術系ビジネスオーナー',
    gridColumn: '5 / 6',
    gridRow: '1 / 3',
    minHeight: '200px',
    rows: 14,
    border: 'var(--primary-alpha-40)',
    isHighlight: false,
    bgLight: false
  },
  // Row 2 2列目: Key Metrics
  keyMetrics: {
    key: 'keyMetrics' as const,
    label: 'Key Metrics',
    sublabel: '主要指標',
    placeholder: '例：有料会員数、AI生成アプリ数、成約率、五次元移行率',
    gridColumn: '2 / 3',
    gridRow: '2 / 3',
    minHeight: '80px',
    rows: 5,
    border: 'var(--primary-alpha-25)',
    isHighlight: false,
    bgLight: true
  },
  // Row 2 4列目: Channels
  channels: {
    key: 'channels' as const,
    label: 'Channels',
    sublabel: '顧客との接点',
    placeholder: '例：X／LP／ZOOM体験セッション／コミュニティ',
    gridColumn: '4 / 5',
    gridRow: '2 / 3',
    minHeight: '80px',
    rows: 5,
    border: 'var(--primary-alpha-25)',
    isHighlight: false,
    bgLight: true
  },
  // Row 3 左半分: Cost Structure
  costStructure: {
    key: 'costStructure' as const,
    label: 'Cost Structure',
    sublabel: 'コスト構造',
    placeholder: '例：AI API利用料、サーバー費、Claude Codeカスタマイズ工数',
    gridColumn: '1 / 3',
    gridRow: '3 / 4',
    minHeight: '100px',
    rows: 6,
    border: 'var(--primary-alpha-40)',
    isHighlight: false,
    bgLight: false
  },
  // Row 3 右半分: Revenue Streams
  revenueStreams: {
    key: 'revenueStreams' as const,
    label: 'Revenue Streams',
    sublabel: '収益の流れ',
    placeholder: '例：月額SaaS＋共創ラボ＋伴走支援',
    gridColumn: '3 / 6',
    gridRow: '3 / 4',
    minHeight: '100px',
    rows: 6,
    border: 'var(--primary-alpha-40)',
    isHighlight: false,
    bgLight: false
  },
};

const elementOrder = ['problem', 'solution', 'uniqueValue', 'unfairAdvantage', 'customerSegment', 'keyMetrics', 'channels', 'costStructure', 'revenueStreams'] as const;

export const LeanCanvas9Elements = memo(function LeanCanvas9Elements({ vm }: LeanCanvas9ElementsProps) {
  const { leanCanvas, editLeanCanvas, leanEditMode, updateEditLeanCanvas } = vm;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        margin: '30px 0 15px 0',
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

      <style>{mobileStyles}</style>

      {/* 表示モード */}
      {!leanEditMode && (
        <div
          className="lean-canvas-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'auto auto auto',
            gap: '15px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, var(--primary-alpha-03) 0%, var(--primary-alpha-08) 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '3px solid var(--primary-alpha-30)',
            boxSizing: 'border-box',
            maxWidth: '100%',
            overflow: 'hidden',
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
                  border: el.isHighlight ? `3px solid ${el.border}` : `2px solid ${el.border}`,
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
              </div>
            );
          })}
        </div>
      )}

      {/* 編集モード */}
      {leanEditMode && (
        <div
          className="lean-canvas-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'auto auto auto',
            gap: '15px',
            marginBottom: '30px',
            background: '#fafafa',
            padding: '20px',
            borderRadius: '12px',
            border: '3px solid var(--primary)',
            boxSizing: 'border-box',
            maxWidth: '100%',
            overflow: 'hidden',
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
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                    : el.bgLight ? '#f5f5f5' : 'white',
                  border: el.isHighlight ? `3px solid var(--primary-dark)` : `2px solid ${el.border === 'var(--primary-alpha-40)' ? 'var(--primary)' : 'var(--primary-light)'}`,
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
                <textarea
                  value={(editLeanCanvas[el.key] as string) || ''}
                  onChange={(e) => updateEditLeanCanvas(el.key, e.target.value)}
                  placeholder={el.placeholder}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
