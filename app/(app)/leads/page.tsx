'use client';

/**
 * app/(app)/leads/page.tsx
 *
 * リード管理ページ（Phase 6, Phase 8 拡張）
 * - カンバン / リスト表示切替
 * - ステータスフィルター
 * - 検索機能
 * - リード CRUD
 * - アプローチ統計（Phase 8）
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Users,
  TrendingUp,
  Target,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import {
  ALL_STATUSES,
  PROSPECT_STATUS_LABELS,
  type Prospect,
  type ProspectStatus,
} from '@/lib/types/prospect';
import type { Approach } from '@/lib/types/approach';
import KanbanView from './_components/KanbanView';
import ListView from './_components/ListView';

// Phase 87: Dynamic imports for modal components (loaded on demand)
const AddProspectForm = dynamic(
  () => import('./_components/AddProspectForm'),
  { ssr: false }
);
const ProspectDetailModal = dynamic(
  () => import('./_components/ProspectDetailModal'),
  { ssr: false }
);
const ApproachStatsSection = dynamic(
  () => import('./_components/ApproachStatsSection'),
  { ssr: false }
);

type ViewMode = 'kanban' | 'list';

export default function LeadsPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [leads, setLeads] = useState<Prospect[]>([]);
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  /** リード一覧とアプローチ一覧を取得 */
  const fetchLeads = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    setError('');

    try {
      const [leadsRes, approachesRes] = await Promise.all([
        fetch(`/api/leads?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/approaches?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const leadsJson = await leadsRes.json();
      if (!leadsRes.ok) {
        setError(leadsJson.error || 'リードの取得に失敗しました');
        return;
      }
      setLeads(leadsJson.leads ?? []);

      if (approachesRes.ok) {
        const approachesJson = await approachesRes.json();
        setApproaches(approachesJson.approaches ?? []);
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchLeads();
    }
  }, [currentWorkspace, fetchLeads]);

  /** リード作成 */
  const handleCreate = async (data: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    channel: string;
    memo: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const res = await fetch('/api/leads', {
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

      setLeads((prev) => [json.lead, ...prev]);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** ステータス変更 */
  const handleStatusChange = async (prospectId: string, newStatus: ProspectStatus) => {
    try {
      const res = await fetch(`/api/leads/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        return;
      }

      setLeads((prev) =>
        prev.map((p) => (p.id === prospectId ? json.lead : p))
      );
    } catch {
      setError('ネットワークエラーが発生しました');
    }
  };

  /** リード更新 */
  const handleUpdate = async (data: Record<string, string>): Promise<boolean> => {
    if (!selectedProspect) return false;

    try {
      const res = await fetch(`/api/leads/${selectedProspect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        return false;
      }

      setLeads((prev) =>
        prev.map((p) => (p.id === selectedProspect.id ? json.lead : p))
      );
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** リード削除 */
  const handleDelete = async (prospectId: string) => {
    if (!confirm('このリードを削除しますか？')) return;

    try {
      const res = await fetch(`/api/leads/${prospectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return;
      }

      setLeads((prev) => prev.filter((p) => p.id !== prospectId));
    } catch {
      setError('ネットワークエラーが発生しました');
    }
  };

  /** フィルター・検索適用 */
  const filteredLeads = leads.filter((lead) => {
    // ステータスフィルター
    if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }
    // 検索フィルター
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        lead.companyName.toLowerCase().includes(q) ||
        lead.contactPerson.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /** 統計計算 */
  const stats = {
    total: leads.length,
    active: leads.filter((l) => !['won', 'lost'].includes(l.status)).length,
    won: leads.filter((l) => l.status === 'won').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };

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
          <div className="stat-value">{loading ? '--' : stats.total}</div>
          <div className="stat-label">
            <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            全リード
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.active}</div>
          <div className="stat-label">
            <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            進行中
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.won}</div>
          <div className="stat-label">
            <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            受注
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {loading ? '--' : stats.total > 0
              ? `${Math.round((stats.won / stats.total) * 100)}%`
              : '0%'}
          </div>
          <div className="stat-label">受注率</div>
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

      {/* ツールバー */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="leads-toolbar">
          {/* 検索 */}
          <div className="leads-search">
            <Search size={16} className="leads-search-icon" />
            <input
              type="text"
              placeholder="会社名・担当者名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="leads-search-input"
            />
          </div>

          {/* フィルター */}
          <div className="leads-filter">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ProspectStatus | 'all')
              }
              className="leads-filter-select"
            >
              <option value="all">全ステータス</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROSPECT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* ビュー切替 */}
          <div className="leads-view-toggle">
            <button
              className={`leads-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="カンバン表示"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`leads-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="リスト表示"
            >
              <List size={18} />
            </button>
          </div>

          {/* 追加ボタン */}
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} />
            リードを追加
          </button>
        </div>
      </div>

      {/* メインビュー */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView
          prospects={filteredLeads}
          onSelect={setSelectedProspect}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <ListView
          prospects={filteredLeads}
          onSelect={setSelectedProspect}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {/* 受注・失注一覧（カンバンモード時） */}
      {viewMode === 'kanban' && (
        <div style={{ marginTop: '24px' }}>
          {leads.filter((l) => l.status === 'won').length > 0 && (
            <div className="card">
              <h3 style={{ color: 'var(--success)', marginBottom: '12px' }}>
                <Target size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                受注 ({leads.filter((l) => l.status === 'won').length})
              </h3>
              <div className="leads-won-lost-grid">
                {leads
                  .filter((l) => l.status === 'won')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="leads-won-lost-item"
                      onClick={() => setSelectedProspect(p)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedProspect(p);
                      }}
                    >
                      <strong>{p.companyName}</strong>
                      <span>{p.contactPerson}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {leads.filter((l) => l.status === 'lost').length > 0 && (
            <div className="card">
              <h3 style={{ color: 'var(--error)', marginBottom: '12px' }}>
                失注 ({leads.filter((l) => l.status === 'lost').length})
              </h3>
              <div className="leads-won-lost-grid">
                {leads
                  .filter((l) => l.status === 'lost')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="leads-won-lost-item"
                      onClick={() => setSelectedProspect(p)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedProspect(p);
                      }}
                    >
                      <strong>{p.companyName}</strong>
                      <span>{p.contactPerson}</span>
                      {p.lostReason && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {p.lostReason}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* アプローチ統計（Phase 8） */}
      {approaches.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <ApproachStatsSection approaches={approaches} />
        </div>
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddProspectForm
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onUpdate={handleUpdate}
          onClose={() => setSelectedProspect(null)}
        />
      )}
    </div>
  );
}
