'use client';

/**
 * app/(app)/tasks/page.tsx
 *
 * タスク管理ページ（Phase 1 → Phase 9 全面刷新）
 * - アイゼンハワーマトリクス（4象限）ボード
 * - Jokerゾーン（未分類タスク）
 * - ドラッグ&ドロップで象限移動
 * - Supabase連携（ワークスペーススコープ）
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ClipboardList,
  ListChecks,
  Clock,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { Task, Suit, TaskStatus } from '@/lib/types/task';
import TodoBoard from './_components/TodoBoard';
import AddTaskForm from './_components/AddTaskForm';
import TaskDetailModal from './_components/TaskDetailModal';
import SyncButton from './_components/SyncButton';

export default function TasksPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /** タスク一覧を取得 */
  const fetchTasks = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `/api/tasks?workspace_id=${currentWorkspace.id}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'タスクの取得に失敗しました');
        return;
      }
      setTasks(json.tasks ?? []);
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchTasks();
    }
  }, [currentWorkspace, fetchTasks]);

  /** タスク作成 */
  const handleCreate = async (data: {
    title: string;
    description: string;
    suit: Suit | null;
    scheduled_date: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '作成に失敗しました');
        return false;
      }

      setTasks((prev) => [json.task, ...prev]);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** 象限変更（ドラッグ&ドロップ） */
  const handleSuitChange = async (taskId: string, suit: Suit | null) => {
    // 楽観的更新
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, suit } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suit }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        fetchTasks();
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? json.task : t))
      );
    } catch {
      setError('ネットワークエラーが発生しました');
      fetchTasks();
    }
  };

  /** ステータス変更 */
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    // 楽観的更新
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        fetchTasks();
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? json.task : t))
      );
    } catch {
      setError('ネットワークエラーが発生しました');
      fetchTasks();
    }
  };

  /** タスク更新 */
  const handleUpdate = async (
    data: Record<string, string | number | null>
  ): Promise<boolean> => {
    if (!selectedTask) return false;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        return false;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? json.task : t))
      );
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** タスク削除 */
  const handleDelete = async (taskId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return false;
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask(null);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** 統計計算 */
  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    notStarted: tasks.filter((t) => t.status === 'not_started').length,
    progressRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === 'done').length / tasks.length) *
              100
          )
        : 0,
  };

  if (wsLoading || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="card">
        <div className="empty-state">
          <AlertCircle size={64} className="empty-state-icon" />
          <p>ワークスペースが選択されていません</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">
            <ClipboardList size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            全タスク
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.done}</div>
          <div className="stat-label">
            <ListChecks size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            完了
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">
            <Loader size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            進行中
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.notStarted}</div>
          <div className="stat-label">
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            未着手
          </div>
        </div>
      </div>

      {/* 進捗バー */}
      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
              color: 'var(--text-light)',
            }}
          >
            <span>進捗率</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
              {stats.progressRate}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.progressRate}%` }}
            />
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '16px',
              }}
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* 追加ボタン + 同期ボタン */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
        <SyncButton
          workspaceId={currentWorkspace.id}
          onSyncComplete={fetchTasks}
        />
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          タスクを追加
        </button>
      </div>

      {/* 4象限ボード */}
      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList size={64} className="empty-state-icon" />
            <p>タスクがありません</p>
            <p style={{ fontSize: 14 }}>
              上のボタンからタスクを追加してみましょう
            </p>
          </div>
        </div>
      ) : (
        <TodoBoard
          tasks={tasks}
          onSuitChange={handleSuitChange}
          onStatusChange={handleStatusChange}
          onSelect={setSelectedTask}
        />
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddTaskForm
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
