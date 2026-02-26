/**
 * app/_components/action-maps/ActionMapCard.tsx
 *
 * Phase 10: ActionMapカードコンポーネント
 */

'use client';

import type { ActionMap } from '@/lib/types/action-map';

interface ActionMapCardProps {
  map: ActionMap;
  onSelect: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function ActionMapCard({ map, onSelect, onArchive }: ActionMapCardProps) {
  const progressRate = map.progressRate ?? 0;
  const itemCount = map.itemCount ?? 0;
  const completedItemCount = map.completedItemCount ?? 0;

  return (
    <div
      className="action-map-card"
      onClick={() => onSelect(map.id)}
      style={{
        padding: '16px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: 'var(--card-bg)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {map.title}
        </h3>
        {map.isArchived && (
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '4px',
              color: 'var(--text-light)',
            }}
          >
            アーカイブ
          </span>
        )}
      </div>

      {map.description && (
        <p
          style={{
            margin: '8px 0',
            fontSize: '14px',
            color: 'var(--text-light)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {map.description}
        </p>
      )}

      {/* 進捗バー */}
      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--text-light)' }}>
            {completedItemCount} / {itemCount} 完了
          </span>
          <span style={{ fontWeight: 600 }}>{progressRate}%</span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressRate}%`,
              backgroundColor: progressRate === 100 ? 'var(--success)' : 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 期間表示 */}
      {(map.targetPeriodStart || map.targetPeriodEnd) && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-light)',
          }}
        >
          {map.targetPeriodStart && map.targetPeriodEnd
            ? `${map.targetPeriodStart} 〜 ${map.targetPeriodEnd}`
            : map.targetPeriodStart
            ? `${map.targetPeriodStart} 〜`
            : `〜 ${map.targetPeriodEnd}`}
        </div>
      )}

      {/* アーカイブボタン */}
      {onArchive && !map.isArchived && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(map.id);
          }}
          style={{
            marginTop: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: 'var(--text-light)',
            cursor: 'pointer',
          }}
        >
          アーカイブ
        </button>
      )}
    </div>
  );
}
