'use client';

/**
 * app/(app)/leads/_components/ApproachTimeline.tsx
 *
 * アプローチタイムライン（Phase 8）
 * リードへのアプローチ履歴をタイムライン形式で表示
 */

import { useState } from 'react';
import {
  Phone,
  Mail,
  Users as MeetingIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  APPROACH_TYPE_LABELS,
  APPROACH_RESULT_LABELS,
  ALL_APPROACH_TYPES,
  type Approach,
  type ApproachType,
  type ApproachResult,
} from '@/lib/types/approach';

const TYPE_ICONS: Record<ApproachType, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: MeetingIcon,
  visit: MapPin,
  other: MoreHorizontal,
};

interface ApproachTimelineProps {
  approaches: Approach[];
  onAdd: (data: {
    type: ApproachType;
    content: string;
    result: ApproachResult;
    result_note: string;
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}

export default function ApproachTimeline({
  approaches,
  onAdd,
  onDelete,
}: ApproachTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ApproachType>('call');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ApproachResult>('');
  const [resultNote, setResultNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    const success = await onAdd({
      type,
      content: content.trim(),
      result,
      result_note: resultNote.trim(),
    });

    if (success) {
      setContent('');
      setResult('');
      setResultNote('');
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="approach-timeline">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>
          アプローチ履歴 ({approaches.length})
        </h3>
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? '閉じる' : '記録'}
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div style={{
          background: 'var(--bg-gray)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '13px' }}>種別</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ApproachType)}
                style={{ padding: '8px', fontSize: '13px' }}
              >
                {ALL_APPROACH_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {APPROACH_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '13px' }}>結果</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as ApproachResult)}
                style={{ padding: '8px', fontSize: '13px' }}
              >
                <option value="">未記入</option>
                <option value="positive">好感触</option>
                <option value="neutral">普通</option>
                <option value="negative">反応薄い</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '13px' }}>内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="アプローチの内容を記録..."
              style={{ minHeight: '60px', padding: '8px', fontSize: '13px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '13px' }}>メモ</label>
            <input
              type="text"
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              placeholder="次回アクションなど"
              style={{ padding: '8px', fontSize: '13px' }}
            />
          </div>
          <button
            className="btn btn-primary btn-small"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            style={{ width: '100%' }}
          >
            {isSubmitting ? '記録中...' : 'アプローチを記録'}
          </button>
        </div>
      )}

      {/* タイムライン */}
      {approaches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          アプローチ記録がありません
        </div>
      ) : (
        <div className="timeline-list">
          {approaches.map((approach) => {
            const Icon = TYPE_ICONS[approach.type];
            return (
              <div key={approach.id} className="timeline-item">
                <div className="timeline-dot">
                  <Icon size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-type">
                      {APPROACH_TYPE_LABELS[approach.type]}
                    </span>
                    {approach.result && (
                      <span className={`timeline-result result-${approach.result}`}>
                        {APPROACH_RESULT_LABELS[approach.result]}
                      </span>
                    )}
                    <span className="timeline-date">
                      {new Date(approach.approachedAt).toLocaleDateString('ja-JP')}
                    </span>
                    <button
                      className="timeline-delete"
                      onClick={() => onDelete(approach.id)}
                      aria-label="削除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="timeline-body">
                    {approach.content}
                  </div>
                  {approach.resultNote && (
                    <div className="timeline-note">
                      {approach.resultNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
