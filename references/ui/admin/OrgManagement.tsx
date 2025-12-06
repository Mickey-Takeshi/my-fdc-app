/**
 * app/_components/admin/OrgManagement.tsx
 *
 * Phase 14.35: 組織管理コンポーネント
 * 1,229行 → 約50行 (96%削減)
 *
 * 【責務】
 * - グループ管理（CRUD）
 * - レポートライン設定
 * - 可視性ポリシー設定
 */

'use client';

import { useState } from 'react';
import { FolderTree } from 'lucide-react';
import type { SubTab } from './org-management';
import { SubTabNav, DepartmentsTab, MembersTab, VisibilityTab } from './org-management';

export function OrgManagement({ workspaceId }: { workspaceId: string }) {
  const [activeTab, setActiveTab] = useState<SubTab>('departments');

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <FolderTree size={28} style={{ color: 'var(--primary)' }} />
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-dark)',
          }}
        >
          組織管理
        </h2>
      </div>

      <SubTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'departments' && <DepartmentsTab workspaceId={workspaceId} />}
      {activeTab === 'members' && <MembersTab workspaceId={workspaceId} />}
      {activeTab === 'visibility' && <VisibilityTab workspaceId={workspaceId} />}
    </div>
  );
}

export default OrgManagement;
