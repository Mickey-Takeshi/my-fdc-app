/**
 * app/_components/super-admin/SecurityMonitor.tsx
 *
 * Phase 19: セキュリティモニター
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Info, RefreshCw } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';

export function SecurityMonitor() {
  const { securityLogs, loading, fetchSecurityLogs } = useSuperAdmin();
  const [filter, setFilter] = useState<string>('all');
  const [days, setDays] = useState(7);

  useEffect(() => {
    const severity = filter === 'all' ? undefined : filter;
    fetchSecurityLogs(days, severity);
  }, [fetchSecurityLogs, filter, days]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={16} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <Shield size={16} style={{ color: '#f59e0b' }} />;
      default:
        return <Info size={16} style={{ color: '#3b82f6' }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const formatEventType = (type: string) => {
    const map: Record<string, string> = {
      login_success: 'ログイン成功',
      login_failure: 'ログイン失敗',
      logout: 'ログアウト',
      password_reset: 'パスワードリセット',
      permission_denied: '権限エラー',
      suspicious_activity: '不審な操作',
      account_locked: 'アカウントロック',
      admin_action: '管理者操作',
      user_suspended: 'ユーザー停止',
      user_unsuspended: 'ユーザー停止解除',
      user_deleted: 'ユーザー削除',
      account_type_changed: '権限変更',
    };
    return map[type] || type;
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'white' }}>
            セキュリティログ
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            システムセキュリティイベント
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '13px',
            }}
          >
            <option value="all">すべて</option>
            <option value="critical">重大</option>
            <option value="warning">警告</option>
            <option value="info">情報</option>
          </select>

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '13px',
            }}
          >
            <option value={1}>過去1日</option>
            <option value={7}>過去7日</option>
            <option value={30}>過去30日</option>
          </select>

          <button
            onClick={() => fetchSecurityLogs(days, filter === 'all' ? undefined : filter)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && securityLogs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
          読み込み中...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {securityLogs.map((log) => {
            const colors = getSeverityColor(log.severity);
            return (
              <div
                key={log.id}
                style={{
                  padding: '12px 16px',
                  background: colors.bg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getSeverityIcon(log.severity)}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                        {formatEventType(log.event_type)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {log.user_email || log.user_id || 'システム'}
                        {log.ip_address && ` • ${log.ip_address}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(log.created_at).toLocaleString('ja-JP')}
                  </div>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {JSON.stringify(log.details, null, 2)}
                  </div>
                )}
              </div>
            );
          })}

          {securityLogs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              ログがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
