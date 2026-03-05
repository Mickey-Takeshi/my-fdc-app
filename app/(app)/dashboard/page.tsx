'use client';

/**
 * app/(app)/dashboard/page.tsx
 *
 * ダッシュボードページ
 * Phase 13: 今日のカレンダー予定を統合表示
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  CheckSquare,
  TrendingUp,
  Calendar,
  Loader,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import TodaySchedule from './_components/TodaySchedule';

interface DashboardStats {
  totalTasks: number;
  doneTasks: number;
  progressRate: number;
  totalObjectives: number;
}

export default function DashboardPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    doneTasks: 0,
    progressRate: 0,
    totalObjectives: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [tasksRes, objRes] = await Promise.all([
        fetch(`/api/tasks?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/objectives?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const tasks = tasksData.tasks ?? [];
        const done = tasks.filter(
          (t: { status: string }) => t.status === 'done'
        ).length;
        setStats((prev) => ({
          ...prev,
          totalTasks: tasks.length,
          doneTasks: done,
          progressRate:
            tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
        }));
      }

      if (objRes.ok) {
        const objData = await objRes.json();
        const objectives = (objData.objectives ?? []).filter(
          (o: { isArchived: boolean }) => !o.isArchived
        );
        setStats((prev) => ({
          ...prev,
          totalObjectives: objectives.length,
        }));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchStats();
    }
  }, [currentWorkspace, fetchStats]);

  if (wsLoading || !currentWorkspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.totalTasks}</div>
          <div className="stat-label">
            <CheckSquare size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            タスク
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.doneTasks}</div>
          <div className="stat-label">
            <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            完了
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : `${stats.progressRate}%`}</div>
          <div className="stat-label">
            <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            進捗率
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.totalObjectives}</div>
          <div className="stat-label">
            <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            OKR
          </div>
        </div>
      </div>

      {/* 今日の予定 */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ marginTop: '24px' }}>
          <TodaySchedule
            workspaceId={currentWorkspace.id}
            onTaskCreated={fetchStats}
          />
        </div>
      )}
    </div>
  );
}
