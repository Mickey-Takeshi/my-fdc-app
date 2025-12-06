/**
 * app/_components/action-map/ActionItemTree.tsx
 *
 * Phase 11: Action Item ツリービュー
 */

'use client';

import type { ActionItem, ActionItemStatus, ActionItemWithChildren, DueDateWarningLevel } from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';
import { ACTION_ITEM_STATUS_CONFIG, ACTION_ITEM_PRIORITY_CONFIG, DUE_DATE_WARNING_CONFIG } from '@/lib/types/action-map';
import { ClipboardList, Target, Pencil, Trash2 } from 'lucide-react';
import styles from './ActionItemTree.module.css';

interface ActionItemTreeProps {
  items: ActionItemWithChildren[];
  selectedItemId: string | null;
  canManage: boolean;
  onSelectItem: (itemId: string | null) => void;
  onCreateItem: (parentItemId?: string | null) => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: (item: ActionItem) => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  getLinkedTasks: (itemId: string) => Task[];
}

export function ActionItemTree({
  items,
  selectedItemId,
  canManage,
  onSelectItem,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  getLinkedTasks,
}: ActionItemTreeProps) {
  return (
    <div className={styles.container}>
      {items.map(item => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          selectedItemId={selectedItemId}
          canManage={canManage}
          onSelectItem={onSelectItem}
          onCreateItem={onCreateItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onUpdateStatus={onUpdateStatus}
          onOpenFocusMode={onOpenFocusMode}
          getRemainingDays={getRemainingDays}
          getWarningLevel={getWarningLevel}
          getLinkedTasks={getLinkedTasks}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  item: ActionItemWithChildren;
  level: number;
  selectedItemId: string | null;
  canManage: boolean;
  onSelectItem: (itemId: string | null) => void;
  onCreateItem: (parentItemId?: string | null) => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: (item: ActionItem) => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  getLinkedTasks: (itemId: string) => Task[];
}

function TreeNode({
  item,
  level,
  selectedItemId,
  canManage,
  onSelectItem,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  getLinkedTasks,
}: TreeNodeProps) {
  const statusConfig = ACTION_ITEM_STATUS_CONFIG[item.status];
  const priorityConfig = item.priority ? ACTION_ITEM_PRIORITY_CONFIG[item.priority] : null;
  const remainingDays = getRemainingDays(item.dueDate);
  const warningLevel = getWarningLevel(remainingDays);
  const warningConfig = DUE_DATE_WARNING_CONFIG[warningLevel];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const hasChildren = item.children.length > 0;
  const linkedTasks = getLinkedTasks(item.id);
  const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
  const totalTasks = linkedTasks.length;

  return (
    <div className={styles.node} style={{ '--level': level } as React.CSSProperties}>
      <div
        className={`${styles.nodeContent} ${selectedItemId === item.id ? styles.selected : ''}`}
        onClick={() => onSelectItem(item.id)}
      >
        {/* インデント線 */}
        {level > 0 && (
          <div className={styles.indent}>
            <span className={styles.line} />
          </div>
        )}

        {/* ステータスアイコン */}
        <span
          className={styles.status}
          style={{ color: statusConfig.color }}
          title={statusConfig.ja}
        >
          {statusConfig.icon}
        </span>

        {/* タイトル */}
        <span className={styles.title}>{item.title || '(無題)'}</span>

        {/* 優先度 */}
        {priorityConfig && (
          <span
            className={styles.priority}
            style={{ color: priorityConfig.color }}
            title={`優先度: ${priorityConfig.ja}`}
          >
            ●
          </span>
        )}

        {/* 期限 */}
        {item.dueDate && (
          <span
            className={styles.dueDate}
            style={{ color: warningConfig.color }}
            title={remainingDays !== null ? `残り${remainingDays}日` : undefined}
          >
            {warningConfig.icon} {formatDate(item.dueDate)}
          </span>
        )}

        {/* 進捗：TODO紐付け数を表示 */}
        {totalTasks > 0 && (
          <span
            className={styles.progress}
            title={`${completedTasks}/${totalTasks} TODO完了`}
            style={{ color: completedTasks === totalTasks ? 'var(--primary-dark)' : 'var(--primary)' }}
          >
            <ClipboardList size={14} style={{ marginRight: '4px' }} />{completedTasks}/{totalTasks}
          </span>
        )}

        {/* アクション */}
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={(e) => { e.stopPropagation(); onOpenFocusMode(item); }}
            title="フォーカスモード"
          >
            <Target size={14} />
          </button>
          {canManage && (
            <>
              <button
                className={styles.actionButton}
                onClick={(e) => { e.stopPropagation(); onCreateItem(item.id); }}
                title="子アイテム追加"
              >
                +
              </button>
              <button
                className={styles.actionButton}
                onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                title="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('このアイテムを削除しますか？')) {
                    onDeleteItem(item.id);
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

      {/* 子アイテム */}
      {hasChildren && (
        <div className={styles.children}>
          {item.children.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedItemId={selectedItemId}
              canManage={canManage}
              onSelectItem={onSelectItem}
              onCreateItem={onCreateItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onUpdateStatus={onUpdateStatus}
              onOpenFocusMode={onOpenFocusMode}
              getRemainingDays={getRemainingDays}
              getWarningLevel={getWarningLevel}
              getLinkedTasks={getLinkedTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
