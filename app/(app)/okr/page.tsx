'use client';

/**
 * app/(app)/okr/page.tsx
 *
 * OKR 管理ページ（Phase 11）
 * - Objective 一覧（進捗バー付き）
 * - Key Result CRUD + 進捗更新
 * - Action Map 紐付け
 * - ボトムアップ進捗計算（KR → Objective）
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  Target,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import WorkspaceGuard from '@/components/WorkspaceGuard';
import type { Objective } from '@/lib/types/okr';
import type { ActionMap } from '@/lib/types/action-map';
import ObjectiveCard from './_components/ObjectiveCard';

// Phase 87: Dynamic import for modal component (loaded on demand)
const AddObjectiveForm = dynamic(
  () => import('./_components/AddObjectiveForm'),
  { ssr: false }
);

export default function OkrPage() {
  const { currentWorkspace } = useWorkspace();

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [actionMaps, setActionMaps] = useState<ActionMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  /** データ取得 */
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    setError('');

    try {
      const [objRes, mapsRes] = await Promise.all([
        fetch(`/api/objectives?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/action-maps?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const objJson = await objRes.json();
      if (!objRes.ok) {
        setError(objJson.error || 'Objective の取得に失敗しました');
        return;
      }
      setObjectives(objJson.objectives ?? []);

      const mapsJson = await mapsRes.json();
      if (mapsRes.ok) {
        setActionMaps(mapsJson.actionMaps ?? []);
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

  /** Objective 作成 */
  const handleCreateObjective = async (data: {
    title: string;
    description: string;
    period: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const res = await fetch('/api/objectives', {
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

      setObjectives((prev) => [json.objective, ...prev]);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** Objective 削除 */
  const handleDeleteObjective = async (objId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/objectives/${objId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return false;
      }

      setObjectives((prev) => prev.filter((o) => o.id !== objId));
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** KeyResult 追加 */
  const handleAddKr = async (
    objectiveId: string,
    data: { title: string; target_value: number; unit: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/objectives/${objectiveId}/key-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Key Result の作成に失敗しました');
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

  /** KeyResult 更新 */
  const handleUpdateKr = async (
    krId: string,
    data: Record<string, string | number>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/key-results/${krId}`, {
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

  /** KeyResult 削除 */
  const handleDeleteKr = async (krId: string): Promise<boolean> => {
    if (!confirm('この Key Result を削除しますか？')) return false;

    try {
      const res = await fetch(`/api/key-results/${krId}`, {
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

  /** ActionMap ↔ KeyResult 紐付け / 解除 */
  const handleLinkActionMap = async (
    actionMapId: string,
    keyResultId: string | null
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/action-maps/${actionMapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_result_id: keyResultId }),
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
  const activeObjectives = objectives.filter((o) => !o.isArchived);
  const totalKrs = activeObjectives.reduce(
    (sum, o) => sum + (o.keyResults?.length ?? 0),
    0
  );
  const avgProgress =
    activeObjectives.length > 0
      ? Math.round(
          activeObjectives.reduce(
            (sum, o) => sum + (o.progressRate ?? 0),
            0
          ) / activeObjectives.length
        )
      : 0;

  return (
    <WorkspaceGuard>
    <div>
      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : activeObjectives.length}</div>
          <div className="stat-label">
            <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Objectives
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : totalKrs}</div>
          <div className="stat-label">
            <BarChart3 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Key Results
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : `${avgProgress}%`}</div>
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
          Objective を追加
        </button>
      </div>

      {/* Objective リスト */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : activeObjectives.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Target size={64} className="empty-state-icon" />
            <p>Objective がありません</p>
            <p style={{ fontSize: 14 }}>
              目標を設定して、Key Result で進捗を管理しましょう
            </p>
          </div>
        </div>
      ) : (
        <div className="okr-objective-list">
          {activeObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              actionMaps={actionMaps}
              onAddKr={handleAddKr}
              onUpdateKr={handleUpdateKr}
              onDeleteKr={handleDeleteKr}
              onLinkActionMap={handleLinkActionMap}
              onDeleteObjective={handleDeleteObjective}
            />
          ))}
        </div>
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddObjectiveForm
          onSubmit={handleCreateObjective}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
    </WorkspaceGuard>
  );
}
