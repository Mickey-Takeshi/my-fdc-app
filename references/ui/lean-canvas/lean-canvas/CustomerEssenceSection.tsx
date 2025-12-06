'use client';

import { memo } from 'react';
import { Target, Heart } from 'lucide-react';
import type { LeanCanvasViewModel } from './types';

interface CustomerEssenceSectionProps {
  vm: LeanCanvasViewModel;
}

export const CustomerEssenceSection = memo(function CustomerEssenceSection({ vm }: CustomerEssenceSectionProps) {
  const { leanCanvas, editLeanCanvas, leanEditMode, saving, toggleLeanEditMode, updateEditLeanCanvas, saveLeanCanvas } = vm;

  return (
    <div>
      {/* 表示モード */}
      {!leanEditMode && (
        <div className="card" style={{
          marginBottom: '30px',
          background: 'linear-gradient(135deg, var(--primary-alpha-08) 0%, var(--primary-alpha-15) 100%)',
          borderLeft: '5px solid var(--primary-alpha-60)',
          padding: '25px',
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: 'var(--primary-dark)',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Target size={24} /> 顧客の本質
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {/* お客様のしたいこと */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary-alpha-40)',
            }}>
              <h4 style={{
                color: 'var(--primary-dark)',
                marginBottom: '10px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                お客様のしたいこと
              </h4>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#37474f',
                whiteSpace: 'pre-wrap',
              }}>
                {leanCanvas.customerWants || '未設定'}
              </div>
            </div>

            {/* 提供できる価値 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary-alpha-60)',
            }}>
              <h4 style={{
                color: 'var(--primary-dark)',
                marginBottom: '10px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                提供できる価値
              </h4>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#37474f',
                whiteSpace: 'pre-wrap',
              }}>
                {leanCanvas.valueProvided || '未設定'}
              </div>
            </div>

            {/* 感動ポイント */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              borderLeft: '3px solid var(--primary-alpha-80)',
            }}>
              <h4 style={{
                color: 'var(--primary-dark)',
                marginBottom: '10px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Heart size={18} />
                感動ポイント
              </h4>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#37474f',
                whiteSpace: 'pre-wrap',
              }}>
                {leanCanvas.emotionPoints || '未設定'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集モード */}
      {leanEditMode && (
        <div className="card" style={{
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #f0f9fa 0%, #e6f7f9 100%)',
          borderLeft: '4px solid var(--primary)',
        }}>
          <h3 style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Target size={24} /> 顧客の本質
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {/* お客様のしたいこと */}
            <div>
              <label style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '10px',
                color: 'var(--primary)',
                fontSize: '14px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                お客様のしたいこと
              </label>
              <textarea
                value={editLeanCanvas.customerWants}
                onChange={(e) => updateEditLeanCanvas('customerWants', e.target.value)}
                placeholder="例：外注なしで自分の世界観をプロダクト化したい／営業を効率化したい／意図が伝わる仕組みがほしい"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 提供できる価値 */}
            <div>
              <label style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '10px',
                color: 'var(--primary)',
                fontSize: '14px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                提供できる価値
              </label>
              <textarea
                value={editLeanCanvas.valueProvided}
                onChange={(e) => updateEditLeanCanvas('valueProvided', e.target.value)}
                placeholder="例：AIと対話して意図をコード化／営業時間1/3削減／創造の自由を取り戻す"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 感動ポイント */}
            <div>
              <label style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '10px',
                color: 'var(--primary)',
                fontSize: '14px',
              }}>
                <Heart size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                感動ポイント
              </label>
              <textarea
                value={editLeanCanvas.emotionPoints}
                onChange={(e) => updateEditLeanCanvas('emotionPoints', e.target.value)}
                placeholder="例：共鳴（静かな革命）／共創（一緒に創る喜び）／変容（存在から経営する）"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={saveLeanCanvas} disabled={saving} className="btn btn-primary">
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={toggleLeanEditMode} disabled={saving} className="btn btn-secondary">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
