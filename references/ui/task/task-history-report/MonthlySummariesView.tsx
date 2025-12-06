/**
 * app/_components/todo/task-history-report/MonthlySummariesView.tsx
 *
 * 月別サマリービュー（monthlySummaries）
 */

'use client';

import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { TimeDistributionBar } from './TimeDistributionBar';
import { formatYearMonth, formatMinutes } from './utils';
import type { MonthlySummariesViewProps } from './types';

export function MonthlySummariesView({ summaries }: MonthlySummariesViewProps) {
  // 年月降順でソート
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
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
        <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p>月別サマリーがありません</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          月初に前月分が自動集計されます
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedSummaries.map((summary) => (
        <div
          key={summary.yearMonth}
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            padding: '16px',
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '16px' }}>
              {formatYearMonth(summary.yearMonth)}
            </span>
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-medium)',
                fontWeight: 500,
              }}
            >
              合計 {formatMinutes(summary.totalMinutes)}
            </span>
          </div>

          {/* 時間配分バー */}
          <TimeDistributionBar
            spadeMinutes={summary.spadeMinutes}
            heartMinutes={summary.heartMinutes}
            diamondMinutes={summary.diamondMinutes}
            clubMinutes={summary.clubMinutes}
            totalMinutes={summary.totalMinutes}
          />

          {/* 統計 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginTop: '14px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                活動日数
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {summary.activeDays}日
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                タスク数
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {summary.totalTaskCount}件
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                習慣達成
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#2e7d32' }}>
                {summary.totalHabitCompletions}回
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                1日平均
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {formatMinutes(summary.avgDailyMinutes)}
              </div>
            </div>
          </div>

          {/* 象限別詳細 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginTop: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: SUIT_CONFIG.spade.color, fontWeight: 600 }}>♠</span>
              <span>{formatMinutes(summary.spadeMinutes)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: SUIT_CONFIG.heart.color, fontWeight: 600 }}>♥</span>
              <span>{formatMinutes(summary.heartMinutes)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: SUIT_CONFIG.diamond.color, fontWeight: 600 }}>♦</span>
              <span>{formatMinutes(summary.diamondMinutes)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: SUIT_CONFIG.club.color, fontWeight: 600 }}>♣</span>
              <span>{formatMinutes(summary.clubMinutes)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
