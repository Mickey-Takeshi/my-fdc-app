/**
 * app/_components/action-map/ActionMapList.tsx
 *
 * Phase 11: Action Map 一覧（左サイドバー）
 */

'use client';

import type { ActionMap } from '@/lib/types/action-map';
import { Archive } from 'lucide-react';
import styles from './ActionMapList.module.css';

interface ActionMapListProps {
  maps: ActionMap[];
  selectedMapId: string | null;
  showArchived: boolean;
  canCreate: boolean;
  onSelect: (mapId: string | null) => void;
  onCreate: () => void;
  onToggleArchived: () => void;
}

export function ActionMapList({
  maps,
  selectedMapId,
  showArchived,
  canCreate,
  onSelect,
  onCreate,
  onToggleArchived,
}: ActionMapListProps) {
  const formatPeriod = (start?: string, end?: string) => {
    if (!start && !end) return '';
    const s = start ? start.slice(0, 7) : '?';
    const e = end ? end.slice(0, 7) : '?';
    return `${s} ~ ${e}`;
  };

  const getProgressColor = (rate?: number) => {
    if (rate === undefined || rate === 0) return 'var(--text-secondary, #999)';
    if (rate >= 80) return 'var(--success-color, #4caf50)';
    if (rate >= 50) return 'var(--warning-color, #ff9800)';
    return 'var(--error-color, #f44336)';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Action Map</h2>
        {canCreate && (
          <button
            className={styles.addButton}
            onClick={onCreate}
            title="新規作成"
          >
            +
          </button>
        )}
      </div>

      <div className={styles.list}>
        {maps.length === 0 ? (
          <div className={styles.empty}>
            <p>Action Map がありません</p>
            {canCreate && (
              <button className={styles.createLink} onClick={onCreate}>
                作成する
              </button>
            )}
          </div>
        ) : (
          maps.map(map => (
            <button
              key={map.id}
              className={`${styles.item} ${selectedMapId === map.id ? styles.selected : ''} ${map.isArchived ? styles.archived : ''}`}
              onClick={() => onSelect(map.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{map.title || '(無題)'}</span>
                {map.isArchived && <span className={styles.archivedBadge}><Archive size={12} /></span>}
              </div>

              <div className={styles.itemMeta}>
                <span
                  className={styles.progress}
                  style={{ color: getProgressColor(map.progressRate) }}
                >
                  {map.progressRate ?? 0}%
                </span>
                <span className={styles.period}>
                  {formatPeriod(map.targetPeriodStart, map.targetPeriodEnd)}
                </span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${map.progressRate ?? 0}%`,
                    backgroundColor: getProgressColor(map.progressRate),
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
