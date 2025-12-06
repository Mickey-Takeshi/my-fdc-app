/**
 * app/_components/admin/sa-dashboard/WorkspacesTable.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * ワークスペース一覧テーブル
 */

'use client';

import { useState } from 'react';
import { Building2, Plus, User, Users, Trash2, AlertCircle } from 'lucide-react';
import type { SAWorkspace, AllUserInfo } from '@/lib/hooks/useSADashboardViewModel';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

interface WorkspacesTableProps {
  workspaces: SAWorkspace[];
  loading: boolean;
  error: string | null;
  allUsers: AllUserInfo[];
  onCreateWorkspace: (name: string, ownerUserId: string) => Promise<void>;
  createLoading: boolean;
  onDeleteWorkspace: (workspaceId: string) => Promise<void>;
  deleteLoading: boolean;
  onManageMembers: (workspace: SAWorkspace) => void;
}

export function WorkspacesTable({
  workspaces,
  loading,
  error,
  allUsers,
  onCreateWorkspace,
  createLoading,
  onDeleteWorkspace,
  deleteLoading,
  onManageMembers,
}: WorkspacesTableProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (workspace: SAWorkspace) => {
    if (!confirm(`ワークスペース「${workspace.name}」を削除してもよろしいですか？\n\n関連するすべてのデータが削除されます。この操作は取り消せません。`)) {
      return;
    }
    try {
      await onDeleteWorkspace(workspace.id);
    } catch {
      // エラーは親で処理
    }
  };

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

  return (
    <>
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        users={allUsers}
        onSubmit={onCreateWorkspace}
        loading={createLoading}
      />

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
            <Building2 size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                }}
              >
                ワークスペース一覧
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-medium)' }}>
                全ワークスペースを管理
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            新規作成
          </button>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>ワークスペース</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>オーナー</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>メンバー数</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>作成日</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)' }}>
                    ワークスペースがありません
                  </td>
                </tr>
              ) : (
                workspaces.map((ws) => (
                  <tr key={ws.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{ws.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} style={{ color: 'var(--text-medium)' }} />
                        <div>
                          <div style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                            {ws.ownerName || '名前未設定'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>{ws.ownerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          background: 'var(--primary-alpha-10)',
                          color: 'var(--primary)',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {ws.memberCount} 人
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-medium)' }}>
                      {new Date(ws.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => onManageMembers(ws)}
                          title="メンバー管理"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <Users size={14} />
                          管理
                        </button>
                        <button
                          onClick={() => handleDelete(ws)}
                          disabled={deleteLoading}
                          title="削除"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#B91C1C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: deleteLoading ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: deleteLoading ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={14} />
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default WorkspacesTable;
