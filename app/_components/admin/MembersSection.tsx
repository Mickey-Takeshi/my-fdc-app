/**
 * app/_components/admin/MembersSection.tsx
 *
 * Phase 18: メンバー一覧セクション
 */

'use client';

import { useState } from 'react';
import { MoreVertical, UserMinus, Shield } from 'lucide-react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RoleBadge } from './RoleBadge';
import { WorkspaceRole } from '@/lib/types/workspace';

export function MembersSection() {
  const { members, role: myRole } = useWorkspace();
  const { changeMemberRole, removeMember } = useAdmin();
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setProcessing(memberId);
    await changeMemberRole(memberId, newRole);
    setProcessing(null);
    setOpenMenuId(null);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('このメンバーを削除しますか？')) return;
    setProcessing(memberId);
    await removeMember(memberId);
    setProcessing(null);
    setOpenMenuId(null);
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        メンバー ({members.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {members.map((member) => {
          const isMe = member.userId === user?.id;
          const isOwner = member.role === 'OWNER';
          const canEdit = canManage && !isMe && !isOwner;

          return (
            <div
              key={member.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--bg)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {member.name?.[0] || member.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {member.name || member.email}
                    {isMe && (
                      <span style={{ color: 'var(--text-light)', marginLeft: '8px' }}>
                        (あなた)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    {member.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <RoleBadge role={member.role} />

                {canEdit && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                      disabled={processing === member.userId}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === member.userId && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '4px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          minWidth: '160px',
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={() =>
                            handleRoleChange(
                              member.userId,
                              member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                            )
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            fontSize: '14px',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text)',
                          }}
                        >
                          <Shield size={16} />
                          {member.role === 'ADMIN' ? 'メンバーに変更' : '管理者に変更'}
                        </button>
                        <button
                          onClick={() => handleRemove(member.userId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            fontSize: '14px',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                          }}
                        >
                          <UserMinus size={16} />
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
