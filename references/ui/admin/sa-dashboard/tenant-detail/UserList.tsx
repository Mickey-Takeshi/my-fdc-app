/**
 * ユーザー一覧
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Users, Mail, FolderKanban } from 'lucide-react';
import type { UserListProps } from './types';

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
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-gray)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
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

export const UserList = memo(function UserList({ users, loading }: UserListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'fdc_admin':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'normal':
      default:
        return { backgroundColor: '#e0f2fe', color: '#0369a1' };
    }
  };

  const getInitial = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>
          <Users size={16} />
          ユーザー
          <span style={styles.badge}>{users.length}</span>
        </h3>
      </div>
      {loading ? (
        <div style={styles.loading}>読み込み中...</div>
      ) : users.length === 0 ? (
        <div style={styles.empty}>ユーザーがいません</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ユーザー</th>
              <th style={styles.th}>メール</th>
              <th style={styles.th}>ロール</th>
              <th style={styles.th}>所属WS数</th>
              <th style={styles.th}>登録日</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>
                  <div style={styles.userRow}>
                    <div style={styles.avatar}>
                      {user.picture ? (
                        <Image
                          src={user.picture}
                          alt={user.name || user.email}
                          width={32}
                          height={32}
                          unoptimized={user.picture.includes('googleusercontent.com')}
                          style={styles.avatarImg}
                        />
                      ) : (
                        getInitial(user.name, user.email)
                      )}
                    </div>
                    <span>{user.name || '(未設定)'}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={14} color="var(--text-muted)" />
                    {user.email}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.global_role) }}>
                    {user.global_role === 'fdc_admin' ? 'FDC Admin' : 'Normal'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FolderKanban size={14} color="var(--text-muted)" />
                    {user.workspace_count}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});
