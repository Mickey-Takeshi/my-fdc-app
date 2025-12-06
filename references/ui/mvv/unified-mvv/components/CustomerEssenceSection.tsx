/**
 * app/_components/mvv/unified-mvv/components/CustomerEssenceSection.tsx
 * 顧客の本質セクション
 */

'use client';

import { Eye, Edit3, Target } from 'lucide-react';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';

interface CustomerEssenceSectionProps {
  leanCanvas: ReturnType<typeof useLeanCanvasViewModel>['leanCanvas'];
  editLeanCanvas: ReturnType<typeof useLeanCanvasViewModel>['editLeanCanvas'];
  leanEditMode: boolean;
  saving: boolean;
  toggleLeanEditMode: () => void;
  updateEditLeanCanvas: ReturnType<typeof useLeanCanvasViewModel>['updateEditLeanCanvas'];
  saveLeanCanvas: () => Promise<void>;
}

export function CustomerEssenceSection({
  leanCanvas,
  editLeanCanvas,
  leanEditMode,
  saving,
  toggleLeanEditMode,
  updateEditLeanCanvas,
  saveLeanCanvas,
}: CustomerEssenceSectionProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} /> 顧客の本質
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleLeanEditMode} className="btn btn-secondary btn-small">
            {leanEditMode ? <Eye size={14} /> : <Edit3 size={14} />}
            {leanEditMode ? '表示' : '編集'}
          </button>
          {leanEditMode && (
            <button onClick={saveLeanCanvas} disabled={saving} className="btn btn-primary btn-small">
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary-alpha-08) 0%, var(--primary-alpha-15) 100%)',
        borderLeft: '5px solid var(--primary-alpha-60)',
        padding: '25px',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {(['customerWants', 'valueProvided', 'emotionPoints'] as const).map((key, index) => {
            const labels = {
              customerWants: 'お客様のしたいこと',
              valueProvided: '提供できる価値',
              emotionPoints: '感動ポイント',
            };
            const borderOpacity = 0.4 + index * 0.2;
            return (
              <div key={key} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `3px solid rgba(var(--primary-rgb), ${borderOpacity})`,
              }}>
                <h4 style={{ color: 'var(--primary-dark)', marginBottom: '10px', fontSize: '16px' }}>{labels[key]}</h4>
                {leanEditMode ? (
                  <textarea
                    value={editLeanCanvas[key] || ''}
                    onChange={(e) => updateEditLeanCanvas(key, e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#37474f', whiteSpace: 'pre-wrap' }}>
                    {leanCanvas[key] || '未設定'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
