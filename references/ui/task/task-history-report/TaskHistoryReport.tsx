/**
 * app/_components/todo/task-history-report/TaskHistoryReport.tsx
 *
 * Phase 10: タスク履歴レポートUI（メインコンポーネント）
 *
 * 【機能】
 * - taskLogs（過去7日の詳細ログ）の表示
 * - dailySummaries（過去8-90日の日別サマリー）の表示
 * - monthlySummaries（91日以降の月別サマリー）の表示
 * - 象限別時間の可視化
 */

'use client';

import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { RecentLogsView } from './RecentLogsView';
import { DailySummariesView } from './DailySummariesView';
import { MonthlySummariesView } from './MonthlySummariesView';
import { formatMinutes } from './utils';
import type { TaskHistoryReportProps, ViewTab } from './types';

export function TaskHistoryReport({
  taskLogs,
  dailySummaries,
  monthlySummaries,
}: TaskHistoryReportProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('recent');

  // 統計サマリー
  const stats = useMemo(() => {
    const totalLogs = taskLogs.length;
    const totalDailyMinutes = dailySummaries.reduce((sum, s) => sum + s.totalMinutes, 0);
    const totalMonthlyMinutes = monthlySummaries.reduce((sum, s) => sum + s.totalMinutes, 0);
    const totalMinutes =
      taskLogs.reduce((sum, l) => sum + (l.actualMinutes ?? l.plannedMinutes ?? 0), 0) +
      totalDailyMinutes +
      totalMonthlyMinutes;

    return {
      totalLogs,
      totalDays: dailySummaries.length,
      totalMonths: monthlySummaries.length,
      totalMinutes,
    };
  }, [taskLogs, dailySummaries, monthlySummaries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
          }}
        >
          <History size={20} />
          タスク履歴
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
          累計 {formatMinutes(stats.totalMinutes)}
        </span>
      </div>

      {/* タブ切り替え */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-gray)',
          borderRadius: '8px',
          padding: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('recent')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'recent' ? 'white' : 'transparent',
            boxShadow: activeTab === 'recent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'recent' ? 600 : 400,
            color: activeTab === 'recent' ? 'var(--text-dark)' : 'var(--text-light)',
          }}
        >
          直近7日 ({taskLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'daily' ? 'white' : 'transparent',
            boxShadow: activeTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'daily' ? 600 : 400,
            color: activeTab === 'daily' ? 'var(--text-dark)' : 'var(--text-light)',
          }}
        >
          日別 ({dailySummaries.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'monthly' ? 'white' : 'transparent',
            boxShadow: activeTab === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'monthly' ? 600 : 400,
            color: activeTab === 'monthly' ? 'var(--text-dark)' : 'var(--text-light)',
          }}
        >
          月別 ({monthlySummaries.length})
        </button>
      </div>

      {/* コンテンツ */}
      <div>
        {activeTab === 'recent' && <RecentLogsView logs={taskLogs} />}
        {activeTab === 'daily' && <DailySummariesView summaries={dailySummaries} />}
        {activeTab === 'monthly' && <MonthlySummariesView summaries={monthlySummaries} />}
      </div>
    </div>
  );
}

export default TaskHistoryReport;
