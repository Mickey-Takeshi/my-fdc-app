/**
 * app/_components/okr/ObjectiveList.tsx
 *
 * Phase 12: Objective 一覧（左サイドバー）
 * ActionMapList と同じスタイル
 */

'use client';

import type { Objective, ObjectiveScope, ObjectiveId } from '@/lib/types/okr';
import { Plus, Archive } from 'lucide-react';
import styles from './ObjectiveList.module.css';

const SCOPE_LABELS: Record<ObjectiveScope, string> = {
  company: '会社',
  team: 'チーム',
  individual: '個人',
};

interface ObjectiveListProps {
  objectives: Objective[];
  selectedObjectiveId: ObjectiveId | null;
  showArchived: boolean;
  canCreate: boolean;
  onSelect: (objectiveId: ObjectiveId | null) => void;
  onCreate: () => void;
  onToggleArchived: () => void;
}

export function ObjectiveList({
  objectives,
  selectedObjectiveId,
  showArchived,
  canCreate,
  onSelect,
  onCreate,
  onToggleArchived,
}: ObjectiveListProps) {
  const formatPeriod = (start?: string, end?: string) => {
    if (!start && !end) return '';
    const s = start ? start.slice(0, 7) : '?';
    const e = end ? end.slice(0, 7) : '?';
    return `${s} ~ ${e}`;
  };

  const getProgressColor = (rate?: number) => {
    if (rate === undefined || rate === 0) return 'var(--text-secondary, #999)';
    if (rate >= 80) return 'var(--primary)';
    if (rate >= 50) return 'var(--primary-light)';
    return 'var(--text-secondary)';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Objectives</h2>
        {canCreate && (
          <button
            className={styles.addButton}
            onClick={onCreate}
            title="新規作成"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className={styles.list}>
        {objectives.length === 0 ? (
          <div className={styles.empty}>
            <p>Objective がありません</p>
            {canCreate && (
              <button className={styles.createLink} onClick={onCreate}>
                作成する
              </button>
            )}
          </div>
        ) : (
          objectives.map(obj => (
            <button
              key={obj.id}
              className={`${styles.item} ${selectedObjectiveId === obj.id ? styles.selected : ''} ${obj.isArchived ? styles.archived : ''}`}
              onClick={() => onSelect(obj.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{obj.title || '(無題)'}</span>
                {obj.isArchived && (
                  <span className={styles.archivedBadge}>
                    <Archive size={12} />
                  </span>
                )}
              </div>

              <div className={styles.itemMeta}>
                <span className={styles.scopeBadge}>
                  {SCOPE_LABELS[obj.scope]}
                </span>
                <span
                  className={styles.progress}
                  style={{ color: getProgressColor(obj.progressRate) }}
                >
                  {obj.progressRate ?? 0}%
                </span>
              </div>

              <div className={styles.period}>
                {formatPeriod(obj.periodStart, obj.periodEnd)}
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${obj.progressRate ?? 0}%`,
                    backgroundColor: getProgressColor(obj.progressRate),
                  }}
                />
              </div>
            </button>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <label className={styles.archiveToggle}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={onToggleArchived}
          />
          <span>アーカイブを表示</span>
        </label>
      </div>
    </div>
  );
}
