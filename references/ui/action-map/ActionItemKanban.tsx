/**
 * app/_components/action-map/ActionItemKanban.tsx
 *
 * Phase 11: Action Item カンバンボードビュー
 */

'use client';

import { useState } from 'react';
import type { ActionItem, ActionItemStatus, DueDateWarningLevel } from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';
import { ACTION_ITEM_STATUS_CONFIG, DUE_DATE_WARNING_CONFIG } from '@/lib/types/action-map';
import { SUIT_CONFIG } from '@/lib/types/task';
import { ClipboardList, Pencil, Trash2, Target, Check, Circle } from 'lucide-react';
import styles from './ActionItemKanban.module.css';

interface ActionItemKanbanProps {
  itemsByStatus: Record<ActionItemStatus, ActionItem[]>;
  selectedItemId: string | null;
  canManage: boolean;
  onSelectItem: (itemId: string | null) => void;
  onEditItem: (item: ActionItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateStatus: (itemId: string, status: ActionItemStatus) => void;
  onOpenFocusMode: (item: ActionItem) => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
  getLinkedTasks: (itemId: string) => Task[];
}

const STATUSES: ActionItemStatus[] = ['not_started', 'in_progress', 'blocked', 'done'];

export function ActionItemKanban({
  itemsByStatus,
  selectedItemId,
  canManage,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  onOpenFocusMode,
  getRemainingDays,
  getWarningLevel,
  getLinkedTasks,
}: ActionItemKanbanProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: ActionItemStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && canManage) {
      onUpdateStatus(itemId, status);
    }
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  return (
    <div className={styles.container}>
      {STATUSES.map(status => {
        const config = ACTION_ITEM_STATUS_CONFIG[status];
        const items = itemsByStatus[status];

        return (
          <div
            key={status}
            className={styles.column}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className={styles.columnHeader}>
              <span className={styles.columnIcon} style={{ color: config.color }}>
                {config.icon}
              </span>
              <span className={styles.columnTitle}>{config.ja}</span>
              <span className={styles.columnCount}>({items.length})</span>
            </div>

            <div className={styles.columnContent}>
              {items.map(item => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  linkedTasks={getLinkedTasks(item.id)}
                  isSelected={selectedItemId === item.id}
                  isDragging={draggedItemId === item.id}
                  canManage={canManage}
                  onSelect={() => onSelectItem(item.id)}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item.id)}
                  onOpenFocusMode={() => onOpenFocusMode(item)}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  getRemainingDays={getRemainingDays}
                  getWarningLevel={getWarningLevel}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  item: ActionItem;
  linkedTasks: Task[];
  isSelected: boolean;
  isDragging: boolean;
  canManage: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFocusMode: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
}

function KanbanCard({
  item,
  linkedTasks,
  isSelected,
  isDragging,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onOpenFocusMode,
  onDragStart,
  onDragEnd,
  getRemainingDays,
  getWarningLevel,
}: KanbanCardProps) {
  const remainingDays = getRemainingDays(item.dueDate);
  const warningLevel = getWarningLevel(remainingDays);
  const warningConfig = DUE_DATE_WARNING_CONFIG[warningLevel];

  // TODO進捗を計算
  const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
  const totalTasks = linkedTasks.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      draggable={canManage}
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className={styles.cardTitle}>{item.title || '(無題)'}</div>

      <div className={styles.cardMeta}>
        {item.dueDate && (
          <span
            className={styles.cardDueDate}
            style={{ color: warningConfig.color }}
          >
            {warningConfig.icon} {formatDate(item.dueDate)}
            {remainingDays !== null && remainingDays <= 7 && (
              <span className={styles.remainingDays}>
                ({remainingDays > 0 ? `残り${remainingDays}日` : remainingDays === 0 ? '今日' : `${Math.abs(remainingDays)}日超過`})
              </span>
            )}
          </span>
        )}
      </div>

      {/* TODO進捗の可視化 */}
      {totalTasks > 0 && (
        <div className={styles.todoProgress}>
          <div className={styles.todoProgressHeader}>
            <span className={styles.todoProgressLabel}><ClipboardList size={12} style={{ marginRight: '4px' }} /> TODO</span>
            <span className={styles.todoProgressCount}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className={styles.todoProgressBar}>
            <div
              className={styles.todoProgressFill}
              style={{
                width: `${(completedTasks / totalTasks) * 100}%`,
                background: completedTasks === totalTasks ? 'var(--primary-dark)' : 'var(--primary)'
              }}
            />
          </div>
          {/* TODOミニリスト（最大3件表示） */}
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
                  {task.title.length > 15 ? task.title.slice(0, 15) + '...' : task.title}
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
        </div>
      )}

      {/* 従来の進捗バー（TODO未連携時のフォールバック） */}
      {totalTasks === 0 && (item.progressRate ?? 0) > 0 && (
        <div className={styles.cardProgress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${item.progressRate}%` }}
            />
          </div>
          <span className={styles.progressText}>{item.progressRate}%</span>
        </div>
      )}

      <div className={styles.cardActions}>
        <button
          className={styles.cardAction}
          onClick={(e) => { e.stopPropagation(); onOpenFocusMode(); }}
          title="フォーカスモード"
        >
          <Target size={14} />
        </button>
        {canManage && (
          <>
            <button
              className={styles.cardAction}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="編集"
            >
              <Pencil size={14} />
            </button>
            <button
              className={`${styles.cardAction} ${styles.deleteAction}`}
              onClick={(e) => {
                e.stopPropagation();
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
  );
}
