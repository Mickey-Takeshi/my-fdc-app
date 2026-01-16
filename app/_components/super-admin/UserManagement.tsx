/**
 * app/_components/super-admin/UserManagement.tsx
 *
 * Phase 19: ユーザー管理
 */

'use client';

import { useEffect, useState } from 'react';
import { User, Ban, Trash2, Shield, ChevronDown } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { AccountType } from '@/lib/types/super-admin';

export function UserManagement() {
  const {
    users,
    loading,
    fetchUsers,
    suspendUser,
    unsuspendUser,
    deleteUser,
    changeUserType,
  } = useSuperAdmin();

  const [actionUser, setActionUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    if (isSuspended) {
      await unsuspendUser(userId);
    } else {
      await suspendUser(userId);
    }
    setActionUser(null);
  };

  const handleDelete = async (userId: string) => {
    await deleteUser(userId);
    setConfirmDelete(null);
  };

  const handleChangeType = async (userId: string, newType: AccountType) => {
    await changeUserType(userId, newType);
    setActionUser(null);
  };

  const getTypeColor = (type: AccountType) => {
    switch (type) {
      case 'SA': return '#ef4444';
      case 'ADMIN': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'white' }}>
          ユーザー管理
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          登録ユーザー一覧（{users.length}名）
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              padding: '14px 16px',
              background: user.is_suspended
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: `1px solid ${user.is_suspended ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${getTypeColor(user.account_type)}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} style={{ color: getTypeColor(user.account_type) }} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'white' }}>
                    {user.name || user.email}
                    {user.is_suspended && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#ef4444' }}>
                        [停止中]
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: `${getTypeColor(user.account_type)}20`,
                    color: getTypeColor(user.account_type),
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {user.account_type}
                </span>

                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  WS: {user.workspace_count}
                </span>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setActionUser(actionUser === user.id ? null : user.id)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                    }}
                  >
                    操作
                    <ChevronDown size={14} />
                  </button>

                  {actionUser === user.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: '#1e1e2e',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '4px',
                        zIndex: 10,
                        minWidth: '140px',
                      }}
                    >
                      <button
                        onClick={() => handleSuspend(user.id, user.is_suspended)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: 'transparent',
                          color: user.is_suspended ? '#22c55e' : '#f59e0b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          textAlign: 'left',
                        }}
                      >
                        <Ban size={14} />
                        {user.is_suspended ? '停止解除' : '停止'}
                      </button>

                      {user.account_type !== 'SA' && (
                        <>
                          <button
                            onClick={() => handleChangeType(user.id, user.account_type === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              background: 'transparent',
                              color: '#8b5cf6',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              textAlign: 'left',
                            }}
                          >
                            <Shield size={14} />
                            {user.account_type === 'ADMIN' ? 'MEMBER に' : 'ADMIN に'}
                          </button>

                          <button
                            onClick={() => {
                              setActionUser(null);
                              setConfirmDelete(user.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              textAlign: 'left',
                            }}
                          >
                            <Trash2 size={14} />
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            ユーザーがいません
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: '#1e1e2e',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: 'white' }}>
              ユーザーを削除しますか？
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
              この操作は取り消せません。関連するすべてのデータが削除されます。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
