/**
 * app/_components/okr/ObjectiveCard.tsx
 *
 * Phase 11: Objectiveカードコンポーネント
 */

'use client';

import type { Objective } from '@/lib/types/okr';

interface ObjectiveCardProps {
  objective: Objective;
  onSelect: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function ObjectiveCard({ objective, onSelect, onArchive }: ObjectiveCardProps) {
  const progress = objective.progress ?? 0;
  const krCount = objective.keyResultCount ?? 0;
  const completedKRCount = objective.completedKeyResultCount ?? 0;

  return (
    <div
      onClick={() => onSelect(objective.id)}
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
        <div>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'inline-block',
            }}
          >
            {objective.period}
          </span>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 600 }}>
            {objective.title}
          </h3>
        </div>
        {objective.isArchived && (
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

      {objective.description && (
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
          {objective.description}
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
            KR: {completedKRCount} / {krCount} 達成
          </span>
          <span style={{ fontWeight: 600 }}>{progress}%</span>
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
              width: `${progress}%`,
              backgroundColor: progress >= 70 ? 'var(--success)' : progress >= 30 ? 'var(--warning)' : 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* アーカイブボタン */}
      {onArchive && !objective.isArchived && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(objective.id);
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
