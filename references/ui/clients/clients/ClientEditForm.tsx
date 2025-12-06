'use client';

import { useState, memo } from 'react';
import type { ClientWithHistory } from '@/lib/hooks/useClientsViewModel';
import { ClientStatus } from '@/lib/types/app-data';

interface ClientEditFormProps {
  client: ClientWithHistory;
  onSave: (data: {
    status: ClientStatus;
    contractDeadline: string;
    nextMeeting: string;
    newNote: string;
  }) => void;
  onCancel: () => void;
}

/**
 * クライアント編集フォーム
 */
export const ClientEditForm = memo(function ClientEditForm({
  client,
  onSave,
  onCancel,
}: ClientEditFormProps) {
  const [status, setStatus] = useState<ClientStatus>(client.status as ClientStatus);
  const [contractDeadline, setContractDeadline] = useState(client.contractDeadline || '');
  const [nextMeeting, setNextMeeting] = useState(client.nextMeeting || '');
  const [newNote, setNewNote] = useState('');

  const handleSave = () => {
    onSave({
      status,
      contractDeadline,
      nextMeeting,
      newNote,
    });
  };

  return (
    <div
      style={{
        marginTop: '15px',
        padding: '20px',
        background: '#f0f7ff',
        borderRadius: '8px',
        border: '2px solid var(--primary)',
      }}
    >
      <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>クライアント情報編集</h4>

      {/* ステータス */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>
          ステータス
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ClientStatus)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="client">既存客</option>
          <option value="contract_expired">契約満了</option>
        </select>
      </div>

      {/* 契約期限 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>
          契約期限
        </label>
        <input
          type="date"
          value={contractDeadline}
          onChange={(e) => setContractDeadline(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* 次回ミーティング */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>
          次回ミーティング
        </label>
        <input
          type="datetime-local"
          value={nextMeeting}
          onChange={(e) => setNextMeeting(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* メモ追加 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>
          新しいメモを追加
        </label>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="取引メモを入力..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* 保存ボタン */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          保存
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            background: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
});
