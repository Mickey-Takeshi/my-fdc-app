/**
 * app/_components/approaches/ApproachTimeline.tsx
 *
 * Phase 8: アプローチタイムライン
 */

'use client';

import { Phone, Mail, Users, MapPin, MessageSquare } from 'lucide-react';
import type { Approach } from '@/lib/types/approach';
import {
  APPROACH_TYPE_LABELS,
  APPROACH_TYPE_COLORS,
  APPROACH_RESULT_LABELS,
  APPROACH_RESULT_COLORS,
} from '@/lib/types/approach';

interface ApproachTimelineProps {
  approaches: Approach[];
  onDelete?: (id: string) => void;
}

const IconMap = {
  call: Phone,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  other: MessageSquare,
};

export function ApproachTimeline({
  approaches,
  onDelete,
}: ApproachTimelineProps) {
  if (approaches.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-light)',
        }}
      >
        アプローチ履歴がありません
      </div>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* タイムラインの線 */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'var(--border)',
        }}
      />

      {approaches.map((approach, index) => {
        const Icon = IconMap[approach.type];
        const color = APPROACH_TYPE_COLORS[approach.type];

        return (
          <div
            key={approach.id}
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: index < approaches.length - 1 ? '20px' : 0,
              position: 'relative',
            }}
          >
            {/* アイコン */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: color + '20',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              <Icon size={18} color={color} />
            </div>

            {/* コンテンツ */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, marginRight: '8px' }}>
                    {APPROACH_TYPE_LABELS[approach.type]}
                  </span>
                  {approach.result && (
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          APPROACH_RESULT_COLORS[approach.result] + '20',
                        color: APPROACH_RESULT_COLORS[approach.result],
                      }}
                    >
                      {APPROACH_RESULT_LABELS[approach.result]}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  {formatDate(approach.approachedAt)}
                </span>
              </div>

              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text)',
                  background: 'var(--bg-gray)',
                  padding: '10px',
                  borderRadius: '8px',
                }}
              >
                {approach.content}
                {approach.resultNote && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text-light)',
                    }}
                  >
                    結果メモ: {approach.resultNote}
                  </div>
                )}
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(approach.id)}
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-light)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
