/**
 * app/_components/lean-canvas/CustomerJourney.tsx
 *
 * Phase 16: カスタマージャーニー可視化
 */

'use client';

import { ArrowRight, Users, Lightbulb, Gift, Megaphone, DollarSign } from 'lucide-react';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { GlassCard } from '../brand/GlassCard';

export function CustomerJourney() {
  const { currentCanvas, getBlockContent } = useLeanCanvas();

  if (!currentCanvas) return null;

  const problem = getBlockContent('problem');
  const solution = getBlockContent('solution');
  const uniqueValue = getBlockContent('unique_value');
  const channels = getBlockContent('channels');
  const revenue = getBlockContent('revenue_streams');

  const stages = [
    {
      icon: Users,
      label: '認知',
      description: '顧客が課題を認識',
      content: problem?.items?.[0] || problem?.content?.split('\n')[0] || '課題を設定してください',
      color: '#ef4444',
    },
    {
      icon: Megaphone,
      label: '興味',
      description: 'チャネル経由で発見',
      content: channels?.items?.[0] || channels?.content?.split('\n')[0] || 'チャネルを設定してください',
      color: '#f59e0b',
    },
    {
      icon: Lightbulb,
      label: '検討',
      description: '価値提案を理解',
      content: uniqueValue?.content?.split('\n')[0] || '価値提案を設定してください',
      color: '#8b5cf6',
    },
    {
      icon: Gift,
      label: '体験',
      description: 'ソリューションを利用',
      content: solution?.items?.[0] || solution?.content?.split('\n')[0] || 'ソリューションを設定してください',
      color: '#22c55e',
    },
    {
      icon: DollarSign,
      label: '購入',
      description: '収益化',
      content: revenue?.items?.[0] || revenue?.content?.split('\n')[0] || '収益モデルを設定してください',
      color: '#06b6d4',
    },
  ];

  return (
    <GlassCard style={{ marginTop: '24px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: 'white' }}>
        カスタマージャーニー
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {stages.map((stage, index) => (
          <div key={stage.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                minWidth: '160px',
                padding: '16px',
                background: `${stage.color}15`,
                border: `1px solid ${stage.color}40`,
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${stage.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <stage.icon size={20} color={stage.color} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                {stage.label}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                {stage.description}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stage.content}
              </div>
            </div>
            {index < stages.length - 1 && (
              <ArrowRight
                size={20}
                color="rgba(255, 255, 255, 0.3)"
                style={{ margin: '0 4px', flexShrink: 0 }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
        ※ 各ブロックの内容から自動生成されます。ブロックを編集すると反映されます。
      </div>
    </GlassCard>
  );
}
