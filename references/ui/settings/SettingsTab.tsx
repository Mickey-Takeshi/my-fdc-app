/**
 * app/_components/settings/SettingsTab.tsx
 *
 * Phase 9.92-11 / Phase 14.35: 設定タブの React 実装
 * Phase 15-A: Google カレンダー連携に統合（Tasks セクション削除）
 *
 * 【責務】
 * - ユーザー認証状態の表示
 * - Googleカレンダー連携機能
 */

'use client';

import { User, Calendar, Info } from 'lucide-react';
import { useSettingsViewModel } from '@/lib/hooks/useSettingsViewModel';
import {
  SectionCard,
  AuthStatusSection,
  CalendarSection,
} from './settings-tab';

/**
 * メインコンポーネント
 */
export function SettingsTab() {
  const {
    // 認証状態
    user,
    isAuthenticated,
    loading,
    error,

    // カレンダー連携
    showCalendarSection,
    calendarList,
    selectedCalendarId,
    setSelectedCalendarId,
    calendarLoading,
    calendarError,
    calendarSuccess,
    connectCalendar,
    createTestEvent,

    // 認証アクション
    signIn,
    signOut,
  } = useSettingsViewModel();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ページヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--text-dark)',
            margin: 0,
          }}
        >
          設定
        </h2>
        <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
          アカウント設定とGoogle連携
        </p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Google アカウント連携 */}
      <SectionCard
        title="Google アカウント連携"
        icon={<User size={28} style={{ color: 'var(--primary)' }} />}
      >
        <AuthStatusSection
          user={user}
          isAuthenticated={isAuthenticated}
          loading={loading}
          onSignIn={signIn}
          onSignOut={signOut}
        />
      </SectionCard>

      {/* Google カレンダー連携 */}
      {showCalendarSection && (
        <SectionCard
          title="Google カレンダー連携"
          icon={<Calendar size={28} style={{ color: 'var(--primary)' }} />}
        >
          <CalendarSection
            calendarList={calendarList}
            selectedCalendarId={selectedCalendarId}
            onSelectCalendar={setSelectedCalendarId}
            calendarLoading={calendarLoading}
            calendarError={calendarError}
            calendarSuccess={calendarSuccess}
            onConnectCalendar={connectCalendar}
            onCreateTestEvent={createTestEvent}
          />
        </SectionCard>
      )}

      {/* アプリについて */}
      <SectionCard
        title="アプリについて"
        icon={<Info size={28} style={{ color: 'var(--primary)' }} />}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px', fontSize: '14px' }}>
            Founders Direct Cockpit のサービス紹介、機能一覧、料金プランをご覧いただけます。
          </p>
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'opacity 0.2s',
            }}
          >
            サービス紹介ページを見る
            <span style={{ fontSize: '12px' }}>↗</span>
          </a>
        </div>
      </SectionCard>

    </div>
  );
}

export default SettingsTab;
