/**
 * app/_components/mvv/unified-mvv/components/CustomerJourneySection.tsx
 * カスタマージャーニーセクション（5フェーズ固定版）
 */

'use client';

import {
  Eye,
  Edit3,
  MapPin,
  Users,
  Lightbulb,
  MessageSquare,
  ShoppingCart,
  Repeat,
} from 'lucide-react';
import { CustomerJourneyPhase } from '@/lib/types/app-data';

interface CustomerJourneySectionProps {
  customerJourney: CustomerJourneyPhase[];
  editJourney: CustomerJourneyPhase[];
  journeyEditMode: boolean;
  saving: boolean;
  toggleJourneyEditMode: () => void;
  updateEditJourneyPhase: (index: number, field: keyof CustomerJourneyPhase, value: string) => void;
  saveJourney: () => Promise<void>;
}

// 5フェーズの設定（プライマリカラーのグラデーション）
const PHASES = [
  { name: '認知', icon: Users, color: 'var(--primary-light)', borderColor: 'var(--primary-alpha-25)', bgColor: 'var(--primary-alpha-08)', description: '見込み客があなたを知る段階' },
  { name: '興味', icon: Lightbulb, color: 'var(--primary)', borderColor: 'var(--primary-alpha-30)', bgColor: 'var(--primary-alpha-10)', description: '興味を持ち情報収集する段階' },
  { name: '検討', icon: MessageSquare, color: 'var(--primary)', borderColor: 'var(--primary-alpha-30)', bgColor: 'var(--primary-alpha-10)', description: '他社と比較検討する段階' },
  { name: '購入', icon: ShoppingCart, color: 'var(--primary-dark)', borderColor: 'var(--primary-alpha-35)', bgColor: 'var(--primary-alpha-12)', description: '購入を決断する段階' },
  { name: '継続', icon: Repeat, color: 'var(--primary-dark)', borderColor: 'var(--primary-alpha-35)', bgColor: 'var(--primary-alpha-12)', description: 'リピート・紹介につなげる段階' },
];

export function CustomerJourneySection({
  customerJourney,
  editJourney,
  journeyEditMode,
  saving,
  toggleJourneyEditMode,
  updateEditJourneyPhase,
  saveJourney,
}: CustomerJourneySectionProps) {
  const data = journeyEditMode ? editJourney : customerJourney;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{
          margin: '0',
          color: 'var(--primary-dark)',
          fontSize: '18px',
          fontWeight: '700',
          borderLeft: '4px solid var(--primary)',
          paddingLeft: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MapPin size={20} /> カスタマージャーニー
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleJourneyEditMode} className="btn btn-secondary btn-small">
            {journeyEditMode ? <Eye size={14} /> : <Edit3 size={14} />}
            {journeyEditMode ? '表示' : '編集'}
          </button>
          {journeyEditMode && (
            <button onClick={saveJourney} disabled={saving} className="btn btn-primary btn-small">
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* 5フェーズのカード */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {PHASES.map((phase, index) => {
          const phaseData = data[index] || { phase: phase.name, psychology: '', touchpoint: '', content: '', emotion: '' };
          const Icon = phase.icon;

          return (
            <div
              key={phase.name}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: `2px solid ${phase.borderColor}`,
                overflow: 'hidden',
              }}
            >
              {/* フェーズヘッダー */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: phase.bgColor,
                  borderBottom: `1px solid ${phase.borderColor}`,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: phase.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '15px' }}>
                    {index + 1}. {phase.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#607D8B' }}>
                    {phase.description}
                  </div>
                </div>
              </div>

              {/* フェーズ内容 */}
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* 顧客心理 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '6px' }}>
                    顧客心理
                  </label>
                  {journeyEditMode ? (
                    <textarea
                      value={phaseData.psychology}
                      onChange={(e) => updateEditJourneyPhase(index, 'psychology', e.target.value)}
                      placeholder="この段階での顧客の気持ち・考え"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        fontSize: '13px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#37474f', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                      {phaseData.psychology || <span style={{ color: '#9e9e9e' }}>未設定</span>}
                    </div>
                  )}
                </div>

                {/* タッチポイント */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '6px' }}>
                    タッチポイント（接点）
                  </label>
                  {journeyEditMode ? (
                    <textarea
                      value={phaseData.touchpoint}
                      onChange={(e) => updateEditJourneyPhase(index, 'touchpoint', e.target.value)}
                      placeholder="顧客との接点（SNS、広告、セミナー等）"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        fontSize: '13px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#37474f', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                      {phaseData.touchpoint || <span style={{ color: '#9e9e9e' }}>未設定</span>}
                    </div>
                  )}
                </div>

                {/* コンテンツ・施策 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '6px' }}>
                    コンテンツ・施策
                  </label>
                  {journeyEditMode ? (
                    <textarea
                      value={phaseData.content}
                      onChange={(e) => updateEditJourneyPhase(index, 'content', e.target.value)}
                      placeholder="提供するコンテンツや施策"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        fontSize: '13px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#37474f', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                      {phaseData.content || <span style={{ color: '#9e9e9e' }}>未設定</span>}
                    </div>
                  )}
                </div>

                {/* 感情・体験 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '6px' }}>
                    顧客に与えたい感情・体験
                  </label>
                  {journeyEditMode ? (
                    <textarea
                      value={phaseData.emotion}
                      onChange={(e) => updateEditJourneyPhase(index, 'emotion', e.target.value)}
                      placeholder="この段階で顧客に感じてほしいこと"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        fontSize: '13px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#37474f', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                      {phaseData.emotion || <span style={{ color: '#9e9e9e' }}>未設定</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ヒント */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--primary-alpha-08)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--primary-dark)',
          lineHeight: 1.6,
        }}
      >
        💡 各フェーズで「顧客は何を考え、どこで接点を持ち、何を提供し、どう感じてもらうか」を整理すると、
        効果的なマーケティング施策が見えてきます。
      </div>
    </div>
  );
}
