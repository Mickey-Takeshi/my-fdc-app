/**
 * app/_components/settings/settings-tab/CalendarSection.tsx
 * カレンダー連携セクション
 */

import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { CalendarInfo } from '@/lib/hooks/useSettingsViewModel';

interface CalendarSectionProps {
  calendarList: CalendarInfo[];
  selectedCalendarId: string;
  onSelectCalendar: (id: string) => void;
  calendarLoading: boolean;
  calendarError: string | null;
  calendarSuccess: string | null;
  onConnectCalendar: () => Promise<void>;
  onCreateTestEvent: () => Promise<unknown>;
}

export function CalendarSection({
  calendarList,
  selectedCalendarId,
  onSelectCalendar,
  calendarLoading,
  calendarError,
  calendarSuccess,
  onConnectCalendar,
  onCreateTestEvent,
}: CalendarSectionProps) {
  return (
    <>
      {/* エラーメッセージ */}
      {calendarError && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {calendarError}
        </div>
      )}

      {/* 成功メッセージ */}
      {calendarSuccess && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {calendarSuccess}
        </div>
      )}

      {/* カレンダー一覧取得ボタン */}
      <button
        onClick={onConnectCalendar}
        disabled={calendarLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: calendarLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: calendarLoading ? 0.7 : 1,
        }}
      >
        {calendarLoading ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Calendar size={16} />
        )}
        {calendarLoading ? '取得中...' : 'カレンダー一覧を取得'}
      </button>

      {/* カレンダー選択 */}
      {calendarList.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: 'var(--text-dark)',
            }}
          >
            カレンダーを選択:
          </label>
          <select
            value={selectedCalendarId}
            onChange={(e) => onSelectCalendar(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          >
            <option value="">-- カレンダーを選択 --</option>
            {calendarList.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.summary} {cal.primary ? '(メイン)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* テストイベント作成 */}
      {calendarList.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={onCreateTestEvent}
            disabled={calendarLoading || !selectedCalendarId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: selectedCalendarId ? 'var(--primary)' : 'var(--bg-gray)',
              color: selectedCalendarId ? 'white' : 'var(--text-light)',
              border: 'none',
              borderRadius: '6px',
              cursor: !selectedCalendarId || calendarLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: !selectedCalendarId || calendarLoading ? 0.7 : 1,
            }}
          >
            <Plus size={16} />
            テストイベントを作成（15分）
          </button>
        </div>
      )}
    </>
  );
}
