/**
 * app/_components/clients/LostProspectsSection.tsx
 *
 * Phase 7: 失注分析セクション
 */

'use client';

import { useMemo } from 'react';
import { TrendingDown, AlertCircle, Lightbulb, Building2 } from 'lucide-react';
import type { Lead } from '@/lib/types/lead';
import { LOST_REASON_LABELS, LEAD_CHANNEL_LABELS } from '@/lib/types/lead';

interface LostProspectsSectionProps {
  lostLeads: Lead[];
}

export function LostProspectsSection({ lostLeads }: LostProspectsSectionProps) {
  // 失注理由別統計
  const reasonStats = useMemo(() => {
    const stats: Record<string, number> = {};
    lostLeads.forEach((lead) => {
      const reason = lead.lostReason || 'UNKNOWN';
      stats[reason] = (stats[reason] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([reason, count]) => ({
        reason,
        label: LOST_REASON_LABELS[reason as keyof typeof LOST_REASON_LABELS] || '不明',
        count,
        percentage: Math.round((count / lostLeads.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [lostLeads]);

  // チャネル別統計
  const channelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    lostLeads.forEach((lead) => {
      const channel = lead.channel || 'UNKNOWN';
      stats[channel] = (stats[channel] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([channel, count]) => ({
        channel,
        label: LEAD_CHANNEL_LABELS[channel as keyof typeof LEAD_CHANNEL_LABELS] || '不明',
        count,
        percentage: Math.round((count / lostLeads.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [lostLeads]);

  // 改善提案
  const suggestions = useMemo(() => {
    const items: string[] = [];

    if (reasonStats.length > 0) {
      const topReason = reasonStats[0];
      if (topReason.reason === 'PRICE') {
        items.push('価格が主な失注理由です。価値提案の強化や柔軟な料金プランを検討してください。');
      } else if (topReason.reason === 'TIMING') {
        items.push('タイミングの問題が多いです。リードの育成期間を長めに設定し、定期的なフォローアップを心がけてください。');
      } else if (topReason.reason === 'COMPETITOR') {
        items.push('競合への流出が多いです。差別化ポイントを明確にし、競合分析を強化してください。');
      } else if (topReason.reason === 'NO_RESPONSE') {
        items.push('連絡が取れないケースが多いです。複数のコミュニケーションチャネルを活用してください。');
      }
    }

    if (channelStats.length > 0) {
      const worstChannel = channelStats[0];
      if (worstChannel.percentage > 40) {
        items.push(`${worstChannel.label}からのリードの失注率が高いです。チャネル別のアプローチ見直しを検討してください。`);
      }
    }

    if (lostLeads.length > 10) {
      items.push('失注数が蓄積しています。定期的な振り返りミーティングを設定し、パターンを分析してください。');
    }

    return items;
  }, [reasonStats, channelStats, lostLeads.length]);

  if (lostLeads.length === 0) {
    return (
      <div className="card">
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <TrendingDown size={20} />
          失注分析
        </h3>
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>
          失注データがありません
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <TrendingDown size={20} />
        失注分析
        <span
          style={{
            fontSize: '14px',
            fontWeight: 'normal',
            color: 'var(--text-light)',
          }}
        >
          ({lostLeads.length}件)
        </span>
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
        }}
      >
        {/* 失注理由別 */}
        <div>
          <h4
            style={{
              fontSize: '14px',
              color: 'var(--text-light)',
              marginBottom: '12px',
            }}
          >
            失注理由
          </h4>
          {reasonStats.map((stat) => (
            <div
              key={stat.reason}
              style={{
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>{stat.label}</span>
                <span style={{ color: 'var(--text-light)' }}>
                  {stat.count}件 ({stat.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#E0E0E0',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${stat.percentage}%`,
                    height: '100%',
                    background: '#FF5722',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* チャネル別 */}
        <div>
          <h4
            style={{
              fontSize: '14px',
              color: 'var(--text-light)',
              marginBottom: '12px',
            }}
          >
            チャネル別失注
          </h4>
          {channelStats.map((stat) => (
            <div
              key={stat.channel}
              style={{
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>{stat.label}</span>
                <span style={{ color: 'var(--text-light)' }}>
                  {stat.count}件 ({stat.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#E0E0E0',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${stat.percentage}%`,
                    height: '100%',
                    background: '#9E9E9E',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 改善提案 */}
      {suggestions.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#FFF3E0',
            borderRadius: '8px',
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              color: '#E65100',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lightbulb size={16} />
            改善提案
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#BF360C',
            }}
          >
            {suggestions.map((suggestion, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 失注リード一覧 */}
      <div style={{ marginTop: '20px' }}>
        <h4
          style={{
            fontSize: '14px',
            color: 'var(--text-light)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={16} />
          失注リード一覧
        </h4>
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {lostLeads.map((lead) => (
            <div
              key={lead.id}
              style={{
                padding: '10px',
                background: 'var(--bg-gray)',
                borderRadius: '6px',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: 500 }}>{lead.contactPerson}</span>
                <span style={{ color: 'var(--text-light)' }}>
                  {LOST_REASON_LABELS[lead.lostReason as keyof typeof LOST_REASON_LABELS] || '-'}
                </span>
              </div>
              {lead.companyName && (
                <div
                  style={{
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Building2 size={12} /> {lead.companyName}
                </div>
              )}
              {lead.lostFeedback && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '6px',
                    background: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text-light)',
                  }}
                >
                  {lead.lostFeedback}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
