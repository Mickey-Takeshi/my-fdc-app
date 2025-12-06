'use client';

import { useState, memo } from 'react';
import { Save, X } from 'lucide-react';

interface AddClientFormProps {
  onSubmit: (data: { name: string; company: string; contact: string; contractDeadline?: string }) => void;
  onCancel: () => void;
}

/**
 * 新規クライアント追加フォーム
 */
export const AddClientForm = memo(function AddClientForm({
  onSubmit,
  onCancel,
}: AddClientFormProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [contractDeadline, setContractDeadline] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('担当者名を入力してください');
      return;
    }
    onSubmit({
      name: name.trim(),
      company: company.trim(),
      contact: contact.trim(),
      contractDeadline: contractDeadline || undefined,
    });
    setName('');
    setCompany('');
    setContact('');
    setContractDeadline('');
  };

  return (
    <div
      style={{
        background: '#f0f7ff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        border: '2px solid var(--primary)',
      }}
    >
      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>新規既存客を追加</h4>
      <div style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            担当者名 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：山田太郎"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            会社名
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="例：株式会社ABC"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            連絡先
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="例：yamada@example.com"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            契約期限
          </label>
          <input
            type="date"
            value={contractDeadline}
            onChange={(e) => setContractDeadline(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          onClick={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
          <Save size={16} />
          追加
        </button>
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
          <X size={16} />
          キャンセル
        </button>
      </div>
    </div>
  );
});
