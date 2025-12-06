'use client';

import { memo } from 'react';
import type { WorkspaceMember } from '@/lib/hooks/useAdminViewModel';

interface InvitationCreateFormProps {
  supervisorOptions: WorkspaceMember[];
  createRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  setCreateRole: (role: 'OWNER' | 'ADMIN' | 'MEMBER') => void;
  createExpiresDays: number;
  setCreateExpiresDays: (days: number) => void;
  createMaxUses: number | null;
  setCreateMaxUses: (uses: number | null) => void;
  createSupervisorId: string | null;
  setCreateSupervisorId: (id: string | null) => void;
  createLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * 招待リンク新規作成フォーム
 */
export const InvitationCreateForm = memo(function InvitationCreateForm({
  supervisorOptions,
  createRole,
  setCreateRole,
  createExpiresDays,
  setCreateExpiresDays,
  createMaxUses,
  setCreateMaxUses,
  createSupervisorId,
  setCreateSupervisorId,
  createLoading,
  onSubmit,
  onCancel,
}: InvitationCreateFormProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: '#F9FAFB',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        新しい招待リンクを作成
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-medium)' }}>
            付与するロール
          </label>
          <select
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
            }}
          >
            <option value="MEMBER">MEMBER（一般メンバー）</option>
            <option value="ADMIN">ADMIN（管理者）</option>
            <option value="OWNER">OWNER（オーナー）</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-medium)' }}>
            有効期限
          </label>
          <select
            value={createExpiresDays}
            onChange={(e) => setCreateExpiresDays(parseInt(e.target.value, 10))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
            }}
          >
            <option value={1}>1日</option>
            <option value={7}>7日</option>
            <option value={14}>14日</option>
            <option value={30}>30日</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-medium)' }}>
            使用回数制限
          </label>
          <select
            value={createMaxUses === null ? 'unlimited' : createMaxUses.toString()}
            onChange={(e) => setCreateMaxUses(e.target.value === 'unlimited' ? null : parseInt(e.target.value, 10))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
            }}
          >
            <option value="unlimited">無制限</option>
            <option value="1">1回</option>
            <option value="5">5回</option>
            <option value="10">10回</option>
            <option value="50">50回</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-medium)' }}>
            上司（レポートラインでの配置）
          </label>
          <select
            value={createSupervisorId === null ? '' : createSupervisorId.toString()}
            onChange={(e) => setCreateSupervisorId(e.target.value === '' ? null : e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              minWidth: '200px',
            }}
          >
            <option value="">（上司なし）</option>
            {supervisorOptions.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name || member.email} ({member.role})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onSubmit}
          disabled={createLoading}
          style={{
            padding: '8px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: createLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {createLoading ? '作成中...' : '作成'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: 'var(--text-medium)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
});
