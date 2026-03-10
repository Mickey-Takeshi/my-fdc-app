'use client';

/**
 * app/(app)/clients/page.tsx
 *
 * クライアント管理ページ（Phase 7）
 * - クライアント一覧（テーブル）
 * - クライアント追加・編集
 * - 失注リード一覧
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  Search,
  Building2,
  UserCheck,
  UserX,
  AlertCircle,
  Trash2,
  Loader,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import WorkspaceGuard from '@/components/WorkspaceGuard';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '@/lib/types/client';
import type { Prospect } from '@/lib/types/prospect';
import { PROSPECT_STATUS_LABELS } from '@/lib/types/prospect';

// Phase 87: Dynamic imports for modal components (loaded on demand)
const AddClientForm = dynamic(
  () => import('./_components/AddClientForm'),
  { ssr: false }
);
const ClientDetailModal = dynamic(
  () => import('./_components/ClientDetailModal'),
  { ssr: false }
);

export default function ClientsPage() {
  const { currentWorkspace } = useWorkspace();

  const [clients, setClients] = useState<Client[]>([]);
  const [lostLeads, setLostLeads] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  /** クライアント一覧を取得 */
  const fetchClients = useCallback(async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    setError('');

    try {
      // クライアントと失注リードを並行取得
      const [clientsRes, leadsRes] = await Promise.all([
        fetch(`/api/clients?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/leads?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const clientsJson = await clientsRes.json();
      const leadsJson = await leadsRes.json();

      if (!clientsRes.ok) {
        setError(clientsJson.error || 'クライアントの取得に失敗しました');
        return;
      }

      setClients(clientsJson.clients ?? []);

      // 失注リードのみ抽出
      if (leadsRes.ok) {
        const allLeads = leadsJson.leads ?? [];
        setLostLeads(allLeads.filter((l: Prospect) => l.status === 'lost'));
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchClients();
    }
  }, [currentWorkspace, fetchClients]);

  /** クライアント作成 */
  const handleCreate = async (data: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    notes: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const res = await fetch('/api/clients', {
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

      setClients((prev) => [json.client, ...prev]);
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** クライアント更新 */
  const handleUpdate = async (data: Record<string, string | null>): Promise<boolean> => {
    if (!selectedClient) return false;

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        return false;
      }

      setClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? json.client : c))
      );
      return true;
    } catch {
      setError('ネットワークエラーが発生しました');
      return false;
    }
  };

  /** クライアント削除 */
  const handleDelete = async (clientId: string) => {
    if (!confirm('このクライアントを削除しますか？')) return;

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || '削除に失敗しました');
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch {
      setError('ネットワークエラーが発生しました');
    }
  };

  /** フィルター・検索適用 */
  const filteredClients = clients.filter((client) => {
    if (statusFilter !== 'all' && client.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        client.companyName.toLowerCase().includes(q) ||
        client.contactPerson.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /** 統計 */
  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    lostLeads: lostLeads.length,
  };

  return (
    <WorkspaceGuard>
    <div>
      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.total}</div>
          <div className="stat-label">
            <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            全クライアント
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.active}</div>
          <div className="stat-label">
            <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            取引中
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.inactive}</div>
          <div className="stat-label">
            <UserX size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            休止中
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '--' : stats.lostLeads}</div>
          <div className="stat-label">失注リード</div>
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

          <div className="leads-filter">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ClientStatus | 'all')
              }
              className="leads-filter-select"
            >
              <option value="all">全ステータス</option>
              {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} />
            クライアントを追加
          </button>
        </div>
      </div>

      {/* クライアント一覧 */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 size={64} className="empty-state-icon" />
            <p>クライアントがいません</p>
            <p style={{ fontSize: 14 }}>
              「クライアントを追加」ボタンから既存客を追加してみましょう
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th>会社名</th>
                <th>担当者</th>
                <th>ステータス</th>
                <th>メール</th>
                <th>電話</th>
                <th>契約期限</th>
                <th>作成日</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <button
                      className="leads-table-link"
                      onClick={() => setSelectedClient(client)}
                    >
                      {client.companyName || client.contactPerson}
                    </button>
                  </td>
                  <td>{client.contactPerson}</td>
                  <td>
                    <span
                      className={`client-status-badge status-${client.status}`}
                    >
                      {CLIENT_STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>
                    {client.contractDeadline
                      ? new Date(client.contractDeadline).toLocaleDateString('ja-JP')
                      : '-'}
                  </td>
                  <td>
                    {new Date(client.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td>
                    <button
                      className="task-delete"
                      onClick={() => handleDelete(client.id)}
                      aria-label="削除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 失注リード一覧 */}
      {lostLeads.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ color: 'var(--error)', marginBottom: '12px' }}>
            <UserX size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            失注リード一覧 ({lostLeads.length})
          </h3>
          <table className="leads-table">
            <thead>
              <tr>
                <th>会社名</th>
                <th>担当者</th>
                <th>ステータス</th>
                <th>失注理由</th>
                <th>作成日</th>
              </tr>
            </thead>
            <tbody>
              {lostLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.companyName}</td>
                  <td>{lead.contactPerson}</td>
                  <td>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(244, 67, 54, 0.1)',
                      color: '#C62828',
                    }}>
                      {PROSPECT_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td>{lead.lostReason || '-'}</td>
                  <td>
                    {new Date(lead.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddClientForm
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onUpdate={handleUpdate}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
    </WorkspaceGuard>
  );
}
