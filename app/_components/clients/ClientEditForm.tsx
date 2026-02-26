/**
 * app/_components/clients/ClientEditForm.tsx
 *
 * Phase 7: クライアント編集フォーム
 */

'use client';

import { useState } from 'react';
import type { Client, ClientStatus } from '@/lib/types/client';
import { CLIENT_STATUS_LABELS } from '@/lib/types/client';

interface ClientEditFormProps {
  client: Client;
  onSave: (updates: Partial<Client>) => Promise<void>;
  onCancel: () => void;
}

export function ClientEditForm({
  client,
  onSave,
  onCancel,
}: ClientEditFormProps) {
  const [status, setStatus] = useState<ClientStatus>(client.status);
  const [contractDeadline, setContractDeadline] = useState(
    client.contractDeadline
      ? new Date(client.contractDeadline).toISOString().split('T')[0]
      : ''
  );
  const [nextMeeting, setNextMeeting] = useState(
    client.nextMeeting
      ? new Date(client.nextMeeting).toISOString().split('T')[0]
      : ''
  );
  const [notes, setNotes] = useState(client.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        status,
        contractDeadline: contractDeadline || null,
        nextMeeting: nextMeeting || null,
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--text-light)',
              marginBottom: '4px',
            }}
          >
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
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--text-light)',
              marginBottom: '4px',
            }}
          >
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

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--text-light)',
              marginBottom: '4px',
            }}
          >
            次ミーティング
          </label>
          <input
            type="date"
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
      </div>

      <div style={{ marginTop: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-light)',
            marginBottom: '4px',
          }}
        >
          メモ
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
          }}
          placeholder="メモを入力..."
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={onCancel}
          disabled={saving}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-small"
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
