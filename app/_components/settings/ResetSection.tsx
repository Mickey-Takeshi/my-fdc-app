/**
 * app/_components/settings/ResetSection.tsx
 *
 * データリセットセクション（2段階確認）
 */

'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface ResetSectionProps {
  onReset: () => void;
}

export function ResetSection({ onReset }: ResetSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const CONFIRM_WORD = 'リセット';

  const handleReset = () => {
    if (confirmText !== CONFIRM_WORD) return;

    onReset();
    setShowModal(false);
    setConfirmText('');

    // リセット後にページリロード
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleClose = () => {
    setShowModal(false);
    setConfirmText('');
  };

  return (
    <>
      <SectionCard
        title="データのリセット"
        icon={<Trash2 size={24} color="#dc2626" />}
        description="すべてのデータを削除して初期状態に戻します"
      >
        <div
          style={{
            padding: '16px',
            background: '#fef2f2',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#dc2626',
                }}
              >
                この操作は取り消せません
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#b91c1c',
                }}
              >
                プロフィール、設定、すべてのタスクが削除されます。
                リセット前にエクスポートでバックアップを取ることをお勧めします。
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'white',
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={16} />
          すべてのデータをリセット
        </button>
      </SectionCard>

      {/* 確認モーダル */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border, #e5e7eb)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#dc2626' }}>
                  データのリセット
                </h2>
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} color="var(--text-light, #9ca3af)" />
              </button>
            </div>

            {/* 本文 */}
            <div style={{ padding: '20px' }}>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: '14px',
                  color: 'var(--text-dark, #1f2937)',
                }}
              >
                本当にすべてのデータを削除しますか？
                この操作は取り消すことができません。
              </p>

              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '13px',
                  color: 'var(--text-light, #9ca3af)',
                }}
              >
                確認のため「<strong>{CONFIRM_WORD}</strong>」と入力してください：
              </p>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '20px',
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: 'var(--text-dark, #1f2937)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleReset}
                  disabled={confirmText !== CONFIRM_WORD}
                  style={{
                    padding: '10px 20px',
                    background: confirmText === CONFIRM_WORD ? '#dc2626' : '#e5e7eb',
                    color: confirmText === CONFIRM_WORD ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: confirmText === CONFIRM_WORD ? 'pointer' : 'not-allowed',
                  }}
                >
                  リセット実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResetSection;
