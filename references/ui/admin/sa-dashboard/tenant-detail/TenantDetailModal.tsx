/**
 * app/_components/admin/sa-dashboard/tenant-detail/TenantDetailModal.tsx
 *
 * 【Phase 14.4】テナント詳細モーダル（SA専用）
 * リファクタリング: 507行 → 約130行（コンテナ + レイアウト）
 */

'use client';

import { memo } from 'react';
import { X, Building2, RefreshCw } from 'lucide-react';
import { TenantInfoCard } from './TenantInfoCard';
import { WorkspaceList } from './WorkspaceList';
import { UserList } from './UserList';
import { TabConfigSection } from './TabConfigSection';
import { useTenantDetail } from './hooks/useTenantDetail';
import type { TenantDetailModalProps } from './types';

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: 'white',
    zIndex: 10,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  refreshBtn: {
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
  },
  closeBtn: {
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
  },
  body: {
    padding: '24px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};

export const TenantDetailModal = memo(function TenantDetailModal({ isOpen, tenant, onClose }: TenantDetailModalProps) {
  const { loading, error, workspaces, users, fetchDetail } = useTenantDetail(tenant, isOpen);

  if (!isOpen || !tenant) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <Building2 size={24} color="var(--primary)" />
            {tenant.name}
            <code
              style={{
                fontSize: '12px',
                backgroundColor: 'var(--bg-gray)',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {tenant.subdomain}.foundersdirect.jp
            </code>
          </h2>
          <div style={styles.headerActions}>
            <button
              style={styles.refreshBtn}
              onClick={fetchDetail}
              disabled={loading}
              title="更新"
            >
              <RefreshCw
                size={16}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          <TenantInfoCard
            tenant={tenant}
            workspacesCount={workspaces.length}
            usersCount={users.length}
          />

          <TabConfigSection tenant={tenant} />

          <WorkspaceList workspaces={workspaces} loading={loading} />

          <UserList users={users} loading={loading} />
        </div>
      </div>
    </div>
  );
});
