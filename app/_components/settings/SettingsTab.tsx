/**
 * app/_components/settings/SettingsTab.tsx
 *
 * 設定タブコンテナ
 */

'use client';

import React from 'react';
import { useSettingsContext } from '@/lib/contexts/SettingsContext';
import { ProfileSection } from './ProfileSection';
import { GoogleConnectButton } from './GoogleConnectButton';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import { ResetSection } from './ResetSection';

export function SettingsTab() {
  const {
    profile,
    loading,
    updateProfile,
    exportAllData,
    importAllData,
    resetAll,
  } = useSettingsContext();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: 'var(--text-light, #9ca3af)',
        }}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>設定</h1>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: 'var(--text-light, #9ca3af)',
          }}
        >
          プロフィールとデータ管理
        </p>
      </div>

      {/* プロフィール */}
      <ProfileSection profile={profile} onUpdate={updateProfile} />

      {/* Google連携 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
          外部サービス連携
        </h2>
        <GoogleConnectButton />
      </div>

      {/* エクスポート */}
      <ExportSection onExport={exportAllData} />

      {/* インポート */}
      <ImportSection onImport={importAllData} />

      {/* リセット */}
      <ResetSection onReset={resetAll} />
    </div>
  );
}

export default SettingsTab;
