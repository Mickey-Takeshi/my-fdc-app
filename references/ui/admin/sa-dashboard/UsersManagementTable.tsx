/**
 * app/_components/admin/sa-dashboard/UsersManagementTable.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * ユーザー管理テーブル
 */

'use client';

import Image from 'next/image';
import { UserCog, Crown, Shield, AlertCircle, Clock } from 'lucide-react';
import type { AllUserInfo, AccountType } from '@/lib/hooks/useSADashboardViewModel';

// TESTユーザーの残日数を計算するヘルパー関数
function calculateTrialDaysRemaining(createdAt: string): { daysRemaining: number; isExpired: boolean } {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 14 - diffDays);
  const isExpired = diffDays > 14;
  return { daysRemaining, isExpired };
}

interface UsersManagementTableProps {
  users: AllUserInfo[];
  loading: boolean;
  error: string | null;
  currentUserId: string | undefined;
  onUpdateAccountType: (userId: string, accountType: AccountType) => Promise<void>;
  updateLoading: boolean;
}

export function UsersManagementTable({
  users,
  loading,
  error,
  currentUserId,
  onUpdateAccountType,
  updateLoading,
}: UsersManagementTableProps) {
  if (loading) {
    return (
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            読み込み中...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
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
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const handleAccountTypeChange = async (userId: string, newAccountType: AccountType) => {
    try {
      await onUpdateAccountType(userId, newAccountType);
    } catch {
      // エラーはViewModelで処理される
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
          <UserCog size={28} style={{ color: 'var(--primary)' }} />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-dark)',
              }}
            >
              ユーザー管理
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-medium)' }}>
              権限を管理できます。SA は全ての機能にアクセス可能
            </p>
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>ユーザー</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>アカウント種別</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>WS所属</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>最終アクティブ</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>権限変更</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)' }}>
                  ユーザーがいません
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isCurrentUser ? 'var(--primary-alpha-05)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.picture ? (
                          <Image
                            src={user.picture}
                            alt={user.name || ''}
                            width={40}
                            height={40}
                            style={{ borderRadius: '50%' }}
                          />
                        ) : (
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
                            }}
                          >
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user.name || '名前未設定'}
                            {isCurrentUser && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  borderRadius: '4px',
                                }}
                              >
                                あなた
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.accountType === 'SA' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                            color: 'white',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <Crown size={14} />
                          SA
                        </span>
                      ) : user.accountType === 'USER' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            background: 'var(--primary-alpha-20)',
                            color: 'var(--primary-dark)',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <Shield size={14} />
                          USER
                        </span>
                      ) : (
                        (() => {
                          const trial = calculateTrialDaysRemaining(user.createdAt);
                          return (
                            <div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 12px',
                                  background: trial.isExpired ? '#FEE2E2' : 'var(--primary-alpha-15)',
                                  color: trial.isExpired ? '#DC2626' : 'var(--primary-dark)',
                                  borderRadius: '16px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                <Clock size={14} />
                                TEST
                              </span>
                              <div
                                style={{
                                  marginTop: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: trial.isExpired ? '#DC2626' : trial.daysRemaining <= 3 ? '#F59E0B' : 'var(--primary)',
                                }}
                              >
                                {trial.isExpired ? (
                                  '期限切れ'
                                ) : (
                                  `残り ${trial.daysRemaining} 日`
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.workspaceCount === 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          未配置
                        </span>
                      ) : (
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: 'var(--primary-alpha-15)',
                              color: 'var(--primary-dark)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            {user.workspaceCount} WS
                          </span>
                          {user.workspaceNames.length > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--text-medium)', marginTop: '4px' }}>
                              {user.workspaceNames.slice(0, 2).join(', ')}
                              {user.workspaceNames.length > 2 && ` 他${user.workspaceNames.length - 2}件`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-medium)' }}>
                      {user.lastActiveAt ? (
                        <>
                          {new Date(user.lastActiveAt).toLocaleDateString('ja-JP')}
                          <br />
                          <span style={{ fontSize: '10px' }}>
                            {new Date(user.lastActiveAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {/* Phase 9.97: SA/USER/TEST 変更ボタン */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {user.accountType !== 'SA' && (
                          <button
                            onClick={() => handleAccountTypeChange(user.id, 'SA')}
                            disabled={updateLoading}
                            style={{
                              padding: '4px 10px',
                              background: 'var(--primary-dark)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: updateLoading ? 'not-allowed' : 'pointer',
                              opacity: updateLoading ? 0.5 : 1,
                            }}
                          >
                            SA
                          </button>
                        )}
                        {user.accountType !== 'USER' && (
                          <button
                            onClick={() => handleAccountTypeChange(user.id, 'USER')}
                            disabled={updateLoading}
                            style={{
                              padding: '4px 10px',
                              background: 'var(--primary-alpha-20)',
                              color: 'var(--primary-dark)',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: updateLoading ? 'not-allowed' : 'pointer',
                              opacity: updateLoading ? 0.5 : 1,
                            }}
                          >
                            USER
                          </button>
                        )}
                        {user.accountType !== 'TEST' && (
                          <button
                            onClick={() => handleAccountTypeChange(user.id, 'TEST')}
                            disabled={updateLoading}
                            style={{
                              padding: '4px 10px',
                              background: 'var(--primary-alpha-15)',
                              color: 'var(--primary-dark)',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: updateLoading ? 'not-allowed' : 'pointer',
                              opacity: updateLoading ? 0.5 : 1,
                            }}
                          >
                            TEST
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersManagementTable;
