/**
 * app/_components/todo/TimeAllocationBar.tsx
 *
 * Phase 10-D-2: 時間有効活用ダッシュボード
 *
 * 【機能】
 * - 5色の横バーで時間配分を可視化
 * - ジョーカー率が低いほど有効活用度が高い
 * - 日次/週次/月次の切り替え
 */

'use client';

import React, { useMemo } from 'react';
import { Clock, Target, Joystick } from 'lucide-react';
import { SUIT_CONFIG, SUIT_ICONS } from '@/lib/types/todo';
import type { Task } from '@/lib/types/todo';
import {
  calculateTaskMinutesBySuit,
  calculateDailyTimeAllocation,
  formatMinutesToHours,
  getEffectivenessStatus,
  DEFAULT_TIME_SETTINGS,
  type TimeSettings,
  type TimeAllocation,
} from '@/lib/types/time-allocation';

// ========================================
// 型定義
// ========================================

interface TimeAllocationBarProps {
  tasks: Task[];
  settings?: TimeSettings;
}

// ========================================
// バーセグメント
// ========================================

interface BarSegment {
  key: string;
  label: string;
  minutes: number;
  color: string;
  percentage: number;
  icon?: string;  // SVGアイコン（スート用）
}

function AllocationBar({ segments }: { segments: BarSegment[]; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '24px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#f5f5f5',
      }}
    >
      {segments.map((segment) => (
        <div
          key={segment.key}
          title={`${segment.label}: ${formatMinutesToHours(segment.minutes)} (${segment.percentage.toFixed(1)}%)`}
          style={{
            width: `${segment.percentage}%`,
            background: segment.color,
            transition: 'width 0.3s ease',
            minWidth: segment.percentage > 0 ? '2px' : '0',
          }}
        />
      ))}
    </div>
  );
}

// ========================================
// 凡例
// ========================================

function Legend({ segments }: { segments: BarSegment[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginTop: '12px',
      }}
    >
      {segments.map((segment) => (
        <div
          key={segment.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          {/* SVGアイコン（スート用）またはJokerアイコン */}
          {segment.icon ? (
            <span
              style={{
                display: 'inline-flex',
                width: '16px',
                height: '16px',
                color: segment.color,
              }}
              dangerouslySetInnerHTML={{ __html: segment.icon }}
            />
          ) : (
            // Joker用：Lucideアイコン表示
            <Joystick size={14} color={segment.color} />
          )}
          <span style={{ color: segment.color, fontWeight: 500 }}>
            {segment.label}
          </span>
          <span style={{ fontWeight: 600 }}>
            {formatMinutesToHours(segment.minutes)}
          </span>
          <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>
            ({segment.percentage.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

// ========================================
// メインコンポーネント
// ========================================

export function TimeAllocationBar({ tasks, settings = DEFAULT_TIME_SETTINGS }: TimeAllocationBarProps) {
  // 今日の日付
  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // 時間配分を計算
  const allocation = useMemo<TimeAllocation>(() => {
    const taskMinutes = calculateTaskMinutesBySuit(tasks);
    return calculateDailyTimeAllocation(today, taskMinutes, settings);
  }, [tasks, today, settings]);

  // バーセグメントを生成
  const segments = useMemo<BarSegment[]>(() => {
    const total = allocation.availableMinutes;
    if (total === 0) return [];

    return [
      {
        key: 'spade',
        label: SUIT_CONFIG.spade.ja, // すぐやる
        minutes: allocation.spadeMinutes,
        color: SUIT_CONFIG.spade.color,
        percentage: (allocation.spadeMinutes / total) * 100,
        icon: SUIT_ICONS.spade,
      },
      {
        key: 'heart',
        label: SUIT_CONFIG.heart.ja, // 予定に入れ実行
        minutes: allocation.heartMinutes,
        color: SUIT_CONFIG.heart.color,
        percentage: (allocation.heartMinutes / total) * 100,
        icon: SUIT_ICONS.heart,
      },
      {
        key: 'diamond',
        label: SUIT_CONFIG.diamond.ja, // 任せる＆自動化
        minutes: allocation.diamondMinutes,
        color: SUIT_CONFIG.diamond.color,
        percentage: (allocation.diamondMinutes / total) * 100,
        icon: SUIT_ICONS.diamond,
      },
      {
        key: 'club',
        label: SUIT_CONFIG.club.ja, // 未来創造20%タイム
        minutes: allocation.clubMinutes,
        color: SUIT_CONFIG.club.color,
        percentage: (allocation.clubMinutes / total) * 100,
        icon: SUIT_ICONS.club,
      },
      {
        key: 'joker',
        label: 'ジョーカー',
        minutes: allocation.jokerMinutes,
        color: '#9E9E9E',
        percentage: (allocation.jokerMinutes / total) * 100,
        // Jokerはアイコンなし（絵文字で表示）
      },
    ];
  }, [allocation]);

  // 効率ステータス
  const status = useMemo(
    () => getEffectivenessStatus(allocation.effectivenessRate, settings.targetEffectiveness),
    [allocation.effectivenessRate, settings.targetEffectiveness]
  );

  // 目標達成まであと何分か
  const minutesToTarget = useMemo(() => {
    const targetMinutes = (allocation.availableMinutes * settings.targetEffectiveness) / 100;
    return Math.max(0, Math.round(targetMinutes - allocation.allocatedMinutes));
  }, [allocation, settings.targetEffectiveness]);

  // 曜日を取得
  const dayOfWeek = useMemo(() => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date().getDay()];
  }, []);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid var(--border)',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            今日の時間配分
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            {today} ({dayOfWeek})
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-medium)' }}>
          活動可能: {formatMinutesToHours(allocation.availableMinutes)}
          <span style={{ color: 'var(--text-light)', marginLeft: '4px' }}>
            (24h - 睡眠{settings.sleepHours}h)
          </span>
        </div>
      </div>

      {/* バー */}
      <AllocationBar segments={segments} total={allocation.availableMinutes} />

      {/* 凡例 */}
      <Legend segments={segments} />

      {/* サマリー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--bg-gray)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Target size={18} style={{ color: status.color }} />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              時間有効活用度:{' '}
              <span style={{ color: status.color, fontSize: '18px' }}>
                {allocation.effectivenessRate.toFixed(1)}%
              </span>
            </span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: `${status.color}20`,
                color: status.color,
                fontWeight: 600,
              }}
            >
              {status.label}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-medium)' }}>
          <span>目標: {settings.targetEffectiveness}%</span>
          {minutesToTarget > 0 && (
            <div style={{ color: 'var(--text-light)', marginTop: '2px' }}>
              あと {formatMinutesToHours(minutesToTarget)} で達成
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeAllocationBar;
