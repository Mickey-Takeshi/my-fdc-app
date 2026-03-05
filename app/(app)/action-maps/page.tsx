'use client';

/**
 * app/(app)/action-maps/page.tsx
 *
 * Action Map 管理ページ（Phase 10）
 * - ActionMap 一覧（進捗バー付き）
 * - ActionItem CRUD
 * - Task 紐付け
 * - ボトムアップ進捗計算
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  Map,
  Target,
  TrendingUp,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { ActionMap } from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';
import ActionMapCard from './_components/ActionMapCard';

// Phase 87: Dynamic import for modal component (loaded on demand)
const AddActionMapForm = dynamic(
  () => import('./_components/AddActionMapForm'),
  { ssr: false }
);

export default function ActionMapsPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [actionMaps, setActionMaps] = useState<ActionMap[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  /** データ取得 */
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    setError('');

    try {
      const [mapsRes, tasksRes] = await Promise.all([
        fetch(`/api/action-maps?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/tasks?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const mapsJson = await mapsRes.json();
      if (!mapsRes.ok) {
        setError(mapsJson.error || 'Action Map の取得に失敗しました');
        return;
      }
      setActionMaps(mapsJson.actionMaps ?? []);

      const tasksJson = await tasksRes.json();
      if (tasksRes.ok) {
        setTasks(tasksJson.tasks ?? []);
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchData();
    }
  }, [currentWorkspace, fetchData]);

  /** ActionMap 作成 */
  const handleCreateMap = async (data: {
    title: string;
    description: string;
    target_period_start: string;
    target_period_end: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const res = await fetch('/api/action-maps', {
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

      setActionMaps((prev) => [json.actionMap, ...prev]);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** ActionMap 削除 */
  const handleDeleteMap = async (mapId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/action-maps/${mapId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return false;
      }

      setActionMaps((prev) => prev.filter((m) => m.id !== mapId));
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** ActionItem 追加 */
  const handleAddItem = async (
    actionMapId: string,
    data: { title: string; description: string; priority: string; due_date: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/action-maps/${actionMapId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'ActionItem の作成に失敗しました');
        return false;
      }

      // 全体をリフレッシュ（進捗計算があるため）
      await fetchData();
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** ActionItem 更新 */
  const handleUpdateItem = async (
    itemId: string,
    data: Record<string, string | number | null>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '更新に失敗しました');
        return false;
      }

      await fetchData();
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** ActionItem 削除 */
  const handleDeleteItem = async (itemId: string): Promise<boolean> => {
    if (!confirm('この ActionItem を削除しますか？')) return false;

    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return false;
      }

      await fetchData();
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** タスク紐付け / 解除 */
  const handleLinkTask = async (
    taskId: string,
    actionItemId: string | null
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_item_id: actionItemId }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '紐付けに失敗しました');
        return false;
      }

      await fetchData();
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** 統計計算 */
  const activeMaps = actionMaps.filter((m) => !m.isArchived);
  const totalItems = activeMaps.reduce((sum, m) => sum + (m.items?.length ?? 0), 0);
  const avgProgress = activeMaps.length > 0
    ? Math.round(activeMaps.reduce((sum, m) => sum + (m.progressRate ?? 0), 0) / activeMaps.length)
    : 0;

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
          <div className="stat-value">{activeMaps.length}</div>
          <div className="stat-label">
            <Map size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Action Map
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalItems}</div>
          <div className="stat-label">
            <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Action Items
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgProgress}%</div>
          <div className="stat-label">
            <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            平均進捗
          </div>
        </div>
      </div>

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

      {/* 追加ボタン */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          Action Map を追加
        </button>
      </div>

      {/* ActionMap リスト */}
      {activeMaps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Map size={64} className="empty-state-icon" />
            <p>Action Map がありません</p>
            <p style={{ fontSize: 14 }}>
              施策を整理して、タスクと紐付けましょう
            </p>
          </div>
        </div>
      ) : (
        <div className="action-map-list">
          {activeMaps.map((map) => (
            <ActionMapCard
              key={map.id}
              actionMap={map}
              tasks={tasks}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onLinkTask={handleLinkTask}
              onDeleteMap={handleDeleteMap}
            />
          ))}
        </div>
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddActionMapForm
          onSubmit={handleCreateMap}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
