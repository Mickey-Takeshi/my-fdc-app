/**
 * app/_components/action-map/ActionMapDetail.tsx
 *
 * Phase 11: Action Map 詳細表示（右カラム）
 */

'use client';

import type { ActionMap, ActionItem, ActionItemStatus, ActionItemWithChildren, DueDateWarningLevel } from '@/lib/types/action-map';
import type { ViewMode } from '@/lib/hooks/useActionMapViewModel';
import type { Task } from '@/lib/types/task';
import { ActionItemTree } from './ActionItemTree';
import { ActionItemKanban } from './ActionItemKanban';
import { Archive, ArchiveRestore, Pencil, Trash2, GitBranch, Columns } from 'lucide-react';
import styles from './ActionMapDetail.module.css';

interface ActionMapDetailProps {
  map: ActionMap;
  itemTree: ActionItemWithChildren[];
  itemsByStatus: Record<ActionItemStatus, ActionItem[]>;
  viewMode: ViewMode;
  selectedItemId: string | null;
  canManage: boolean;
  saving: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onEditMap: () => void;
  onArchiveMap: () => void;
  onUnarchiveMap: () => void;
  onDeleteMap: () => void;
  onSelectItem: (itemId: string | null) => void;
  onCreateItem: (parentItemId?: string | null) => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItemStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: (item: ActionItem) => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  getLinkedTasks: (itemId: string) => Task[];
}

export function ActionMapDetail({
  map,
  itemTree,
  itemsByStatus,
  viewMode,
  selectedItemId,
  canManage,
  saving,
  onViewModeChange,
  onEditMap,
  onArchiveMap,
  onUnarchiveMap,
  onDeleteMap,
  onSelectItem,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onUpdateItemStatus,
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  getLinkedTasks,
}: ActionMapDetailProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  const totalItems = Object.values(itemsByStatus).flat().length;

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>
            {map.title || '(無題)'}
            {map.isArchived && <span className={styles.archivedBadge}><Archive size={14} style={{ marginRight: '4px' }} /> アーカイブ</span>}
          </h1>

          {canManage && (
            <div className={styles.actions}>
              <button className={styles.actionButton} onClick={onEditMap} title="編集">
                <Pencil size={14} />
              </button>
              {map.isArchived ? (
                <button className={styles.actionButton} onClick={onUnarchiveMap} title="アーカイブ解除">
                  <ArchiveRestore size={14} />
                </button>
              ) : (
                <button className={styles.actionButton} onClick={onArchiveMap} title="アーカイブ">
                  <Archive size={14} />
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => {
                  if (confirm('この Action Map を削除しますか？配下の Action Item もすべて削除されます。')) {
                    onDeleteMap();
                  }
                }}
                title="削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>期間</span>
            <span className={styles.metaValue}>
              {formatDate(map.targetPeriodStart)} ~ {formatDate(map.targetPeriodEnd)}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>進捗</span>
            <span className={styles.metaValue}>{map.progressRate ?? 0}%</span>
          </div>
        </div>

        {map.description && (
          <p className={styles.description}>{map.description}</p>
        )}

        {/* 進捗バー */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${map.progressRate ?? 0}%` }}
            />
          </div>
        </div>
      </header>

      {/* ツールバー */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.itemCount}>
            Action Items ({totalItems})
          </span>
          {canManage && (
            <button
              className={styles.addItemButton}
              onClick={() => onCreateItem(null)}
              disabled={saving}
            >
              + 追加
            </button>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'tree' ? styles.active : ''}`}
            onClick={() => onViewModeChange('tree')}
            title="ツリービュー"
          >
            <GitBranch size={16} />
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'kanban' ? styles.active : ''}`}
            onClick={() => onViewModeChange('kanban')}
            title="カンバンビュー"
          >
            <Columns size={16} />
          </button>
        </div>
      </div>

      {/* Action Items */}
      <div className={styles.content}>
        {totalItems === 0 ? (
          <div className={styles.emptyItems}>
            <p>Action Item がありません</p>
            {canManage && (
              <button
                className={styles.createItemButton}
                onClick={() => onCreateItem(null)}
              >
                最初の Action Item を作成
              </button>
            )}
          </div>
        ) : viewMode === 'tree' ? (
          <ActionItemTree
            items={itemTree}
            selectedItemId={selectedItemId}
            canManage={canManage}
            onSelectItem={onSelectItem}
            onCreateItem={onCreateItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onUpdateStatus={onUpdateItemStatus}
            onOpenFocusMode={onOpenFocusMode}
            getRemainingDays={getRemainingDays}
            getWarningLevel={getWarningLevel}
            getLinkedTasks={getLinkedTasks}
          />
        ) : (
          <ActionItemKanban
            itemsByStatus={itemsByStatus}
            selectedItemId={selectedItemId}
            canManage={canManage}
            onSelectItem={onSelectItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onUpdateStatus={onUpdateItemStatus}
            onOpenFocusMode={onOpenFocusMode}
            getRemainingDays={getRemainingDays}
            getWarningLevel={getWarningLevel}
            getLinkedTasks={getLinkedTasks}
          />
        )}
      </div>
    </div>
  );
}
