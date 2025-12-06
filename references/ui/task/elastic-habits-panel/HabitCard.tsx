/**
 * app/_components/todo/elastic-habits-panel/HabitCard.tsx
 *
 * 習慣カードコンポーネント
 */

'use client';

import React from 'react';
import { Flame, Edit2 } from 'lucide-react';
import type { ElasticLevel } from '@/lib/types/todo';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { SuitIcon } from './SuitIcon';
import type { HabitCardProps } from './types';

export function HabitCard({ habit, onSelectLevel, onEdit, selectionMode }: HabitCardProps) {
  const config = SUIT_CONFIG[habit.suit];

  // 選択モード時: 指定されたスートとレベルのみ強調
  const isTargetSuit = selectionMode?.active && selectionMode.suit === habit.suit;
  const targetLevel = selectionMode?.level;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${config.color}20`,
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `${config.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SuitIcon suit={habit.suit} size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              {habit.title}
            </h4>
            {habit.description && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>
                {habit.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ストリーク */}
          {habit.streakCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#FFF3E0',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#E65100',
              }}
            >
              <Flame size={14} />
              {habit.streakCount}日
            </div>
          )}

          {/* 編集ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              background: 'var(--bg-gray)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
            }}
            title="編集"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>

      {/* 松竹梅ボタン */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['ume', 'take', 'matsu'] as ElasticLevel[]).map((level) => {
          const content = habit.levels[level];
          // スートに応じた色系統: ♥🟥赤系, ♣青系
          const colorsBySuit = {
            heart: {
              ume: { bg: '#FFF5F5', border: '#FFCDD2', text: '#E57373' },
              take: { bg: '#FFEBEE', border: '#EF9A9A', text: '#DC143C' },
              matsu: { bg: '#FFCDD2', border: '#DC143C', text: '#B22222' },
            },
            club: {
              ume: { bg: '#F5F9FF', border: '#BBDEFB', text: '#64B5F6' },
              take: { bg: '#E3F2FD', border: '#90CAF9', text: '#1976D2' },
              matsu: { bg: '#BBDEFB', border: '#1976D2', text: '#0D47A1' },
            },
          };
          const c = colorsBySuit[habit.suit][level];

          // 選択モード時: 指定レベル以外はグレーアウト
          const isHighlighted = isTargetSuit && targetLevel === level;
          const isDimmed = selectionMode?.active && !isHighlighted;

          return (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              disabled={isDimmed}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: isHighlighted
                  ? `3px solid ${c.border}`
                  : `1px solid ${isDimmed ? '#e0e0e0' : `${c.border}40`}`,
                borderRadius: '10px',
                background: isDimmed ? '#f5f5f5' : c.bg,
                cursor: isDimmed ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: isDimmed ? 0.5 : 1,
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isHighlighted ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDimmed) {
                  e.currentTarget.style.borderColor = c.border;
                  e.currentTarget.style.transform = isHighlighted ? 'scale(1.05)' : 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDimmed) {
                  e.currentTarget.style.borderColor = isHighlighted ? c.border : `${c.border}40`;
                  e.currentTarget.style.transform = isHighlighted ? 'scale(1.05)' : 'translateY(0)';
                }
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '14px', color: isDimmed ? '#999' : c.text }}>
                {level === 'ume' ? '梅' : level === 'take' ? '竹' : '松'}
              </span>
              <span style={{ fontSize: '11px', color: isDimmed ? '#999' : c.text, opacity: 0.8 }}>
                {content.durationMinutes}分
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: isDimmed ? '#999' : 'var(--text-medium)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  marginTop: '2px',
                }}
              >
                {content.label}
              </span>
              {isHighlighted && (
                <span
                  style={{
                    marginTop: '4px',
                    fontSize: '10px',
                    background: c.text,
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  選択してください
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
