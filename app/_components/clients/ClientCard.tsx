/**
 * app/_components/clients/ClientCard.tsx
 *
 * Phase 7: クライアントカードコンポーネント
 */

'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import type { Client, ClientHistoryEntry } from '@/lib/types/client';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  isContractDeadlineNear,
  isContractExpired,
  isNextMeetingNear,
} from '@/lib/types/client';
import { ClientEditForm } from './ClientEditForm';

interface ClientCardProps {
  client: Client;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<Client | null>;
  onDelete: (id: string) => Promise<void>;
}

export function ClientCard({ client, onUpdate, onDelete }: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const deadlineNear = isContractDeadlineNear(client.contractDeadline);
  const expired = isContractExpired(client.contractDeadline);
  const meetingNear = isNextMeetingNear(client.nextMeeting);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ja-JP');
  };

  const handleSave = async (updates: Partial<Client>) => {
    // 履歴に編集を追加
    const historyEntry: ClientHistoryEntry = {
      date: new Date().toISOString(),
      action: '情報更新',
      note: Object.keys(updates).join(', ') + ' を更新',
    };
    const newHistory = [...(client.history || []), historyEntry];

    await onUpdate(client.id, { ...updates, history: newHistory });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`${client.contactPerson} を削除しますか？`)) {
      await onDelete(client.id);
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '12px',
        borderLeft: `4px solid ${expired ? '#FF5722' : CLIENT_STATUS_COLORS[client.status]}`,
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: '16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '16px' }}>
              {client.contactPerson}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: expired
                  ? '#FFEBEE'
                  : CLIENT_STATUS_COLORS[client.status] + '20',
                color: expired ? '#C62828' : CLIENT_STATUS_COLORS[client.status],
              }}
            >
              {expired ? '契約期限切れ' : CLIENT_STATUS_LABELS[client.status]}
            </span>
          </div>

          {client.companyName && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Building2 size={13} /> {client.companyName}
            </div>
          )}

          {/* 警告表示 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {(deadlineNear || expired) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: expired ? '#C62828' : '#F57C00',
                }}
              >
                <AlertTriangle size={14} />
                {expired
                  ? `契約期限切れ (${formatDate(client.contractDeadline)})`
                  : `契約期限まもなく (${formatDate(client.contractDeadline)})`}
              </div>
            )}
            {meetingNear && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#1976D2',
                }}
              >
                <Clock size={14} />
                次MTG: {formatDate(client.nextMeeting)}
              </div>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {/* 展開コンテンツ */}
      {expanded && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {editing ? (
            <ClientEditForm
              client={client}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {/* 詳細情報 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '4px',
                    }}
                  >
                    メール
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <Mail size={14} /> {client.email || '-'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '4px',
                    }}
                  >
                    電話
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <Phone size={14} /> {client.phone || '-'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '4px',
                    }}
                  >
                    契約期限
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                      color: expired ? '#C62828' : deadlineNear ? '#F57C00' : 'inherit',
                    }}
                  >
                    <Calendar size={14} /> {formatDate(client.contractDeadline)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '4px',
                    }}
                  >
                    次ミーティング
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                      color: meetingNear ? '#1976D2' : 'inherit',
                    }}
                  >
                    <Clock size={14} /> {formatDate(client.nextMeeting)}
                  </div>
                </div>
              </div>

              {/* メモ */}
              {client.notes && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FileText size={12} /> メモ
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      padding: '8px',
                      background: 'var(--bg-gray)',
                      borderRadius: '4px',
                    }}
                  >
                    {client.notes}
                  </div>
                </div>
              )}

              {/* 履歴 */}
              {client.history && client.history.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                      marginBottom: '8px',
                    }}
                  >
                    履歴
                  </div>
                  <div
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      fontSize: '13px',
                    }}
                  >
                    {[...client.history].reverse().map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '6px 0',
                          borderBottom:
                            idx < client.history!.length - 1
                              ? '1px solid var(--border)'
                              : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--text-light)' }}>
                            {new Date(entry.date).toLocaleDateString('ja-JP')}
                          </span>
                          <span style={{ fontWeight: 500 }}>{entry.action}</span>
                        </div>
                        {entry.note && (
                          <div
                            style={{
                              color: 'var(--text-light)',
                              marginTop: '2px',
                            }}
                          >
                            {entry.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* アクション */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => setEditing(true)}
                >
                  編集
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleDelete}
                  style={{ color: '#C62828' }}
                >
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
