'use client';

/**
 * app/(app)/clients/_components/AddClientForm.tsx
 *
 * クライアント追加モーダル（Phase 7）
 */

import { useState } from 'react';
import { X, Plus, Building2, User, Mail, Phone, MessageSquare } from 'lucide-react';

interface AddClientFormProps {
  onSubmit: (data: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    notes: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export default function AddClientForm({ onSubmit, onClose }: AddClientFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson.trim()) {
      setError('担当者名は必須です');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const success = await onSubmit({
      company_name: companyName.trim(),
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });

    if (success) {
      onClose();
    } else {
      setError('クライアントの作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>クライアントを追加</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              会社名
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社サンプル"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>
              <User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              担当者名 *
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="山田 太郎"
            />
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
                placeholder="yamada@example.com"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                電話番号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03-1234-5678"
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
              placeholder="契約内容やメモを入力..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Plus size={16} />
              {isSubmitting ? '作成中...' : 'クライアントを追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
