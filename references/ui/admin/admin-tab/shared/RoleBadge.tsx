'use client';

import { memo } from 'react';
import { Crown, Key, User } from 'lucide-react';
import type { WorkspaceMemberRole } from '@/lib/hooks/useAdminViewModel';

/**
 * ロールバッジ
 */
export const RoleBadge = memo(function RoleBadge({ role }: { role: WorkspaceMemberRole }) {
  const badgeStyles: Record<
    WorkspaceMemberRole,
    { bg: string; color: string; label: string }
  > = {
    OWNER: { bg: 'var(--primary-alpha-20)', color: 'var(--primary)', label: 'Owner' },
    ADMIN: { bg: 'var(--primary-alpha-15)', color: 'var(--primary)', label: 'Admin' },
    MEMBER: { bg: 'var(--primary-alpha-10)', color: 'var(--primary)', label: 'Member' },
  };

  const style = badgeStyles[role] || badgeStyles.MEMBER;

  const IconComponent = role === 'OWNER' ? Crown : role === 'ADMIN' ? Key : User;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        background: style.bg,
        color: style.color,
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <IconComponent size={14} />
      {style.label}
    </span>
  );
});
