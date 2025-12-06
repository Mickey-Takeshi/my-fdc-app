/**
 * app/_components/action-map/FocusMode.tsx
 *
 * Phase 11: フォーカスモード（Action Item 詳細 + TODO一覧）
 */

'use client';

import type { ActionItem, DueDateWarningLevel } from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';
import { ACTION_ITEM_STATUS_CONFIG, ACTION_ITEM_PRIORITY_CONFIG, DUE_DATE_WARNING_CONFIG } from '@/lib/types/action-map';
import { SUIT_CONFIG } from '@/lib/types/task';
import { Target, ClipboardList, CheckSquare, Square } from 'lucide-react';
import styles from './FocusMode.module.css';

interface FocusModeProps {
  item: ActionItem;
  linkedTasks: Task[];
  onClose: () => void;
  getRemainingDays: (dueDate: string | undefined) => number | null;
  getWarningLevel: (remainingDays: number | null) => DueDateWarningLevel;
}

export function FocusMode({
  item,
  linkedTasks,
  onClose,
  getRemainingDays,
  getWarningLevel,
}: FocusModeProps) {
  const statusConfig = ACTION_ITEM_STATUS_CONFIG[item.status];
  const priorityConfig = item.priority ? ACTION_ITEM_PRIORITY_CONFIG[item.priority] : null;
  const remainingDays = getRemainingDays(item.dueDate);
  const warningLevel = getWarningLevel(remainingDays);
  const warningConfig = DUE_DATE_WARNING_CONFIG[warningLevel];

  const completedTasks = linkedTasks.filter(t => t.status === 'done');
  const progressRate = linkedTasks.length > 0
    ? Math.round((completedTasks.length / linkedTasks.length) * 100)
    : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  const formatTaskTime = (task: Task) => {
    if (!task.startAt) return '';
    const end = task.durationMinutes
      ? calculateEndTime(task.startAt, task.durationMinutes)
      : '';
    return end ? `${task.startAt}-${end}` : task.startAt;
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.focusIcon}><Target size={20} /></span>
            フォーカスモード
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* Action Item 情報 */}
          <div className={styles.itemInfo}>
            <h3 className={styles.itemTitle}>{item.title || '(無題)'}</h3>

            {/* 進捗バー */}
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressRate}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {progressRate}% ({completedTasks.length}/{linkedTasks.length} TODO完了)
              </span>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>ステータス</span>
                <span className={styles.metaValue} style={{ color: statusConfig.color }}>
                  {statusConfig.icon} {statusConfig.ja}
                </span>
              </div>

              {item.dueDate && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>期限</span>
                  <span className={styles.metaValue} style={{ color: warningConfig.color }}>
                    {warningConfig.icon} {formatDate(item.dueDate)}
                    {remainingDays !== null && (
                      <span className={styles.remainingDays}>
                        ({remainingDays > 0 ? `残り${remainingDays}日` : remainingDays === 0 ? '今日' : `${Math.abs(remainingDays)}日超過`})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {priorityConfig && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>優先度</span>
                  <span className={styles.metaValue} style={{ color: priorityConfig.color }}>
                    {priorityConfig.ja}
                  </span>
                </div>
              )}
            </div>

            {item.description && (
              <div className={styles.description}>
                <span className={styles.metaLabel}>説明</span>
                <p>{item.description}</p>
              </div>
            )}
          </div>

          {/* TODO 一覧 */}
          <div className={styles.todoSection}>
            <div className={styles.todoHeader}>
              <h4 className={styles.todoTitle}><ClipboardList size={16} style={{ marginRight: '4px' }} /> 紐づくTODO一覧</h4>
              <button className={styles.addTodoButton} disabled>
                + TODO作成
              </button>
            </div>

            {linkedTasks.length === 0 ? (
              <div className={styles.emptyTodo}>
                <p>紐づくTODOがありません</p>
                <span className={styles.hint}>
                  TODO タブで「Action Itemに紐付け」から追加できます
                </span>
              </div>
            ) : (
              <div className={styles.todoList}>
                {linkedTasks.map(task => {
                  const suitConfig = task.suit ? SUIT_CONFIG[task.suit] : { symbol: '🃏', color: '#888', ja: '分類待ち', en: 'Unclassified' };
                  return (
                    <div
                      key={task.id}
                      className={`${styles.todoItem} ${task.status === 'done' ? styles.completed : ''}`}
                    >
                      <span
                        className={styles.todoStatus}
                        style={{ color: task.status === 'done' ? '#4caf50' : '#9e9e9e' }}
                      >
                        {task.status === 'done' ? <CheckSquare size={16} /> : <Square size={16} />}
                      </span>
                      <span className={styles.todoTime}>
                        {formatTaskTime(task)}
                      </span>
                      <span className={styles.todoName}>{task.title}</span>
                      <span
                        className={styles.todoSuit}
                        style={{ color: suitConfig.color }}
                        title={suitConfig.ja}
                      >
                        [{suitConfig.symbol} {suitConfig.ja}]
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.actionButton} disabled>
            編集
          </button>
          <button className={styles.actionButton} disabled>
            TODO一括作成
          </button>
          <button className={styles.actionButton} disabled>
            既存TODO紐付け
          </button>
        </div>
      </div>
    </div>
  );
}
