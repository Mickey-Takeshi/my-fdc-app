'use client';

/**
 * app/(app)/leads/_components/ProspectDetailModal.tsx
 *
 * リード詳細・編集モーダル（Phase 6）
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
} from 'lucide-react';
import {
  ALL_STATUSES,
  PROSPECT_STATUS_LABELS,
  type Prospect,
  type ProspectStatus,
} from '@/lib/types/prospect';

interface ProspectDetailModalProps {
  prospect: Prospect;
  onUpdate: (data: Record<string, string>) => Promise<boolean>;
  onClose: () => void;
}

export default function ProspectDetailModal({
  prospect,
  onUpdate,
  onClose,
}: ProspectDetailModalProps) {
  const [companyName, setCompanyName] = useState(prospect.companyName);
  const [contactPerson, setContactPerson] = useState(prospect.contactPerson);
  const [email, setEmail] = useState(prospect.email);
  const [phone, setPhone] = useState(prospect.phone);
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [channel, setChannel] = useState(prospect.channel);
  const [memo, setMemo] = useState(prospect.memo);
  const [lostReason, setLostReason] = useState(prospect.lostReason);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!companyName.trim() || !contactPerson.trim()) {
      setError('会社名と担当者名は必須です');
      return;
    }

    setIsSaving(true);
    setError('');

    const data: Record<string, string> = {
      company_name: companyName.trim(),
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      channel: channel.trim(),
      memo: memo.trim(),
    };

    if (status === 'lost') {
      data.lost_reason = lostReason.trim();
    }

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
          <h2>リード詳細</h2>
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
            onChange={(e) => setStatus(e.target.value as ProspectStatus)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROSPECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {status === 'lost' && (
          <div className="form-group">
            <label>失注理由</label>
            <input
              type="text"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="価格、競合、タイミングなど"
            />
          </div>
        )}

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

        <div className="form-group">
          <label>チャネル</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">選択してください</option>
            <option value="Web">Web</option>
            <option value="紹介">紹介</option>
            <option value="展示会">展示会</option>
            <option value="広告">広告</option>
            <option value="テレアポ">テレアポ</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          作成日: {new Date(prospect.createdAt).toLocaleString('ja-JP')}
          {' / '}
          更新日: {new Date(prospect.updatedAt).toLocaleString('ja-JP')}
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
