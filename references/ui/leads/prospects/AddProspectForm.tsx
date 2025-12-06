'use client';

import { useState } from 'react';
import type { Lead, LeadStatus, LeadChannel } from '@/lib/hooks/useLeads';

interface AddProspectFormProps {
  onAdd: (lead: Partial<Lead>) => Promise<void>;
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

export function AddProspectForm({ onAdd, onCancel }: AddProspectFormProps) {
  const [newLead, setNewLead] = useState<NewLeadState>(initialState);

  const handleAddLead = async () => {
    if (!newLead.contactPerson) {
      alert('担当者名（名前）は必須です');
      return;
    }

    try {
      await onAdd(newLead);
      setNewLead(initialState);
      onCancel();
      alert('見込み客を追加しました');
    } catch {
      alert('見込み客の追加に失敗しました');
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }} role="form" aria-label="新規見込み客追加フォーム">
      <h3 id="add-lead-title" style={{ marginBottom: '15px' }}>新規見込み客</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div className="form-group">
          <label htmlFor="lead-name">
            名前 <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
            <span className="sr-only">（必須）</span>
          </label>
          <input
            id="lead-name"
            type="text"
            value={newLead.contactPerson}
            onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
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
            onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
            placeholder="例：株式会社〇〇"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-contact">連絡先</label>
          <input
            id="lead-contact"
            type="text"
            value={newLead.email || newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
            placeholder="例：メール、電話番号、SNS"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lead-status">ステータス</label>
          <select
            id="lead-status"
            value={newLead.status}
            onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })}
          >
            <option value="UNCONTACTED">未接触</option>
            <option value="RESPONDED">反応あり</option>
            <option value="NEGOTIATION">商談中</option>
            <option value="WON">成約</option>
            <option value="LOST">失注</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="lead-channel">集客チャネル</label>
          <select
            id="lead-channel"
            value={newLead.channel}
            onChange={(e) => setNewLead({ ...newLead, channel: e.target.value as LeadChannel })}
          >
            <option value="REAL">リアル</option>
            <option value="HP">HP</option>
            <option value="MAIL_MAGAZINE">メルマガ</option>
            <option value="MESSENGER">メッセンジャー</option>
            <option value="X">X</option>
            <option value="PHONE_SMS">電話・SMS</option>
            <option value="WEB_APP">WEBアプリ</option>
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
        <button className="btn btn-primary" onClick={handleAddLead}>追加</button>
        <button className="btn btn-secondary" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
}
