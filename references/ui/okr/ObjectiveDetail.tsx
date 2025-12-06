/**
 * app/_components/okr/ObjectiveDetail.tsx
 *
 * Phase 12: Objective 詳細表示（右カラム）
 * ActionMapDetail と同じスタイル
 */

'use client';

import { useState } from 'react';
import type { Objective, KeyResult, ObjectiveScope, KRCalcMethod } from '@/lib/types/okr';
import type { ActionMap, ActionItem } from '@/lib/types/action-map';
import {
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Plus,
  Link,
  Key,
  CheckCircle2,
  Square,
  Map,
  ChevronDown,
  ChevronRight,
  Circle,
} from 'lucide-react';
import styles from './ObjectiveDetail.module.css';

// アイテムのステータス色
const STATUS_COLORS: Record<string, string> = {
  not_started: '#9E9E9E',
  in_progress: 'var(--primary)',
  blocked: '#F44336',
  done: 'var(--primary-dark)',
};

const SCOPE_LABELS: Record<ObjectiveScope, string> = {
  company: '会社',
  team: 'チーム',
  individual: '個人',
};

const CALC_METHOD_LABELS: Record<KRCalcMethod, string> = {
  manual: '手動',
  fromActionMaps: 'AM連動',
};

interface ObjectiveDetailProps {
  objective: Objective;
  keyResults: KeyResult[];
  actionMaps: ActionMap[];
  canManage: boolean;
  canEdit: boolean;
  saving: boolean;
  onEditObjective: () => void;
  onArchiveObjective: () => void;
  onDeleteObjective: () => void;
  onCreateKR: () => void;
  onEditKR: (kr: KeyResult) => void;
  onDeleteKR: (krId: string) => void;
  onToggleKRAchieved: (kr: KeyResult) => void;
  onOpenActionMapLink: (kr: KeyResult) => void;
  getLinkedActionMaps: (kr: KeyResult) => ActionMap[];
  getActionItemsForMap: (actionMapId: string) => ActionItem[];
}

export function ObjectiveDetail({
  objective,
  keyResults,
  canManage,
  canEdit,
  saving,
  onEditObjective,
  onArchiveObjective,
  onDeleteObjective,
  onCreateKR,
  onEditKR,
  onDeleteKR,
  onToggleKRAchieved,
  onOpenActionMapLink,
  getLinkedActionMaps,
  getActionItemsForMap,
}: ObjectiveDetailProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  const getProgressColor = (rate?: number) => {
    if (rate === undefined || rate === 0) return 'var(--text-secondary)';
    if (rate >= 80) return 'var(--primary)';
    if (rate >= 50) return 'var(--primary-light)';
    return 'var(--text-secondary)';
  };

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>
            {objective.title || '(無題)'}
            {objective.isArchived && (
              <span className={styles.archivedBadge}>
                <Archive size={16} /> アーカイブ
              </span>
            )}
          </h1>

          {canEdit && (
            <div className={styles.actions}>
              <button className={styles.actionButton} onClick={onEditObjective} title="編集">
                <Pencil size={16} />
              </button>
              {objective.isArchived ? (
                <button className={styles.actionButton} onClick={onArchiveObjective} title="アーカイブ解除">
                  <ArchiveRestore size={16} />
                </button>
              ) : (
                <button className={styles.actionButton} onClick={onArchiveObjective} title="アーカイブ">
                  <Archive size={16} />
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => {
                  if (confirm('この Objective を削除しますか？配下の Key Results もすべて削除されます。')) {
                    onDeleteObjective();
                  }
                }}
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>スコープ</span>
            <span className={styles.scopeBadge}>{SCOPE_LABELS[objective.scope]}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>期間</span>
            <span className={styles.metaValue}>
              {formatDate(objective.periodStart)} ~ {formatDate(objective.periodEnd)}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>進捗</span>
            <span
              className={styles.metaValue}
              style={{ color: getProgressColor(objective.progressRate) }}
            >
              {objective.progressRate ?? 0}%
            </span>
          </div>
        </div>

        {objective.description && (
          <p className={styles.description}>{objective.description}</p>
        )}

        {/* 進捗バー */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${objective.progressRate ?? 0}%`,
                backgroundColor: getProgressColor(objective.progressRate),
              }}
            />
          </div>
        </div>
      </header>

      {/* ツールバー */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.krCount}>
            <Key size={16} />
            Key Results ({keyResults.length})
          </span>
          {canManage && (
            <button
              className={styles.addKRButton}
              onClick={onCreateKR}
              disabled={saving}
            >
              <Plus size={16} />
              KR追加
            </button>
          )}
        </div>
      </div>

      {/* Key Results */}
      <div className={styles.content}>
        {keyResults.length === 0 ? (
          <div className={styles.emptyKR}>
            <Key size={48} className={styles.emptyIcon} />
            <p>Key Result がありません</p>
            {canManage && (
              <button
                className={styles.createKRButton}
                onClick={onCreateKR}
              >
                <Plus size={16} />
                最初の Key Result を作成
              </button>
            )}
          </div>
        ) : (
          <div className={styles.krList}>
            {keyResults.map(kr => (
              <KeyResultCard
                key={kr.id}
                kr={kr}
                canManage={canManage}
                onEdit={() => onEditKR(kr)}
                onDelete={() => onDeleteKR(kr.id)}
                onToggleAchieved={() => onToggleKRAchieved(kr)}
                onOpenActionMapLink={() => onOpenActionMapLink(kr)}
                linkedActionMaps={getLinkedActionMaps(kr)}
                getActionItemsForMap={getActionItemsForMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Key Result カード
// ========================================

interface KeyResultCardProps {
  kr: KeyResult;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAchieved: () => void;
  onOpenActionMapLink: () => void;
  linkedActionMaps: ActionMap[];
  getActionItemsForMap: (actionMapId: string) => ActionItem[];
}

function KeyResultCard({
  kr,
  canManage,
  onEdit,
  onDelete,
  onToggleAchieved,
  onOpenActionMapLink,
  linkedActionMaps,
  getActionItemsForMap,
}: KeyResultCardProps) {
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set());
  const progress = kr.progressRate || 0;
  const isAchieved = kr.isAchieved || progress >= 100;

  const toggleMapExpand = (mapId: string) => {
    setExpandedMaps(prev => {
      const next = new Set(prev);
      if (next.has(mapId)) {
        next.delete(mapId);
      } else {
        next.add(mapId);
      }
      return next;
    });
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 100) return '#4caf50';
    if (rate >= 50) return '#ff9800';
    return 'var(--primary)';
  };

  return (
    <div className={styles.krCard}>
      <div className={styles.krCardMain}>
        {/* ステータスアイコン */}
        <button
          className={styles.krStatus}
          onClick={kr.isQualitative ? onToggleAchieved : undefined}
          disabled={!kr.isQualitative}
          title={kr.isQualitative ? (isAchieved ? '未達成に戻す' : '達成済みにする') : undefined}
        >
          {isAchieved ? (
            <CheckCircle2 size={20} className={styles.achieved} />
          ) : kr.isQualitative ? (
            <Square size={20} className={styles.pending} />
          ) : (
            <Key size={20} className={styles.keyIcon} />
          )}
        </button>

        {/* タイトル */}
        <span className={styles.krCardTitle}>{kr.title}</span>

        {/* 計算方法バッジ */}
        <span className={styles.krCalcMethod}>
          {CALC_METHOD_LABELS[kr.calcMethod]}
        </span>

        {/* 進捗 */}
        <div className={styles.krProgress}>
          <div className={styles.krProgressBar}>
            <div
              className={styles.krProgressFill}
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: getProgressColor(progress),
              }}
            />
          </div>
          <span
            className={styles.krProgressText}
            style={{ color: getProgressColor(progress) }}
          >
            {progress}%
          </span>
        </div>

        {/* アクション */}
        <div className={styles.krActions}>
          {kr.calcMethod === 'fromActionMaps' && (
            <button
              className={styles.krActionButton}
              onClick={onOpenActionMapLink}
              title="Action Mapをリンク"
            >
              <Link size={16} />
            </button>
          )}
          {canManage && (
            <>
              <button className={styles.krActionButton} onClick={onEdit} title="編集">
                <Pencil size={16} />
              </button>
              <button
                className={`${styles.krActionButton} ${styles.deleteButton}`}
                onClick={() => {
                  if (confirm('この Key Result を削除しますか？')) {
                    onDelete();
                  }
                }}
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* リンク済み Action Map リスト（展開可能） */}
      {linkedActionMaps.length > 0 && (
        <div className={styles.actionMapMiniList}>
          {linkedActionMaps.map(am => {
            const items = getActionItemsForMap(am.id);
            const isExpanded = expandedMaps.has(am.id);
            const hasItems = items.length > 0;

            return (
              <div key={am.id} className={styles.actionMapExpandable}>
                <div
                  className={styles.actionMapMiniItem}
                  onClick={() => hasItems && toggleMapExpand(am.id)}
                  style={{ cursor: hasItems ? 'pointer' : 'default' }}
                >
                  {hasItems && (
                    <span className={styles.expandIcon}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                  <Map size={14} className={styles.actionMapMiniIcon} />
                  <span className={styles.actionMapMiniTitle}>{am.title}</span>
                  {hasItems && (
                    <span className={styles.actionMapItemCount}>({items.length})</span>
                  )}
                  <span
                    className={styles.actionMapMiniProgress}
                    style={{ color: am.progressRate && am.progressRate >= 80 ? '#4caf50' : 'var(--primary)' }}
                  >
                    {am.progressRate ?? 0}%
                  </span>
                </div>

                {/* アイテム展開 */}
                {isExpanded && hasItems && (
                  <div className={styles.actionItemsList}>
                    {items.map(item => (
                      <div key={item.id} className={styles.actionItemRow}>
                        <Circle
                          size={10}
                          fill={STATUS_COLORS[item.status] || '#9E9E9E'}
                          color={STATUS_COLORS[item.status] || '#9E9E9E'}
                          className={styles.actionItemStatus}
                        />
                        <span className={styles.actionItemTitle}>{item.title}</span>
                        {item.dueDate && (
                          <span className={styles.actionItemDue}>
                            〜{item.dueDate.slice(5, 10)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
