/**
 * app/_components/todo/task-history-report/RecentLogsView.tsx
 *
 * 直近のログビュー（taskLogs）
 */

'use client';

import React, { useState, useMemo } from 'react';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { SuitBadge } from './SuitBadge';
import { formatDate, formatMinutes } from './utils';
import type { RecentLogsViewProps } from './types';

export function RecentLogsView({ logs }: RecentLogsViewProps) {
  // 日付ごとにグループ化
  const logsByDate = useMemo(() => {
    const grouped = new Map<string, typeof logs>();
    for (const log of logs) {
      const date = log.completedDate;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(log);
    }
    // 日付降順でソート
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    new Set(logsByDate.slice(0, 3).map(([date]) => date))
  );

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-light)',
        }}
      >
        <History size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p>まだ完了したタスクがありません</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {logsByDate.map(([date, dayLogs]) => {
        const isExpanded = expandedDates.has(date);
        const totalMinutes = dayLogs.reduce(
          (sum, log) => sum + (log.actualMinutes ?? log.plannedMinutes ?? 0),
          0
        );

        return (
          <div
            key={date}
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
            }}
          >
            {/* 日付ヘッダー */}
            <button
              onClick={() => toggleDate(date)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                border: 'none',
                background: isExpanded ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatDate(date)}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '13px',
                  color: 'var(--text-light)',
                }}
              >
                {dayLogs.length}件 / {formatMinutes(totalMinutes)}
              </span>
            </button>

            {/* ログ一覧 */}
            {isExpanded && (
              <div style={{ padding: '8px 16px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: '#fafafa',
                        borderRadius: '8px',
                      }}
                    >
                      <SuitBadge suit={log.suit} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {log.title}
                        </div>
                        {log.isElasticHabit && log.elasticLevel && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              background: '#e8f5e9',
                              color: '#2e7d32',
                              borderRadius: '4px',
                            }}
                          >
                            習慣（{log.elasticLevel === 'ume' ? '梅' : log.elasticLevel === 'take' ? '竹' : '松'}）
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        {formatMinutes(log.actualMinutes ?? log.plannedMinutes ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
