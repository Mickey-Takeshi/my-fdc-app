/**
 * app/_components/action-map/ActionMapAccordion.tsx
 *
 * Phase 11: Action Map アコーディオン表示
 * クリックで開閉、中にAction Itemsを表示
 */

'use client';

import type { ActionMap, ActionItem, ActionItemStatus, DueDateWarningLevel } from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';
import { ACTION_ITEM_STATUS_CONFIG, DUE_DATE_WARNING_CONFIG } from '@/lib/types/action-map';
import { SUIT_CONFIG } from '@/lib/types/task';
import { Archive, ArchiveRestore, Pencil, Trash2, Target, ClipboardList, Check, Circle } from 'lucide-react';
import styles from './ActionMapAccordion.module.css';

interface ActionMapAccordionProps {
  map: ActionMap;
  isExpanded: boolean;
  onToggle: () => void;
  items: ActionItem[];
  canManage: boolean;
  saving: boolean;
  onEditMap: () => void;
  onArchiveMap: () => void;
  onUnarchiveMap: () => void;
  onDeleteMap: () => void;
  onCreateItem: () => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItemStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: (item: ActionItem) => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  getLinkedTasks: (itemId: string) => Task[];
}

export function ActionMapAccordion({
  map,
  isExpanded,
  onToggle,
  items,
  canManage,
  saving,
  onEditMap,
  onArchiveMap,
  onUnarchiveMap,
  onDeleteMap,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onUpdateItemStatus,
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  getLinkedTasks,
}: ActionMapAccordionProps) {
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

  const completedItems = items.filter(i => i.status === 'done').length;

  return (
    <div className={`${styles.accordion} ${map.isArchived ? styles.archived : ''}`}>
      {/* ヘッダー（クリックで開閉） */}
      <div className={styles.header} onClick={onToggle}>
        <div className={styles.headerLeft}>
          <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
            ▶
          </span>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>
              {map.title || '(無題)'}
              {map.isArchived && <span className={styles.archivedBadge}><Archive size={14} /></span>}
            </h3>
            <div className={styles.meta}>
              <span className={styles.period}>
                {formatDate(map.targetPeriodStart)} ~ {formatDate(map.targetPeriodEnd)}
              </span>
              <span className={styles.itemCount}>
                {completedItems}/{items.length} 完了
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* 進捗バー */}
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${map.progressRate ?? 0}%`,
                  backgroundColor: getProgressColor(map.progressRate),
                }}
              />
            </div>
            <span
              className={styles.progressText}
              style={{ color: getProgressColor(map.progressRate) }}
            >
              {map.progressRate ?? 0}%
            </span>
          </div>

          {/* アクションボタン */}
          {canManage && (
            <div className={styles.actions} onClick={e => e.stopPropagation()}>
              <button
                className={styles.actionButton}
                onClick={onEditMap}
                title="編集"
              >
                <Pencil size={14} />
              </button>
              {map.isArchived ? (
                <button
                  className={styles.actionButton}
                  onClick={onUnarchiveMap}
                  title="アーカイブ解除"
                >
                  <ArchiveRestore size={14} />
                </button>
              ) : (
                <button
                  className={styles.actionButton}
                  onClick={onArchiveMap}
                  title="アーカイブ"
                >
                  <Archive size={14} />
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => {
                  if (confirm('この Action Map を削除しますか？')) {
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
      </div>

      {/* コンテンツ（展開時のみ表示） */}
      {isExpanded && (
        <div className={styles.content}>
          {map.description && (
            <p className={styles.description}>{map.description}</p>
          )}

          {/* Action Items */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <span className={styles.itemsTitle}>Action Items ({items.length})</span>
              {canManage && (
                <button
                  className={styles.addItemButton}
                  onClick={onCreateItem}
                  disabled={saving}
                >
                  + 追加
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyItems}>
                <p>Action Item がありません</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {items.map(item => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    canManage={canManage}
                    onEdit={() => onEditItem(item)}
                    onDelete={() => onDeleteItem(item.id)}
                    onUpdateStatus={onUpdateItemStatus}
                    onOpenFocusMode={() => onOpenFocusMode(item)}
                    getRemainingDays={getRemainingDays}
                    getWarningLevel={getWarningLevel}
                    linkedTasks={getLinkedTasks(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: () => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  linkedTasks: Task[];
}

function ActionItemCard({
  item,
  canManage,
  onEdit,
  onDelete,
  // onUpdateStatus は将来的にカード内ステータス変更で使用予定
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  linkedTasks,
}: ActionItemCardProps) {
  const statusConfig = ACTION_ITEM_STATUS_CONFIG[item.status];
  const remainingDays = getRemainingDays(item.dueDate);
  const warningLevel = getWarningLevel(remainingDays);
  const warningConfig = DUE_DATE_WARNING_CONFIG[warningLevel];

  const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
  const totalTasks = linkedTasks.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemMain}>
        {/* ステータスアイコン */}
        <span
          className={styles.itemStatus}
          style={{ color: statusConfig.color }}
          title={statusConfig.ja}
        >
          {statusConfig.icon}
        </span>

        {/* タイトル */}
        <span className={styles.itemTitle}>{item.title || '(無題)'}</span>

        {/* 期限 */}
        {item.dueDate && (
          <span
            className={styles.itemDueDate}
            style={{ color: warningConfig.color }}
          >
            {warningConfig.icon} {formatDate(item.dueDate)}
          </span>
        )}

        {/* TODO進捗 */}
        {totalTasks > 0 && (
          <span
            className={styles.itemTodoProgress}
            style={{ color: completedTasks === totalTasks ? 'var(--primary-dark)' : 'var(--primary)' }}
          >
            <ClipboardList size={14} style={{ marginRight: '4px' }} /> {completedTasks}/{totalTasks}
          </span>
        )}

        {/* アクション */}
        <div className={styles.itemActions}>
          <button
            className={styles.itemActionButton}
            onClick={onOpenFocusMode}
            title="フォーカスモード"
          >
            <Target size={14} />
          </button>
          {canManage && (
            <>
              <button
                className={styles.itemActionButton}
                onClick={onEdit}
                title="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.itemActionButton} ${styles.deleteButton}`}
                onClick={() => {
                  if (confirm('このアイテムを削除しますか？')) {
                    onDelete();
                  }
                }}
                title="削除"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* TODOミニリスト */}
      {totalTasks > 0 && (
        <div className={styles.todoMiniList}>
          {linkedTasks.slice(0, 3).map(task => (
            <div
              key={task.id}
              className={`${styles.todoMiniItem} ${task.status === 'done' ? styles.completed : ''}`}
            >
              <span
                className={styles.todoMiniSuit}
                style={{ color: task.suit ? SUIT_CONFIG[task.suit].color : '#888' }}
              >
                {task.suit ? SUIT_CONFIG[task.suit].symbol : '🃏'}
              </span>
              <span className={styles.todoMiniTitle}>
                {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
              </span>
              <span className={styles.todoMiniStatus}>
                {task.status === 'done' ? <Check size={12} /> : <Circle size={12} />}
              </span>
            </div>
          ))}
          {totalTasks > 3 && (
            <div className={styles.todoMiniMore}>
              他 {totalTasks - 3} 件
            </div>
          )}
        </div>
      )}
    </div>
  );
}
