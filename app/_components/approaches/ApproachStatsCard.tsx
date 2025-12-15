/**
 * app/_components/approaches/ApproachStatsCard.tsx
 *
 * Phase 8: アプローチ統計カード
 */

'use client';

import {
  Phone,
  Mail,
  Users,
  MapPin,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import type { ApproachStats } from '@/lib/types/approach';
import {
  APPROACH_TYPE_LABELS,
  APPROACH_TYPE_COLORS,
} from '@/lib/types/approach';

interface ApproachStatsCardProps {
  stats: ApproachStats;
}

export function ApproachStatsCard({ stats }: ApproachStatsCardProps) {
  const IconMap = {
    call: Phone,
    email: Mail,
    meeting: Users,
    visit: MapPin,
    other: Target,
  };

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
        <TrendingUp size={20} />
        アプローチ統計
      </h3>

      {/* サマリー */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-gray)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            総件数
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#E3F2FD',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1976D2' }}>
            {stats.thisWeek}
          </div>
          <div style={{ fontSize: '12px', color: '#1976D2' }}>今週</div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#E8F5E9',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#388E3C' }}>
            {stats.thisMonth}
          </div>
          <div style={{ fontSize: '12px', color: '#388E3C' }}>今月</div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#FFF3E0',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F57C00' }}>
            {stats.successRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#F57C00' }}>成功率</div>
        </div>
      </div>

      {/* タイプ別 */}
      <div style={{ marginBottom: '16px' }}>
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
          <Calendar size={14} />
          タイプ別件数
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(stats.byType).map(([type, count]) => {
            const Icon = IconMap[type as keyof typeof IconMap];
            const color =
              APPROACH_TYPE_COLORS[type as keyof typeof APPROACH_TYPE_COLORS];
            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: color + '15',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}
              >
                <Icon size={14} color={color} />
                <span>
                  {
                    APPROACH_TYPE_LABELS[
                      type as keyof typeof APPROACH_TYPE_LABELS
                    ]
                  }
                </span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 結果別バー */}
      {stats.total > 0 && (
        <div>
          <h4
            style={{
              fontSize: '14px',
              color: 'var(--text-light)',
              marginBottom: '8px',
            }}
          >
            結果内訳
          </h4>
          <div
            style={{
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {stats.byResult.success > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.success / stats.total) * 100}%`,
                  background: '#4CAF50',
                }}
                title={`成功: ${stats.byResult.success}`}
              />
            )}
            {stats.byResult.pending > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.pending / stats.total) * 100}%`,
                  background: '#FF9800',
                }}
                title={`保留: ${stats.byResult.pending}`}
              />
            )}
            {stats.byResult.no_answer > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.no_answer / stats.total) * 100}%`,
                  background: '#9E9E9E',
                }}
                title={`不在: ${stats.byResult.no_answer}`}
              />
            )}
            {stats.byResult.rejected > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.rejected / stats.total) * 100}%`,
                  background: '#F44336',
                }}
                title={`断り: ${stats.byResult.rejected}`}
              />
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#4CAF50' }}>
              成功 {stats.byResult.success}
            </span>
            <span style={{ color: '#FF9800' }}>
              保留 {stats.byResult.pending}
            </span>
            <span style={{ color: '#9E9E9E' }}>
              不在 {stats.byResult.no_answer}
            </span>
            <span style={{ color: '#F44336' }}>
              断り {stats.byResult.rejected}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
