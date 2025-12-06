'use client';

import { useEffect } from 'react';

interface LostSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  leadName: string;
  lostSurvey: { reason: string; reasonOther: string; feedback: string };
  setLostSurvey: (survey: { reason: string; reasonOther: string; feedback: string }) => void;
}

export function LostSurveyModal({
  isOpen,
  onClose,
  onSubmit,
  leadName,
  lostSurvey,
  setLostSurvey,
}: LostSurveyModalProps) {
  // Escapeキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // モーダルが開いたときにフォーカスをトラップ
      const modal = document.getElementById('lost-survey-modal');
      modal?.focus();
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        id="lost-survey-modal"
        className="card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lost-survey-title"
        aria-describedby="lost-survey-desc"
        tabIndex={-1}
        style={{
          width: '90%',
          maxWidth: '500px',
          padding: '30px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="lost-survey-title"
          style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}
        >
          失注アンケート
        </h3>
        <p
          id="lost-survey-desc"
          style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-medium)' }}
        >
          {leadName} の失注理由を教えてください
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="lost-reason-select"
            style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}
          >
            失注理由 <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
            <span className="sr-only">（必須）</span>
          </label>
          <select
            id="lost-reason-select"
            value={lostSurvey.reason}
            onChange={(e) => setLostSurvey({ ...lostSurvey, reason: e.target.value })}
            aria-required="true"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="">選択してください</option>
            <option value="価格が高い">価格が高い</option>
            <option value="他社を選択">他社を選択</option>
            <option value="タイミング不一致">タイミング不一致</option>
            <option value="決裁が下りない">決裁が下りない</option>
            <option value="ニーズ不一致">ニーズ不一致</option>
            <option value="その他">その他</option>
          </select>
        </div>

        {lostSurvey.reason === 'その他' && (
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="lost-reason-other"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}
            >
              具体的な理由
            </label>
            <input
              id="lost-reason-other"
              type="text"
              value={lostSurvey.reasonOther}
              onChange={(e) => setLostSurvey({ ...lostSurvey, reasonOther: e.target.value })}
              placeholder="具体的な理由を入力"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="lost-feedback"
            style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}
          >
            詳細フィードバック（任意）
          </label>
          <textarea
            id="lost-feedback"
            value={lostSurvey.feedback}
            onChange={(e) => setLostSurvey({ ...lostSurvey, feedback: e.target.value })}
            placeholder="詳細な状況や改善点など"
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            送信
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
