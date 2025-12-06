'use client';

import { memo } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, FileText, Trash2 } from 'lucide-react';
import type { ClientWithHistory, HistoryEntry } from '@/lib/hooks/useClientsViewModel';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from '@/lib/hooks/useClientsViewModel';
import { ClientStatus } from '@/lib/types/app-data';
import { ClientEditForm } from './ClientEditForm';

/**
 * 履歴表示
 */
const HistorySection = memo(function HistorySection({ history }: { history: HistoryEntry[] }) {
  if (!history || history.length === 0) return null;

  return (
    <div style={{ marginTop: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={14} /> 取引履歴
      </h4>
      {history.slice().reverse().slice(0, 3).map((h, idx) => {
        const date = new Date(h.date);
        return (
          <div
            key={idx}
            style={{
              padding: '8px',
              background: 'white',
              borderRadius: '4px',
              marginBottom: '8px',
              borderLeft: '3px solid var(--primary)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>
              {date.toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{h.action}</div>
            {h.note && <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>{h.note}</div>}
          </div>
        );
      })}
    </div>
  );
});

interface ClientCardProps {
  client: ClientWithHistory;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (status: ClientStatus) => Promise<void>;
  onUpdateDeadline: (deadline: string) => Promise<void>;
  onUpdateMeeting: (meeting: string) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onDelete: () => Promise<void>;
  getDeadlineWarning: (deadline: string | null | undefined) => { daysUntil: number; color: string; text: string } | null;
  getMeetingWarning: (meeting: string | null | undefined) => { daysUntil: number; color: string; text: string } | null;
}

/**
 * クライアントカード
 */
export const ClientCard = memo(function ClientCard({
  client,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onUpdateDeadline,
  onUpdateMeeting,
  onAddNote,
  onDelete,
  getDeadlineWarning,
  getMeetingWarning,
}: ClientCardProps) {
  const meetingWarning = getMeetingWarning(client.nextMeeting);
  const deadlineWarning = getDeadlineWarning(client.contractDeadline);

  const handleSave = async (data: {
    status: ClientStatus;
    contractDeadline: string;
    nextMeeting: string;
    newNote: string;
  }) => {
    try {
      // ステータス更新
      if (data.status !== client.status) {
        await onUpdateStatus(data.status);
      }

      // 契約期限更新
      if (data.contractDeadline !== (client.contractDeadline || '')) {
        await onUpdateDeadline(data.contractDeadline);
      }

      // 次回ミーティング更新
      if (data.nextMeeting !== (client.nextMeeting || '')) {
        await onUpdateMeeting(data.nextMeeting);
      }

      // メモ追加
      if (data.newNote.trim()) {
        await onAddNote(data.newNote);
      }

      onToggleExpand();
      alert('保存しました！');
    } catch {
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {client.name}
            </h3>
            {client.company && (
              <div style={{ color: 'var(--text-medium)', fontSize: '14px' }}>
                {client.company}
              </div>
            )}
            {client.contact && (
              <div style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                {client.contact}
              </div>
            )}
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              background: `${CLIENT_STATUS_COLORS[client.status as ClientStatus]}20`,
              color: CLIENT_STATUS_COLORS[client.status as ClientStatus],
            }}
          >
            {CLIENT_STATUS_LABELS[client.status as ClientStatus]}
          </div>
        </div>
      </div>

      {/* 次回ミーティング */}
      {client.nextMeeting && meetingWarning && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            background: 'var(--bg-gray)',
            borderRadius: '6px',
            borderLeft: `3px solid ${meetingWarning.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={14} />
          次回: {new Date(client.nextMeeting).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} {meetingWarning.text}
        </div>
      )}

      {/* 契約期限 */}
      {client.contractDeadline && deadlineWarning && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            background: 'var(--bg-gray)',
            borderRadius: '6px',
            borderLeft: `3px solid ${deadlineWarning.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={14} />
          契約期限: <span style={{ color: deadlineWarning.color, fontWeight: 600 }}>
            {new Date(client.contractDeadline).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} {deadlineWarning.text}
          </span>
        </div>
      )}

      {/* 履歴表示 */}
      {!isExpanded && client.history && client.history.length > 0 && (
        <HistorySection history={client.history} />
      )}

      {/* 編集ボタン */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button
          onClick={onToggleExpand}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: isExpanded ? '#f44336' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded ? '閉じる' : '編集'}
        </button>
        <button
          onClick={async () => {
            if (confirm('このクライアントを削除しますか？')) {
              await onDelete();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'transparent',
            color: '#f44336',
            border: '1px solid #f44336',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <Trash2 size={16} />
          削除
        </button>
      </div>

      {/* 編集フォーム（展開時） */}
      {isExpanded && (
        <ClientEditForm
          client={client}
          onSave={handleSave}
          onCancel={onToggleExpand}
        />
      )}
    </div>
  );
});
