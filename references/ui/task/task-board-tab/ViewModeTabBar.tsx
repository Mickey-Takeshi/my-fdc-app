/**
 * app/_components/todo/task-board-tab/ViewModeTabBar.tsx
 *
 * ビューモード切り替えタブバー
 */

import React from 'react';
import { Grid3X3, Sparkles, Clock, History } from 'lucide-react';
import type { ViewMode } from './types';

interface ViewModeTabBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeTabBar({ viewMode, onViewModeChange }: ViewModeTabBarProps) {
  const tabs: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'board', icon: <Grid3X3 size={16} />, label: '4象限' },
    { mode: 'habits', icon: <Sparkles size={16} />, label: '習慣' },
    { mode: 'schedule', icon: <Clock size={16} />, label: '予定' },
    { mode: 'history', icon: <History size={16} />, label: '履歴' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-gray)',
        borderRadius: '8px',
        padding: '4px',
      }}
    >
      {tabs.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: viewMode === mode ? 'white' : 'transparent',
            boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: viewMode === mode ? 600 : 400,
            color: viewMode === mode ? 'var(--text-dark)' : 'var(--text-light)',
          }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
