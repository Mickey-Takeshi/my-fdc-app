'use client';

/**
 * app/(app)/clients/_components/ClientDetailModal.tsx
 *
 * クライアント詳細・編集モーダル（Phase 7）
 */

import { useState } from 'react';
import {
  X,
  Save,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import {
  CLIENT_STATUS_LABELS,
  type Client,
  type ClientStatus,
} from '@/lib/types/client';

interface ClientDetailModalProps {
  client: Client;
  onUpdate: (data: Record<string, string | null>) => Promise<boolean>;
  onClose: () => void;
}

export default function ClientDetailModal({
  client,
  onUpdate,
  onClose,
}: ClientDetailModalProps) {
  const [companyName, setCompanyName] = useState(client.companyName);
  const [contactPerson, setContactPerson] = useState(client.contactPerson);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [status, setStatus] = useState<ClientStatus>(client.status);
  const [notes, setNotes] = useState(client.notes);
  const [contractDeadline, setContractDeadline] = useState(
    client.contractDeadline ? client.contractDeadline.substring(0, 10) : ''
  );
  const [nextMeeting, setNextMeeting] = useState(
    client.nextMeeting ? client.nextMeeting.substring(0, 10) : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!contactPerson.trim()) {
      setError('担当者名は必須です');
      return;
    }

    setIsSaving(true);
    setError('');

    const data: Record<string, string | null> = {
      company_name: companyName.trim(),
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      notes: notes.trim(),
      contract_deadline: contractDeadline || null,
      next_meeting: nextMeeting || null,
    };

    const success = await onUpdate(data);
    if (success) {
      onClose();
    } else {
      setError('更新に失敗しました');
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>クライアント詳細</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>
            <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            会社名
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            <User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            担当者名
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
          >
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>
              <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              メール
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              電話
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              契約期限
            </label>
            <input
              type="date"
              value={contractDeadline}
              onChange={(e) => setContractDeadline(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              次回打合せ
            </label>
            <input
              type="date"
              value={nextMeeting}
              onChange={(e) => setNextMeeting(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            メモ
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* 履歴 */}
        {client.history.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
              履歴
            </label>
            <div style={{
              background: 'var(--bg-gray)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
            }}>
              {client.history.map((entry, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '4px 0',
                  borderBottom: idx < client.history.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(entry.date).toLocaleDateString('ja-JP')}
                  </span>
                  <span>{entry.action}</span>
                  {entry.note && (
                    <span style={{ color: 'var(--text-muted)' }}>- {entry.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {client.leadId && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            元リード ID: {client.leadId}
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          作成日: {new Date(client.createdAt).toLocaleString('ja-JP')}
          {' / '}
          更新日: {new Date(client.updatedAt).toLocaleString('ja-JP')}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
