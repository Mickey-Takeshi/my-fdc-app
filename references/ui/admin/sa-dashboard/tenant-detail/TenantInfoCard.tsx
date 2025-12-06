/**
 * テナント情報カード
 */

'use client';

import { memo } from 'react';
import { Building2 } from 'lucide-react';
import type { TenantInfoCardProps } from './types';

const styles = {
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: '12px',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  infoCard: {
    padding: '16px',
    backgroundColor: 'var(--bg-gray)',
    borderRadius: '8px',
  },
  infoLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-dark)',
  },
  planBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  planStandard: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  planCustom: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
};

export const TenantInfoCard = memo(function TenantInfoCard({
  tenant,
  workspacesCount,
  usersCount,
}: TenantInfoCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>
        <Building2 size={16} />
        テナント情報
      </h3>
      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>プラン</div>
          <div style={styles.infoValue}>
            <span
              style={{
                ...styles.planBadge,
                ...(tenant.plan === 'custom' ? styles.planCustom : styles.planStandard),
              }}
            >
              {tenant.plan === 'custom' ? 'カスタム' : 'スタンダード'}
            </span>
          </div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>ワークスペース数</div>
          <div style={styles.infoValue}>{workspacesCount}</div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>ユーザー数</div>
          <div style={styles.infoValue}>{usersCount}</div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>作成日</div>
          <div style={styles.infoValue}>{formatDate(tenant.created_at)}</div>
        </div>
      </div>
    </div>
  );
});
