/**
 * app/_components/admin/sa-dashboard/TenantManagementTable.tsx
 *
 * 【Phase 14.4】テナント管理テーブル（SA専用）
 *
 * 【機能】
 * - テナント一覧表示（サブドメイン、名前、プラン、WS数、ユーザー数）
 * - テナント編集・削除
 */

'use client';

import { useState } from 'react';
import { Building2, Edit, Trash2, Users, FolderKanban, ExternalLink, Eye } from 'lucide-react';

// ========================================
// 型定義
// ========================================

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: 'standard' | 'custom';
  theme: Record<string, unknown>;
  features: Record<string, boolean>;
  created_at: string;
  workspace_count?: number;
  user_count?: number;
}

interface TenantManagementTableProps {
  tenants: Tenant[];
  loading: boolean;
  error?: string;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => Promise<void>;
  onDetail: (tenant: Tenant) => void;
  deleteLoading: boolean;
}

// ========================================
// スタイル
// ========================================

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-dark)',
    margin: 0,
  },
  description: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    borderBottom: '2px solid var(--border-color)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '14px',
  },
  subdomain: {
    fontFamily: 'monospace',
    backgroundColor: 'var(--bg-gray)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  planBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  planStandard: {
    backgroundColor: 'var(--primary-alpha-15)',
    color: 'var(--primary-dark)',
  },
  planCustom: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: 'var(--primary-alpha-15)',
    color: 'var(--primary-dark)',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  linkBtn: {
    backgroundColor: 'var(--primary-alpha-10)',
    color: 'var(--primary)',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'var(--text-muted)',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'var(--text-muted)',
  },
};

// ========================================
// コンポーネント
// ========================================

export function TenantManagementTable({
  tenants,
  loading,
  error,
  onEdit,
  onDelete,
  onDetail,
  deleteLoading,
}: TenantManagementTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (tenant: Tenant) => {
    if (tenant.subdomain === 'app') {
      alert('デフォルトテナント（app）は削除できません');
      return;
    }

    const confirmMsg = `テナント「${tenant.name}」を削除しますか？\n\n関連するワークスペース・ユーザーも削除されます。\nこの操作は取り消せません。`;
    if (!confirm(confirmMsg)) return;

    setDeletingId(tenant.id);
    try {
      await onDelete(tenant.id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTenantUrl = (subdomain: string) => {
    return `https://${subdomain}.foundersdirect.jp`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Building2 size={24} color="var(--primary)" />
        <h3 style={styles.title}>テナント管理</h3>
      </div>

      <p style={styles.description}>
        テナント（顧客企業）の作成・編集・削除を行います。各テナントは独自のサブドメイン（例:
        tom.foundersdirect.jp）を持ちます。
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>読み込み中...</div>
      ) : tenants.length === 0 ? (
        <div style={styles.empty}>テナントがありません</div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ ...styles.table, minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={styles.th}>サブドメイン</th>
              <th style={styles.th}>テナント名</th>
              <th style={styles.th}>プラン</th>
              <th style={styles.th}>WS数</th>
              <th style={styles.th}>ユーザー数</th>
              <th style={styles.th}>作成日</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td style={styles.td}>
                  <code style={styles.subdomain}>{tenant.subdomain}</code>
                </td>
                <td style={styles.td}>{tenant.name}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.planBadge,
                      ...(tenant.plan === 'custom' ? styles.planCustom : styles.planStandard),
                    }}
                  >
                    {tenant.plan === 'custom' ? 'カスタム' : 'スタンダード'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.stat}>
                    <FolderKanban size={14} />
                    {tenant.workspace_count ?? 0}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.stat}>
                    <Users size={14} />
                    {tenant.user_count ?? 0}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(tenant.created_at)}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.linkBtn }}
                      onClick={() => onDetail(tenant)}
                      title="詳細を見る"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.linkBtn }}
                      onClick={() => window.open(getTenantUrl(tenant.subdomain), '_blank')}
                      title="テナントサイトを開く"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => onEdit(tenant)}
                      title="編集"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => handleDelete(tenant)}
                      disabled={deleteLoading || deletingId === tenant.id}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
