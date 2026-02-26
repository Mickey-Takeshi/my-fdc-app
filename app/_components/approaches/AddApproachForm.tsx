/**
 * app/_components/approaches/AddApproachForm.tsx
 *
 * Phase 8: アプローチ追加フォーム
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
  ApproachType,
  ApproachResult,
  CreateApproachInput,
} from '@/lib/types/approach';
import {
  APPROACH_TYPE_LABELS,
  APPROACH_RESULT_LABELS,
} from '@/lib/types/approach';

interface AddApproachFormProps {
  leadId: string;
  onAdd: (input: CreateApproachInput) => Promise<void>;
  onClose: () => void;
}

export function AddApproachForm({
  leadId,
  onAdd,
  onClose,
}: AddApproachFormProps) {
  const [type, setType] = useState<ApproachType>('call');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ApproachResult | ''>('');
  const [resultNote, setResultNote] = useState('');
  const [approachedAt, setApproachedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('内容は必須です');
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        leadId,
        type,
        content: content.trim(),
        result: result || undefined,
        resultNote: resultNote.trim() || undefined,
        approachedAt: new Date(approachedAt).toISOString(),
      });
      onClose();
    } catch {
      setError('追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h4 style={{ margin: 0 }}>アプローチ記録</h4>
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
              タイプ *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ApproachType)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {Object.entries(APPROACH_TYPE_LABELS).map(([value, label]) => (
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
              日時
            </label>
            <input
              type="datetime-local"
              value={approachedAt}
              onChange={(e) => setApproachedAt(e.target.value)}
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
              結果
            </label>
            <select
              value={result}
              onChange={(e) =>
                setResult(e.target.value as ApproachResult | '')
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">未選択</option>
              {Object.entries(APPROACH_RESULT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
            内容 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="アプローチの内容を記録..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
            required
          />
        </div>

        {result && (
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-light)',
                marginBottom: '4px',
              }}
            >
              結果メモ
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              rows={2}
              placeholder="結果の詳細..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        )}

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
            onClick={onClose}
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={saving}
          >
            {saving ? '記録中...' : '記録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
