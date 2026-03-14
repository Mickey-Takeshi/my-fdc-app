'use client';

/**
 * app/(app)/leads/_components/ApproachStatsSection.tsx
 *
 * アプローチ統計セクション（Phase 8）
 * ワークスペース全体のアプローチ統計を表示
 */

import { Phone, Mail, Users as MeetingIcon, MapPin, MoreHorizontal } from 'lucide-react';
import {
  APPROACH_TYPE_LABELS,
  type Approach,
  type ApproachType,
  type ApproachStats,
} from '@/lib/types/approach';

const TYPE_ICONS: Record<ApproachType, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: MeetingIcon,
  visit: MapPin,
  other: MoreHorizontal,
};

interface ApproachStatsSectionProps {
  approaches: Approach[];
}

function calculateStats(approaches: Approach[]): ApproachStats {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = now.getDay();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  thisWeekStart.setHours(0, 0, 0, 0);

  const byType: Record<ApproachType, number> = {
    call: 0,
    email: 0,
    meeting: 0,
    visit: 0,
    other: 0,
  };

  let thisMonth = 0;
  let thisWeek = 0;

  for (const a of approaches) {
    byType[a.type] = (byType[a.type] || 0) + 1;

    const date = new Date(a.approachedAt);
    if (date >= thisMonthStart) thisMonth++;
    if (date >= thisWeekStart) thisWeek++;
  }

  return {
    total: approaches.length,
    thisMonth,
    thisWeek,
    byType,
  };
}

export default function ApproachStatsSection({ approaches }: ApproachStatsSectionProps) {
  const stats = calculateStats(approaches);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
        アプローチ統計
      </h3>

      {/* 期間統計 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: 'var(--primary-alpha-05)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--primary)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            全期間
          </div>
        </div>
        <div style={{
          background: 'var(--primary-alpha-05)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--primary)' }}>
            {stats.thisMonth}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            今月
          </div>
        </div>
        <div style={{
          background: 'var(--primary-alpha-05)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--primary)' }}>
            {stats.thisWeek}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            今週
          </div>
        </div>
      </div>

      {/* タイプ別統計 */}
      <div style={{ fontSize: '13px' }}>
        <div style={{
          fontWeight: 600,
          marginBottom: '8px',
          color: 'var(--text-dark)',
        }}>
          タイプ別
        </div>
        {Object.entries(stats.byType).map(([typeKey, count]) => {
          const Icon = TYPE_ICONS[typeKey as ApproachType];
          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div
              key={typeKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 0',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <Icon size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                {APPROACH_TYPE_LABELS[typeKey as ApproachType]}
              </span>
              <div style={{
                flex: 2,
                height: '6px',
                background: 'var(--bg-gray)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: '3px',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{
                fontWeight: 600,
                minWidth: '40px',
                textAlign: 'right',
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
