/**
 * app/_components/clients/AddClientForm.tsx
 *
 * Phase 7: クライアント追加フォーム
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateClientInput } from '@/lib/types/client';

interface AddClientFormProps {
  onAdd: (input: CreateClientInput) => Promise<void>;
  onClose: () => void;
}

export function AddClientForm({ onAdd, onClose }: AddClientFormProps) {
  const [contactPerson, setContactPerson] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contractDeadline, setContractDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contactPerson.trim()) {
      setError('担当者名は必須です');
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        contactPerson: contactPerson.trim(),
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        contractDeadline: contractDeadline || null,
        notes: notes.trim() || undefined,
        status: 'client',
      });
      onClose();
    } catch (err) {
      setError('追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0 }}>新規クライアント追加</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: '#FFEBEE',
            color: '#C62828',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
              担当者名 *
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="山田太郎"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              required
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
              会社名
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社サンプル"
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
              メール
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
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
              電話番号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-1234-5678"
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
            rows={2}
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
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '追加中...' : '追加'}
          </button>
        </div>
      </form>
    </div>
  );
}
