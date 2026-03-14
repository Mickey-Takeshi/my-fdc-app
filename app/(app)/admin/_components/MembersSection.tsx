'use client';

/**
 * app/(app)/admin/_components/MembersSection.tsx
 *
 * メンバー一覧・ロール変更・削除（Phase 18）
 */

import { useState } from 'react';
import { Shield, UserMinus, ChevronDown } from 'lucide-react';
import type { WorkspaceMemberWithUser, WorkspaceRole } from '@/lib/types/workspace';

interface MembersSectionProps {
  members: WorkspaceMemberWithUser[];
  currentUserId: string;
  onRoleChange: (userId: string, newRole: WorkspaceRole) => Promise<boolean>;
  onRemove: (userId: string) => Promise<boolean>;
}

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  OWNER: '#d97706',
  ADMIN: '#2563eb',
  MEMBER: '#6b7280',
};

export default function MembersSection({
  members,
  currentUserId,
  onRoleChange,
  onRemove,
}: MembersSectionProps) {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    setChangingRole(userId);
    await onRoleChange(userId, newRole);
    setChangingRole(null);
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">
        <Shield size={16} /> メンバー ({members.length})
      </h3>
      <div className="admin-members-list">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          const isOwner = member.role === 'OWNER';

          return (
            <div key={member.user_id} className="admin-member-row">
              <div className="admin-member-info">
                <span className="admin-member-name">
                  {member.user?.name || member.user?.email || 'Unknown'}
                  {isCurrentUser && <span className="admin-you-badge">YOU</span>}
                </span>
                <span className="admin-member-email">
                  {member.user?.email || ''}
                </span>
              </div>

              <div className="admin-member-actions">
                <span
                  className="admin-role-badge"
                  style={{
                    color: ROLE_COLORS[member.role],
                    borderColor: ROLE_COLORS[member.role],
                  }}
                >
                  {member.role}
                </span>

                {!isOwner && !isCurrentUser && (
                  <>
                    <div className="admin-role-select">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.user_id, e.target.value as WorkspaceRole)
                        }
                        disabled={changingRole === member.user_id}
                        className="form-input admin-role-dropdown"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <ChevronDown size={12} className="admin-role-chevron" />
                    </div>

                    <button
                      className="btn btn-outline btn-small admin-remove-btn"
                      onClick={() => onRemove(member.user_id)}
                      title="メンバーを削除"
                    >
                      <UserMinus size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
