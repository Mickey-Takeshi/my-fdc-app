'use client';

/**
 * app/(app)/admin/_components/AuditLogsSection.tsx
 *
 * 監査ログ表示（Phase 18）
 */

import { FileText } from 'lucide-react';
import type { AuditLog } from '@/lib/types/admin';

interface AuditLogsSectionProps {
  logs: AuditLog[];
}

const ACTION_LABELS: Record<string, string> = {
  invite_sent: '招待送信',
  invite_accepted: '招待承認',
  role_changed: 'ロール変更',
  member_removed: 'メンバー削除',
  workspace_updated: 'ワークスペース更新',
  workspace_deleted: 'ワークスペース削除',
};

export default function AuditLogsSection({ logs }: AuditLogsSectionProps) {
  return (
    <div className="admin-section">
      <h3 className="admin-section-title">
        <FileText size={16} /> 監査ログ
      </h3>

      {logs.length === 0 ? (
        <p className="admin-empty">操作ログはまだありません</p>
      ) : (
        <div className="admin-audit-list">
          {logs.map((log) => (
            <div key={log.id} className="admin-audit-row">
              <div className="admin-audit-action">
                {ACTION_LABELS[log.action] || log.action}
              </div>
              <div className="admin-audit-details">
                {log.details && Object.keys(log.details).length > 0 && (
                  <span>
                    {Object.entries(log.details)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
                  </span>
                )}
              </div>
              <div className="admin-audit-time">
                {new Date(log.createdAt).toLocaleString('ja-JP', {
                  timeZone: 'Asia/Tokyo',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
