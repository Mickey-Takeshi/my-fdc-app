/**
 * app/_components/leads/AddLeadForm.tsx
 *
 * Phase 6: リード追加フォーム
 */

'use client';

import { useState } from 'react';
import type { LeadStatus, LeadChannel, CreateLeadInput } from '@/lib/types/lead';
import { LEAD_STATUS_LABELS, LEAD_CHANNEL_LABELS } from '@/lib/types/lead';

interface AddLeadFormProps {
  onAdd: (input: CreateLeadInput) => Promise<unknown>;
  onCancel: () => void;
}

interface NewLeadState {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: LeadStatus;
  channel: LeadChannel;
  memo: string;
}

const initialState: NewLeadState = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  status: 'UNCONTACTED',
  channel: 'HP',
  memo: '',
};

export function AddLeadForm({ onAdd, onCancel }: AddLeadFormProps) {
  const [newLead, setNewLead] = useState<NewLeadState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleAddLead = async () => {
    if (!newLead.contactPerson) {
      alert('担当者名（名前）は必須です');
      return;
    }

    try {
      setSubmitting(true);
      await onAdd(newLead);
      setNewLead(initialState);
      onCancel();
      alert('リードを追加しました');
    } catch {
      alert('リードの追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{ marginBottom: '20px' }}
      role="form"
      aria-label="新規リード追加フォーム"
    >
      <h3 id="add-lead-title" style={{ marginBottom: '15px' }}>
        新規リード
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
        }}
      >
        <div className="form-group">
          <label htmlFor="lead-name">
            名前{' '}
            <span style={{ color: 'var(--error)' }} aria-hidden="true">
              *
            </span>
            <span className="sr-only">（必須）</span>
          </label>
          <input
            id="lead-name"
            type="text"
            value={newLead.contactPerson}
            onChange={(e) =>
              setNewLead({ ...newLead, contactPerson: e.target.value })
            }
            placeholder="例：山田太郎"
            aria-required="true"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-company">会社名（任意）</label>
          <input
            id="lead-company"
            type="text"
            value={newLead.companyName}
            onChange={(e) =>
              setNewLead({ ...newLead, companyName: e.target.value })
            }
            placeholder="例：株式会社〇〇"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-email">メール</label>
          <input
            id="lead-email"
            type="email"
            value={newLead.email}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
            placeholder="例：example@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-phone">電話番号</label>
          <input
            id="lead-phone"
            type="tel"
            value={newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            placeholder="例：090-1234-5678"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-status">ステータス</label>
          <select
            id="lead-status"
            value={newLead.status}
            onChange={(e) =>
              setNewLead({ ...newLead, status: e.target.value as LeadStatus })
            }
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="lead-channel">集客チャネル</label>
          <select
            id="lead-channel"
            value={newLead.channel}
            onChange={(e) =>
              setNewLead({ ...newLead, channel: e.target.value as LeadChannel })
            }
          >
            {Object.entries(LEAD_CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group" style={{ marginTop: '15px' }}>
        <label htmlFor="lead-memo">メモ（任意）</label>
        <textarea
          id="lead-memo"
          value={newLead.memo}
          onChange={(e) => setNewLead({ ...newLead, memo: e.target.value })}
          placeholder="例：興味のあるサービス、やりたいこと、過去のやり取り等"
          rows={3}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          className="btn btn-primary"
          onClick={handleAddLead}
          disabled={submitting}
        >
          {submitting ? '追加中...' : '追加'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
