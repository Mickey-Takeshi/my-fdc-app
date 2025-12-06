'use client';

import { memo } from 'react';
import { Eye, Edit3, Heart, MapPin, FileText, Target } from 'lucide-react';
import type { LeanCanvasViewModel, CustomerJourneyPhase } from './types';

interface CustomerJourneySectionProps {
  vm: LeanCanvasViewModel;
}

const phaseColors = [
  { bg: 'var(--primary-alpha-25)', border: 'var(--primary)', text: 'var(--primary-dark)' },
  { bg: 'var(--primary-alpha-20)', border: 'var(--primary-alpha-85)', text: 'var(--primary-dark)' },
  { bg: 'var(--primary-alpha-20)', border: 'var(--primary-alpha-80)', text: 'var(--primary-dark)' },
  { bg: 'var(--primary-alpha-15)', border: 'var(--primary-alpha-70)', text: 'var(--primary-dark)' },
  { bg: 'var(--primary-alpha-12)', border: 'var(--primary-alpha-60)', text: 'var(--primary-dark)' },
  { bg: 'var(--primary-alpha-10)', border: 'var(--primary-alpha-50)', text: 'var(--primary-dark)' },
];

export const CustomerJourneySection = memo(function CustomerJourneySection({ vm }: CustomerJourneySectionProps) {
  const {
    customerJourney,
    editJourney,
    journeyEditMode,
    saving,
    toggleJourneyEditMode,
    updateEditJourneyPhase,
    saveJourney,
  } = vm;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-dark)' }}>
          カスタマージャーニー
        </h3>
        <button
          onClick={toggleJourneyEditMode}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {journeyEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
          {journeyEditMode ? '表示モード' : '編集モード'}
        </button>
      </div>

      {customerJourney.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'linear-gradient(135deg, var(--primary-alpha-05) 0%, var(--primary-alpha-10) 100%)',
          borderRadius: '12px',
          border: '2px dashed var(--primary-alpha-30)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }}>🌊</div>
          <p style={{ color: 'var(--text-light)' }}>カスタマージャーニーが設定されていません</p>
        </div>
      ) : journeyEditMode ? (
        <div>
          {editJourney.map((phase, index) => {
            const colors = phaseColors[index] || phaseColors[0];
            return (
              <JourneyPhaseEditCard
                key={index}
                phase={phase}
                index={index}
                colors={colors}
                onUpdate={updateEditJourneyPhase}
              />
            );
          })}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={saveJourney} disabled={saving} className="btn btn-primary">
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={toggleJourneyEditMode} disabled={saving} className="btn btn-secondary">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          {customerJourney.map((phase, index) => {
            const colors = phaseColors[index] || phaseColors[0];
            return (
              <JourneyPhaseDisplayCard key={index} phase={phase} index={index} colors={colors} />
            );
          })}
        </div>
      )}
    </div>
  );
});

function JourneyPhaseEditCard({
  phase,
  index,
  colors,
  onUpdate,
}: {
  phase: CustomerJourneyPhase;
  index: number;
  colors: { bg: string; border: string; text: string };
  onUpdate: (index: number, field: keyof CustomerJourneyPhase, value: string) => void;
}) {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '20px',
      borderRadius: '8px',
      borderLeft: `4px solid ${colors.border}`,
      background: 'white',
    }}>
      <h4 style={{ color: colors.text, marginBottom: '15px', fontSize: '16px' }}>
        {index + 1}. {phase.phase}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px', color: 'var(--primary-dark)', fontSize: '13px' }}>
            <Heart size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            心理状態
          </label>
          <textarea
            value={phase.psychology}
            onChange={(e) => onUpdate(index, 'psychology', e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px', color: 'var(--primary-dark)', fontSize: '13px' }}>
            <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            タッチポイント
          </label>
          <textarea
            value={phase.touchpoint}
            onChange={(e) => onUpdate(index, 'touchpoint', e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px', color: 'var(--primary-dark)', fontSize: '13px' }}>
            <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            コンテンツ
          </label>
          <textarea
            value={phase.content}
            onChange={(e) => onUpdate(index, 'content', e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px', color: 'var(--primary-dark)', fontSize: '13px' }}>
            感情
          </label>
          <input
            type="text"
            value={phase.emotion}
            onChange={(e) => onUpdate(index, 'emotion', e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px', color: 'var(--primary-dark)', fontSize: '13px' }}>
            <Target size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            プロンプト
          </label>
          <textarea
            value={phase.prompt || ''}
            onChange={(e) => onUpdate(index, 'prompt', e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', resize: 'vertical', background: '#f0f9fa', boxSizing: 'border-box' }}
          />
        </div>
      </div>
    </div>
  );
}

function JourneyPhaseDisplayCard({
  phase,
  index,
  colors,
}: {
  phase: CustomerJourneyPhase;
  index: number;
  colors: { bg: string; border: string; text: string };
}) {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '25px',
      borderRadius: '8px',
      borderLeft: `5px solid ${colors.border}`,
      background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.7) 100%)`,
      boxShadow: '0 2px 8px var(--primary-alpha-10)',
    }}>
      <h4 style={{ color: colors.text, marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>
        {index + 1}. {phase.phase}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <JourneyField label="感情" value={phase.emotion} borderColor={colors.border} />
        <JourneyField label="心理状態" value={phase.psychology} borderColor={colors.border} />
        <JourneyField label="タッチポイント" value={phase.touchpoint} borderColor={colors.border} />
        <JourneyField label="コンテンツ" value={phase.content} borderColor={colors.border} />
      </div>
    </div>
  );
}

function JourneyField({ label, value, borderColor }: { label: string; value: string; borderColor: string }) {
  return (
    <div style={{
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      borderLeft: `3px solid ${borderColor}`,
    }}>
      <h5 style={{ color: 'var(--primary-dark)', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
        {label}
      </h5>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#546e7a', margin: 0 }}>
        {value || '未設定'}
      </p>
    </div>
  );
}
