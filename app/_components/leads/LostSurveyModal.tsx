/**
 * app/_components/leads/LostSurveyModal.tsx
 *
 * Phase 6: 失注アンケートモーダル
 */

'use client';

import { LOST_REASON_LABELS, type LostReason } from '@/lib/types/lead';

interface LostSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  leadName: string;
  lostSurvey: {
    reason: string;
    reasonOther: string;
    feedback: string;
  };
  setLostSurvey: (survey: {
    reason: string;
    reasonOther: string;
    feedback: string;
  }) => void;
}

export function LostSurveyModal({
  isOpen,
  onClose,
  onSubmit,
  leadName,
  lostSurvey,
  setLostSurvey,
}: LostSurveyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '20px' }}>失注アンケート</h3>
        <p style={{ marginBottom: '15px', color: 'var(--text-medium)' }}>
          「{leadName}」を失注に変更します。
          <br />
          今後の改善のため、失注理由を教えてください。
        </p>

        <div className="form-group">
          <label htmlFor="lost-reason">
            失注理由{' '}
            <span style={{ color: 'var(--error)' }} aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="lost-reason"
            value={lostSurvey.reason}
            onChange={(e) =>
              setLostSurvey({ ...lostSurvey, reason: e.target.value })
            }
            style={{ width: '100%' }}
          >
            <option value="">選択してください</option>
            {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {lostSurvey.reason === 'OTHER' && (
          <div className="form-group">
            <label htmlFor="lost-reason-other">その他の理由</label>
            <input
              id="lost-reason-other"
              type="text"
              value={lostSurvey.reasonOther}
              onChange={(e) =>
                setLostSurvey({ ...lostSurvey, reasonOther: e.target.value })
              }
              placeholder="具体的な理由を入力"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="lost-feedback">フィードバック（任意）</label>
          <textarea
            id="lost-feedback"
            value={lostSurvey.feedback}
            onChange={(e) =>
              setLostSurvey({ ...lostSurvey, feedback: e.target.value })
            }
            placeholder="今後の改善に向けたフィードバックがあれば入力してください"
            rows={3}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={!lostSurvey.reason}
          >
            失注として記録
          </button>
        </div>
      </div>
    </div>
  );
}
