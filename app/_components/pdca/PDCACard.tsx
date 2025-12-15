/**
 * app/_components/pdca/PDCACard.tsx
 *
 * Phase 8: PDCA分析カード
 */

'use client';

import { useState } from 'react';
import { Target, TrendingUp, CheckCircle, Edit3, Plus } from 'lucide-react';
import type { PDCAAnalysis, PeriodType, CreateApproachGoalInput } from '@/lib/types/pdca';

interface PDCACardProps {
  analysis: PDCAAnalysis;
  onCreateGoal: (input: CreateApproachGoalInput) => Promise<unknown>;
  onUpdateGoal: (id: string, input: { targetCount?: number; targetSuccessRate?: number | null; improvementNote?: string | null }) => Promise<unknown>;
}

export function PDCACard({ analysis, onCreateGoal, onUpdateGoal }: PDCACardProps) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showImprovementForm, setShowImprovementForm] = useState(false);
  const [targetCount, setTargetCount] = useState(analysis.goal?.targetCount?.toString() || '10');
  const [targetSuccessRate, setTargetSuccessRate] = useState(
    analysis.goal?.targetSuccessRate?.toString() || ''
  );
  const [improvementNote, setImprovementNote] = useState(
    analysis.goal?.improvementNote || ''
  );
  const [saving, setSaving] = useState(false);

  const { goal, actual, achievement, period } = analysis;

  // 達成率に応じた色
  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return '#4CAF50';
    if (rate >= 70) return '#FF9800';
    return '#F44336';
  };

  // 目標を保存
  const handleSaveGoal = async () => {
    setSaving(true);
    try {
      const count = parseInt(targetCount) || 0;
      const rate = targetSuccessRate ? parseFloat(targetSuccessRate) : null;

      if (goal) {
        await onUpdateGoal(goal.id, {
          targetCount: count,
          targetSuccessRate: rate,
        });
      } else {
        await onCreateGoal({
          periodType: period.type as PeriodType,
          periodStart: period.start,
          periodEnd: period.end,
          targetCount: count,
          targetSuccessRate: rate ?? undefined,
        });
      }
      setShowGoalForm(false);
    } catch (err) {
      console.error('Error saving goal:', err);
    } finally {
      setSaving(false);
    }
  };

  // 改善メモを保存
  const handleSaveImprovement = async () => {
    if (!goal) return;

    setSaving(true);
    try {
      await onUpdateGoal(goal.id, {
        improvementNote: improvementNote || null,
      });
      setShowImprovementForm(false);
    } catch (err) {
      console.error('Error saving improvement:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {period.label}のPDCA
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-light)',
            background: '#f5f5f5',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {period.type === 'weekly' ? '週次' : '月次'}
        </span>
      </div>

      {/* PDCA グリッド */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        {/* Plan: 目標 */}
        <div
          style={{
            background: '#E3F2FD',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Target size={18} color="#1976D2" />
            <span style={{ fontWeight: 600, color: '#1976D2' }}>Plan</span>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {goal ? <Edit3 size={14} color="#1976D2" /> : <Plus size={14} color="#1976D2" />}
            </button>
          </div>

          {showGoalForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>目標件数</label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>目標成功率 (%)</label>
                <input
                  type="number"
                  value={targetSuccessRate}
                  onChange={(e) => setTargetSuccessRate(e.target.value)}
                  placeholder="任意"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <button
                onClick={handleSaveGoal}
                disabled={saving}
                className="btn btn-primary btn-small"
                style={{ marginTop: '4px' }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          ) : goal ? (
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1976D2' }}>
                {goal.targetCount}件
              </div>
              {goal.targetSuccessRate != null && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  成功率目標: {goal.targetSuccessRate}%
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              目標を設定してください
            </div>
          )}
        </div>

        {/* Do: 実績 */}
        <div
          style={{
            background: '#E8F5E9',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <TrendingUp size={18} color="#388E3C" />
            <span style={{ fontWeight: 600, color: '#388E3C' }}>Do</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#388E3C' }}>
            {actual.count}件
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            成功: {actual.successCount}件 ({actual.successRate}%)
          </div>
        </div>

        {/* Check: 達成率 */}
        <div
          style={{
            background: '#FFF3E0',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <CheckCircle size={18} color="#F57C00" />
            <span style={{ fontWeight: 600, color: '#F57C00' }}>Check</span>
          </div>
          {goal ? (
            <>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: getAchievementColor(achievement.countRate),
                }}
              >
                {achievement.countRate}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                目標達成率
              </div>
              {achievement.successRateGap != null && (
                <div
                  style={{
                    fontSize: '12px',
                    color: achievement.successRateGap >= 0 ? '#4CAF50' : '#F44336',
                    marginTop: '4px',
                  }}
                >
                  成功率: {achievement.successRateGap >= 0 ? '+' : ''}{achievement.successRateGap}%
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              目標設定後に表示
            </div>
          )}
        </div>

        {/* Act: 改善 */}
        <div
          style={{
            background: '#F3E5F5',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Edit3 size={18} color="#7B1FA2" />
            <span style={{ fontWeight: 600, color: '#7B1FA2' }}>Act</span>
            {goal && (
              <button
                onClick={() => setShowImprovementForm(!showImprovementForm)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <Edit3 size={14} color="#7B1FA2" />
              </button>
            )}
          </div>

          {showImprovementForm && goal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={improvementNote}
                onChange={(e) => setImprovementNote(e.target.value)}
                placeholder="改善点・次回への課題..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleSaveImprovement}
                disabled={saving}
                className="btn btn-primary btn-small"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          ) : goal?.improvementNote ? (
            <div style={{ fontSize: '14px', color: '#666', whiteSpace: 'pre-wrap' }}>
              {goal.improvementNote}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              {goal ? '改善点を記録してください' : '目標設定後に記録可能'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
