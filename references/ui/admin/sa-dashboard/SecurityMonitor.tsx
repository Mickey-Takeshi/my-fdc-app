/**
 * app/_components/admin/sa-dashboard/SecurityMonitor.tsx
 *
 * セキュリティ監視ダッシュボードコンポーネント
 *
 * 【機能】
 * - セキュリティイベント統計表示
 * - イベント一覧テーブル
 * - 確認済みマーク機能
 * - Top攻撃元IPリスト
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ========================================
// 型定義
// ========================================

interface SecurityEvent {
  id: number;
  eventType: string;
  severity: 'critical' | 'warning' | 'info';
  sourceIp: string | null;
  userId: number | null;
  workspaceId: number | null;
  endpoint: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: number | null;
}

interface SecurityStats {
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
  topIps: Array<{ ip: string; count: number }>;
  recentEvents: Array<{
    id: number;
    eventType: string;
    severity: string;
    createdAt: string;
  }>;
  period: string;
  generatedAt: string;
}

// ========================================
// イベントタイプラベル
// ========================================

const EVENT_TYPE_LABELS: Record<string, string> = {
  brute_force_attempt: 'ブルートフォース攻撃',
  rate_limit_exceeded: 'レート制限超過',
  privilege_escalation_attempt: '権限昇格試行',
  invalid_session: '不正セッション',
  session_hijack_attempt: 'セッション乗っ取り',
  sql_injection_attempt: 'SQLインジェクション',
  path_traversal_attempt: 'パストラバーサル',
  cross_tenant_access: 'クロステナントアクセス',
  bulk_data_access: '大量データアクセス',
  bulk_delete: '大量削除',
  off_hours_admin_action: '深夜帯管理操作',
  auth_failure: '認証失敗',
  suspicious_user_agent: '不審なUA',
};

// ========================================
// メインコンポーネント
// ========================================

export function SecurityMonitor() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  // フィルター
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showUnacknowledgedOnly, setShowUnacknowledgedOnly] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 統計とイベント一覧を並列取得
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/security-events/stats', { credentials: 'include' }),
        fetch(
          `/api/admin/security-events?pageSize=50${
            severityFilter !== 'all' ? `&severity=${severityFilter}` : ''
          }${showUnacknowledgedOnly ? '&unacknowledgedOnly=true' : ''}`,
          { credentials: 'include' }
        ),
      ]);

      if (!statsRes.ok || !eventsRes.ok) {
        throw new Error('Failed to fetch security data');
      }

      const [statsData, eventsData] = await Promise.all([
        statsRes.json(),
        eventsRes.json(),
      ]);

      setStats(statsData);
      setEvents(eventsData.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, showUnacknowledgedOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 確認済みマーク
  const handleAcknowledge = async (eventId: number) => {
    try {
      setAcknowledging(eventId);

      const res = await fetch(`/api/admin/security-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'acknowledge' }),
      });

      if (!res.ok) {
        throw new Error('Failed to acknowledge event');
      }

      // ローカル状態を更新
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId
            ? { ...e, acknowledgedAt: new Date().toISOString() }
            : e
        )
      );

      // 統計を再取得
      const statsRes = await fetch('/api/admin/security-events/stats', {
        credentials: 'include',
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Acknowledge error:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  // 重要度アイコン
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={16} className="security-icon-critical" />;
      case 'warning':
        return <AlertTriangle size={16} className="security-icon-warning" />;
      default:
        return <Info size={16} className="security-icon-info" />;
    }
  };

  // 日時フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="security-monitor">
      <style>{`
        .security-monitor {
          margin-top: 24px;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          overflow: hidden;
        }
        .security-header {
          padding: 16px 20px;
          background: var(--primary-dark, var(--primary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .security-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .security-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        .security-header p {
          margin: 4px 0 0;
          font-size: 13px;
          opacity: 0.8;
        }
        .security-header-badges {
          display: flex;
          gap: 16px;
          margin-right: 8px;
        }
        .security-badge-critical {
          background: var(--status-error, #dc3545);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .security-badge-warning {
          background: var(--status-warning, #ffc107);
          color: #000;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .security-content {
          padding: 20px;
        }
        .security-loading {
          text-align: center;
          padding: 40px;
          color: var(--text-light, #666);
        }
        .security-error {
          text-align: center;
          padding: 40px;
          color: var(--status-error, #dc3545);
          background: var(--status-error-bg, #fff5f5);
          border-radius: 8px;
        }
        .security-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .security-stat-card {
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        .security-stat-card.critical {
          background: var(--status-error-bg, #fff5f5);
        }
        .security-stat-card.warning {
          background: var(--status-warning-bg, #fffbeb);
        }
        .security-stat-card.info {
          background: var(--primary-alpha-05, #f0f9ff);
        }
        .security-stat-card.default {
          background: var(--bg-gray, #f8f9fa);
        }
        .security-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-dark, #111);
        }
        .security-stat-label {
          font-size: 13px;
          color: var(--text-light, #666);
        }
        .security-icon-critical {
          color: var(--status-error, #dc3545);
        }
        .security-icon-warning {
          color: var(--status-warning, #ffc107);
        }
        .security-icon-info {
          color: var(--primary, #17a2b8);
        }
        .security-top-ips {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: var(--bg-gray, #f8f9fa);
          border-radius: 8px;
        }
        .security-top-ips-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-light, #666);
          margin-bottom: 8px;
        }
        .security-top-ips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .security-ip-badge {
          padding: 4px 10px;
          background: white;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          font-size: 13px;
          font-family: monospace;
        }
        .security-filters {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .security-select {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #ddd);
          font-size: 14px;
          background: white;
        }
        .security-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
          color: var(--text-dark, #111);
        }
        .security-refresh-btn {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
        .security-refresh-btn:hover {
          background: var(--primary-dark);
        }
        .security-table-container {
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          overflow: hidden;
        }
        .security-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .security-table th {
          padding: 12px 16px;
          font-weight: 600;
          font-size: 13px;
          color: var(--text-light, #666);
          background: var(--bg-gray, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        .security-table td {
          padding: 12px 16px;
        }
        .security-table tr {
          border-top: 1px solid var(--border-color, #e0e0e0);
        }
        .security-table tr:first-child {
          border-top: none;
        }
        .security-table tr.acknowledged {
          background: var(--bg-gray, #fafafa);
        }
        .security-event-name {
          font-weight: 500;
          color: var(--text-dark, #111);
        }
        .security-event-endpoint {
          font-size: 12px;
          color: var(--text-light, #666);
          font-family: monospace;
        }
        .security-ip {
          font-family: monospace;
          font-size: 13px;
        }
        .security-date {
          font-size: 13px;
          color: var(--text-light, #666);
        }
        .security-status-done {
          color: var(--status-success, #28a745);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .security-action-btn {
          padding: 4px 10px;
          background: var(--bg-gray, #e9ecef);
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          color: var(--text-dark, #111);
        }
        .security-action-btn:hover {
          background: var(--primary-alpha-20, #d0d0d0);
        }
        .security-footer {
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-light, #999);
          text-align: right;
        }
        .security-empty {
          padding: 40px;
          text-align: center;
          color: var(--text-light, #666);
        }
      `}</style>

      {/* ヘッダー */}
      <div className="security-header" onClick={() => setExpanded(!expanded)}>
        <div className="security-header-left">
          <Shield size={24} />
          <div>
            <h3>セキュリティ監視</h3>
            <p>攻撃検知・異常アクセス監視</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {stats && (
            <div className="security-header-badges">
              {stats.critical > 0 && (
                <span className="security-badge-critical">
                  Critical: {stats.critical}
                </span>
              )}
              {stats.warning > 0 && (
                <span className="security-badge-warning">
                  Warning: {stats.warning}
                </span>
              )}
            </div>
          )}
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="security-content">
          {loading ? (
            <div className="security-loading">読み込み中...</div>
          ) : error ? (
            <div className="security-error">{error}</div>
          ) : (
            <>
              {/* 統計カード */}
              <div className="security-stats-grid">
                <div className="security-stat-card critical">
                  <div style={{ marginBottom: '8px' }}>
                    <AlertCircle size={20} className="security-icon-critical" />
                  </div>
                  <div className="security-stat-value">{stats?.critical || 0}</div>
                  <div className="security-stat-label">Critical</div>
                </div>
                <div className="security-stat-card warning">
                  <div style={{ marginBottom: '8px' }}>
                    <AlertTriangle size={20} className="security-icon-warning" />
                  </div>
                  <div className="security-stat-value">{stats?.warning || 0}</div>
                  <div className="security-stat-label">Warning</div>
                </div>
                <div className="security-stat-card info">
                  <div style={{ marginBottom: '8px' }}>
                    <Info size={20} className="security-icon-info" />
                  </div>
                  <div className="security-stat-value">{stats?.info || 0}</div>
                  <div className="security-stat-label">Info</div>
                </div>
                <div className="security-stat-card default">
                  <div style={{ marginBottom: '8px' }}>
                    <Shield size={20} style={{ color: 'var(--text-light, #6c757d)' }} />
                  </div>
                  <div className="security-stat-value">{stats?.unacknowledged || 0}</div>
                  <div className="security-stat-label">未対応</div>
                </div>
              </div>

              {/* Top攻撃元IP */}
              {stats?.topIps && stats.topIps.length > 0 && (
                <div className="security-top-ips">
                  <div className="security-top-ips-title">
                    攻撃元IP Top5（24時間）
                  </div>
                  <div className="security-top-ips-list">
                    {stats.topIps.map((item, i) => (
                      <span key={i} className="security-ip-badge">
                        {item.ip} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* フィルター */}
              <div className="security-filters">
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value)}
                  className="security-select"
                >
                  <option value="all">全ての重要度</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>

                <label className="security-checkbox-label">
                  <input
                    type="checkbox"
                    checked={showUnacknowledgedOnly}
                    onChange={e => setShowUnacknowledgedOnly(e.target.checked)}
                  />
                  未対応のみ
                </label>

                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="security-refresh-btn"
                >
                  <RefreshCw size={14} />
                  更新
                </button>
              </div>

              {/* イベント一覧 */}
              <div className="security-table-container">
                <table className="security-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th style={{ textAlign: 'left' }}>イベント</th>
                      <th style={{ width: '140px' }}>送信元IP</th>
                      <th style={{ width: '100px' }}>日時</th>
                      <th style={{ width: '80px' }}>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="security-empty">
                          イベントはありません
                        </td>
                      </tr>
                    ) : (
                      events.map(event => (
                        <tr
                          key={event.id}
                          className={event.acknowledgedAt ? 'acknowledged' : ''}
                        >
                          <td style={{ textAlign: 'center' }}>
                            {getSeverityIcon(event.severity)}
                          </td>
                          <td>
                            <div className="security-event-name">
                              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                            </div>
                            {event.endpoint && (
                              <div className="security-event-endpoint">
                                {event.endpoint}
                              </div>
                            )}
                          </td>
                          <td className="security-ip">
                            {event.sourceIp || '-'}
                          </td>
                          <td className="security-date">
                            {formatDate(event.createdAt)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {event.acknowledgedAt ? (
                              <span className="security-status-done">
                                <Check size={14} />
                                対応済
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAcknowledge(event.id)}
                                disabled={acknowledging === event.id}
                                className="security-action-btn"
                              >
                                {acknowledging === event.id ? '...' : '対応'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* フッター情報 */}
              {stats && (
                <div className="security-footer">
                  最終更新: {formatDate(stats.generatedAt)} | 集計期間: {stats.period}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SecurityMonitor;
