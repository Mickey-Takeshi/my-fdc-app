/**
 * app/_components/todo/task-history-report/types.ts
 *
 * TaskHistoryReport の型定義
 */

import type { TaskLog, DailySummary, MonthlySummary } from '@/lib/types/todo';

export interface TaskHistoryReportProps {
  taskLogs: TaskLog[];
  dailySummaries: DailySummary[];
  monthlySummaries: MonthlySummary[];
}

export type ViewTab = 'recent' | 'daily' | 'monthly';

export interface RecentLogsViewProps {
  logs: TaskLog[];
}

export interface DailySummariesViewProps {
  summaries: DailySummary[];
}

export interface MonthlySummariesViewProps {
  summaries: MonthlySummary[];
}

export interface TimeDistributionBarProps {
  spadeMinutes: number;
  heartMinutes: number;
  diamondMinutes: number;
  clubMinutes: number;
  totalMinutes: number;
}
