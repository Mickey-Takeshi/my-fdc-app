/**
 * ワークスペース一覧
 */

'use client';

import { memo } from 'react';
import { FolderKanban, Users } from 'lucide-react';
import type { WorkspaceListProps } from './types';

const styles = {
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-dark)',
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    height: '24px',
    padding: '0 8px',
    backgroundColor: 'var(--bg-gray)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid var(--border-color)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'var(--text-muted)',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '24px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-gray)',
    borderRadius: '8px',
  },
};

export const WorkspaceList = memo(function WorkspaceList({ workspaces, loading }: WorkspaceListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>
          <FolderKanban size={16} />
          ワークスペース
          <span style={styles.badge}>{workspaces.length}</span>
        </h3>
      </div>
      {loading ? (
        <div style={styles.loading}>読み込み中...</div>
      ) : workspaces.length === 0 ? (
        <div style={styles.empty}>ワークスペースがありません</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>名前</th>
              <th style={styles.th}>メンバー数</th>
              <th style={styles.th}>作成日</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws) => (
              <tr key={ws.id}>
                <td style={styles.td}>{ws.id}</td>
                <td style={styles.td}>{ws.name}</td>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} color="var(--text-muted)" />
                    {ws.member_count}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(ws.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});
