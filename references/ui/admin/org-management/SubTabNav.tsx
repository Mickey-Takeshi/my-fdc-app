/**
 * app/_components/admin/org-management/SubTabNav.tsx
 *
 * Phase 14.35: サブタブナビゲーションコンポーネント
 */

'use client';

import { memo } from 'react';
import { FolderTree, Users, Eye } from 'lucide-react';
import type { SubTab } from './types';

interface SubTabNavProps {
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
}

export const SubTabNav = memo(function SubTabNav({
  activeTab,
  onTabChange,
}: SubTabNavProps) {
  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'departments', label: 'グループ管理', icon: <FolderTree size={18} /> },
    { id: 'members', label: 'レポートライン', icon: <Users size={18} /> },
    { id: 'visibility', label: '可視性設定', icon: <Eye size={18} /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '12px',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--text-medium)',
            border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
});
