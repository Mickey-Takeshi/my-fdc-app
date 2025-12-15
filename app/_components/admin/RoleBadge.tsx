/**
 * app/_components/admin/RoleBadge.tsx
 *
 * Phase 18: ロールバッジコンポーネント
 */

'use client';

import { WorkspaceRole } from '@/lib/types/workspace';

interface RoleBadgeProps {
  role: WorkspaceRole;
}

const roleConfig: Record<WorkspaceRole, { label: string; color: string; bg: string }> = {
  OWNER: { label: 'オーナー', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  ADMIN: { label: '管理者', color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.1)' },
  MEMBER: { label: 'メンバー', color: 'var(--text-light)', bg: 'rgba(107, 114, 128, 0.1)' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        borderRadius: '4px',
      }}
    >
      {config.label}
    </span>
  );
}
