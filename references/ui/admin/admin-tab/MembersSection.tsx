'use client';

import { memo } from 'react';
import { Users, RefreshCw, Trash2 } from 'lucide-react';
import type { WorkspaceMember } from '@/lib/hooks/useAdminViewModel';
import { RoleBadge } from './shared';

interface MembersSectionProps {
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
  canManageMembers: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

/**
 * メンバー管理セクション
 */
export const MembersSection = memo(function MembersSection({
  members,
  loading,
  error,
  canManageMembers,
  onRemoveMember,
  onRefresh,
}: MembersSectionProps) {
  const handleRemove = async (member: WorkspaceMember) => {
    if (member.role === 'OWNER') {
      alert('オーナーは削除できません');
      return;
    }

    if (
      !confirm(
        `メンバー「${member.name || member.email}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`
      )
    ) {
      return;
    }

    try {
      await onRemoveMember(member.userId);
      alert(`メンバー「${member.name || member.email}」を削除しました。`);
    } catch (err) {
      alert(
        `メンバーの削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`
      );
    }
  };

  return (
    <div
      className="settings-section"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} style={{ color: 'var(--primary)' }} />
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            Workspaceメンバー管理
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--bg-gray)',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: 'var(--text-dark)',
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            読み込み中...
          </div>
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            メンバーが見つかりませんでした。
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '600px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--border)',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}
              >
                ユーザー
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}
              >
                ロール
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}
              >
                参加日
              </th>
              {canManageMembers && (
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                  }}
                >
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.userId}
                style={{
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <td style={{ padding: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-dark)',
                        }}
                      >
                        {member.name || member.email}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-medium)',
                        }}
                      >
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <RoleBadge role={member.role} />
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: 'var(--text-medium)',
                  }}
                >
                  {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                </td>
                {canManageMembers && (
                  <td style={{ padding: '12px' }}>
                    {member.role !== 'OWNER' ? (
                      <button
                        onClick={() => handleRemove(member)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#B91C1C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={12} style={{ marginRight: '4px' }} />削除
                      </button>
                    ) : (
                      <span
                        style={{
                          color: 'var(--text-medium)',
                          fontSize: '12px',
                        }}
                      >
                        削除不可
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
});
