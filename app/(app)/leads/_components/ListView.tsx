'use client';

/**
 * app/(app)/leads/_components/ListView.tsx
 *
 * リスト表示（Phase 6）
 * テーブル形式でリードを一覧表示
 */

import { Building2, Trash2 } from 'lucide-react';
import {
  PROSPECT_STATUS_LABELS,
  ALL_STATUSES,
  type Prospect,
  type ProspectStatus,
} from '@/lib/types/prospect';

interface ListViewProps {
  prospects: Prospect[];
  onSelect: (prospect: Prospect) => void;
  onStatusChange: (prospectId: string, newStatus: ProspectStatus) => void;
  onDelete: (prospectId: string) => void;
}

export default function ListView({
  prospects,
  onSelect,
  onStatusChange,
  onDelete,
}: ListViewProps) {
  if (prospects.length === 0) {
    return (
      <div className="empty-state">
        <Building2 size={64} className="empty-state-icon" />
        <p>リードがありません</p>
        <p style={{ fontSize: 14 }}>
          「リードを追加」ボタンから見込み客を追加してみましょう
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'auto' }}>
      <table className="leads-table">
        <thead>
          <tr>
            <th>会社名</th>
            <th>担当者</th>
            <th>ステータス</th>
            <th>チャネル</th>
            <th>メール</th>
            <th>電話</th>
            <th>作成日</th>
            <th style={{ width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect) => (
            <tr key={prospect.id}>
              <td>
                <button
                  className="leads-table-link"
                  onClick={() => onSelect(prospect)}
                >
                  {prospect.companyName}
                </button>
              </td>
              <td>{prospect.contactPerson}</td>
              <td>
                <select
                  className={`leads-status-select status-${prospect.status}`}
                  value={prospect.status}
                  onChange={(e) =>
                    onStatusChange(prospect.id, e.target.value as ProspectStatus)
                  }
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROSPECT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td>{prospect.channel || '-'}</td>
              <td>{prospect.email || '-'}</td>
              <td>{prospect.phone || '-'}</td>
              <td>
                {new Date(prospect.createdAt).toLocaleDateString('ja-JP')}
              </td>
              <td>
                <button
                  className="task-delete"
                  onClick={() => onDelete(prospect.id)}
                  aria-label="削除"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
