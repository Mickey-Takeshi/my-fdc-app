/**
 * app/_components/admin/sa-dashboard/WorkspaceMembersModal.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * メンバー管理モーダル
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Settings, X, UserPlus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import type {
  SAWorkspace,
  AllUserInfo,
  WorkspaceMemberInfo,
} from '@/lib/hooks/useSADashboardViewModel';

interface WorkspaceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: SAWorkspace | null;
  members: WorkspaceMemberInfo[];
  membersLoading: boolean;
  membersError: string | null;
  allUsers: AllUserInfo[];
  onAddMember: (workspaceId: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER') => Promise<void>;
  onUpdateRole: (workspaceId: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER') => Promise<void>;
  onRemoveMember: (workspaceId: string, userId: string) => Promise<void>;
  addLoading: boolean;
  updateRoleLoading: boolean;
  removeLoading: boolean;
}

export function WorkspaceMembersModal({
  isOpen,
  onClose,
  workspace,
  members,
  membersLoading,
  membersError,
  allUsers,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  addLoading,
  updateRoleLoading,
  removeLoading,
}: WorkspaceMembersModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('MEMBER');
  const [error, setError] = useState<string | null>(null);

  // このワークスペースに参加していないユーザーをフィルタ
  const availableUsers = allUsers.filter(
    (user) => !members.some((m) => m.userId === user.id)
  );

  const handleAddMember = async () => {
    if (!workspace || !selectedUserId) return;
    setError(null);
    try {
      await onAddMember(workspace.id, selectedUserId, selectedRole);
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    if (!workspace) return;
    try {
      await onUpdateRole(workspace.id, userId, newRole);
    } catch {
      // エラーは親で処理
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workspace) return;
    if (!confirm('このメンバーを削除してもよろしいですか？')) return;
    try {
      await onRemoveMember(workspace.id, userId);
    } catch {
      // エラーは親で処理
    }
  };

  if (!isOpen || !workspace) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '720px',
          width: '100%',
          margin: '0 16px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={20} />
            {workspace.name} - メンバー管理
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-medium)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* メンバー追加ボタン */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                marginBottom: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={18} />
              メンバーを追加
            </button>
          )}

          {/* メンバー追加フォーム */}
          {showAddForm && (
            <div
              style={{
                marginBottom: '16px',
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '8px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}
              >
                メンバーを追加
              </h4>
              {error && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '6px',
                    color: '#721c24',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    flex: '1 1 200px',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">ユーザーを選択</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER')}
                  style={{
                    flex: '0 0 120px',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={addLoading || !selectedUserId}
                  style={{
                    flex: '0 0 auto',
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: addLoading || !selectedUserId ? 'not-allowed' : 'pointer',
                    opacity: addLoading || !selectedUserId ? 0.5 : 1,
                  }}
                >
                  追加
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: '0 0 auto',
                    padding: '8px 16px',
                    background: 'var(--bg-gray)',
                    color: 'var(--text-dark)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* メンバー一覧 */}
          {membersLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            </div>
          ) : membersError ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '6px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={20} />
              <span>{membersError}</span>
            </div>
          ) : members.length === 0 ? (
            <p style={{ color: 'var(--text-medium)', textAlign: 'center', padding: '24px' }}>
              メンバーがいません
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>ユーザー</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>ロール</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>参加日</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {member.picture ? (
                          <Image
                            src={member.picture}
                            alt={member.name || ''}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '14px' }}>
                            {member.name || '名前未設定'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER')}
                        disabled={updateRoleLoading}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: updateRoleLoading ? 'not-allowed' : 'pointer',
                          opacity: updateRoleLoading ? 0.5 : 1,
                        }}
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-medium)' }}>
                      {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removeLoading}
                        title="メンバーを削除"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#B91C1C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: removeLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: removeLoading ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={14} />
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: '#F9FAFB',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 20px',
              background: 'var(--bg-gray)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceMembersModal;
