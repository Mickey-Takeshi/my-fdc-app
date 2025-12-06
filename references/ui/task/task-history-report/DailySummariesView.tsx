/**
 * app/_components/todo/task-history-report/DailySummariesView.tsx
 *
 * 日別サマリービュー（dailySummaries）
 */

'use client';

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { TimeDistributionBar } from './TimeDistributionBar';
import { formatDate, formatMinutes } from './utils';
import type { DailySummariesViewProps } from './types';

export function DailySummariesView({ summaries }: DailySummariesViewProps) {
  // 日付降順でソート
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => b.date.localeCompare(a.date));
  }, [summaries]);

  if (summaries.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-light)',
        }}
      >
        <Calendar size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p>日別サマリーがありません</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          7日以上前のタスクが自動集計されます
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sortedSummaries.map((summary) => (
        <div
          key={summary.date}
          style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              {formatDate(summary.date)}
            </span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-light)' }}>
                {summary.taskCount}件
              </span>
              <span style={{ color: 'var(--text-medium)', fontWeight: 500 }}>
                {formatMinutes(summary.totalMinutes)}
              </span>
            </div>
          </div>

          {/* 時間配分バー */}
          <TimeDistributionBar
            spadeMinutes={summary.spadeMinutes}
            heartMinutes={summary.heartMinutes}
            diamondMinutes={summary.diamondMinutes}
            clubMinutes={summary.clubMinutes}
            totalMinutes={summary.totalMinutes}
          />

          {/* 象限別詳細 */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '10px',
              fontSize: '11px',
            }}
          >
            {summary.spadeMinutes > 0 && (
              <span style={{ color: SUIT_CONFIG.spade.color }}>
                ♠ {formatMinutes(summary.spadeMinutes)}
              </span>
            )}
            {summary.heartMinutes > 0 && (
              <span style={{ color: SUIT_CONFIG.heart.color }}>
                ♥ {formatMinutes(summary.heartMinutes)}
              </span>
            )}
            {summary.diamondMinutes > 0 && (
              <span style={{ color: SUIT_CONFIG.diamond.color }}>
                ♦ {formatMinutes(summary.diamondMinutes)}
              </span>
            )}
            {summary.clubMinutes > 0 && (
              <span style={{ color: SUIT_CONFIG.club.color }}>
                ♣ {formatMinutes(summary.clubMinutes)}
              </span>
            )}
            {summary.habitCompletions > 0 && (
              <span style={{ color: '#2e7d32', marginLeft: 'auto' }}>
                習慣 {summary.habitCompletions}回
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
