'use client';

/**
 * app/(app)/action-maps/_components/ActionMapCard.tsx
 *
 * ActionMap カード（Phase 10, Phase 88: React.memo）
 * 進捗バー + ActionItem リスト + タスク紐付け
 */

import { useState, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  Loader,
  AlertTriangle,
  Link,
} from 'lucide-react';
import {
  ACTION_ITEM_STATUS_LABELS,
  ACTION_ITEM_PRIORITY_LABELS,
  ALL_ACTION_ITEM_STATUSES,
  type ActionMap,
  type ActionItem,
  type ActionItemStatus,
} from '@/lib/types/action-map';
import type { Task } from '@/lib/types/task';

interface ActionMapCardProps {
  actionMap: ActionMap;
  tasks: Task[];
  onAddItem: (actionMapId: string, data: {
    title: string;
    description: string;
    priority: string;
    due_date: string;
  }) => Promise<boolean>;
  onUpdateItem: (itemId: string, data: Record<string, string | number | null>) => Promise<boolean>;
  onDeleteItem: (itemId: string) => Promise<boolean>;
  onLinkTask: (taskId: string, actionItemId: string | null) => Promise<boolean>;
  onDeleteMap: (mapId: string) => Promise<boolean>;
}

const statusIcon = (status: ActionItemStatus) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
    case 'in_progress':
      return <Loader size={16} style={{ color: 'var(--primary)' }} />;
    case 'blocked':
      return <AlertTriangle size={16} style={{ color: 'var(--error, #ef4444)' }} />;
    default:
      return <Circle size={16} style={{ color: 'var(--text-muted)' }} />;
  }
};

// Phase 88: memo to prevent unnecessary re-renders in action map list
const ActionMapCard = memo(function ActionMapCard({
  actionMap,
  tasks,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onLinkTask,
  onDeleteMap,
}: ActionMapCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);

  const items = actionMap.items ?? [];
  const progress = actionMap.progressRate ?? 0;

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    setIsSubmitting(true);
    const success = await onAddItem(actionMap.id, {
      title: newItemTitle.trim(),
      description: '',
      priority: 'medium',
      due_date: '',
    });

    if (success) {
      setNewItemTitle('');
      setShowAddItem(false);
    }
    setIsSubmitting(false);
  };

  const handleStatusCycle = async (item: ActionItem) => {
    const statusOrder: ActionItemStatus[] = ['not_started', 'in_progress', 'blocked', 'done'];
    const currentIdx = statusOrder.indexOf(item.status);
    const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
    await onUpdateItem(item.id, { status: nextStatus });
  };

  // 未リンクのタスク（action_item_id が null のもの）
  const unlinkedTasks = tasks.filter((t) => !t.actionItemId);

  return (
    <div className="action-map-card">
      {/* ヘッダー */}
      <div className="action-map-header" onClick={() => setExpanded(!expanded)}>
        <div className="action-map-expand">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        <div className="action-map-info">
          <h3 className="action-map-title">{actionMap.title}</h3>
          {actionMap.description && (
            <p className="action-map-desc">{actionMap.description}</p>
          )}
        </div>
        <div className="action-map-progress">
          <span className="action-map-progress-text">{progress}%</span>
          <div className="action-map-progress-bar">
            <div
              className="action-map-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 期間表示 */}
      {(actionMap.targetPeriodStart || actionMap.targetPeriodEnd) && (
        <div className="action-map-period">
          <Calendar size={12} />
          <span>
            {actionMap.targetPeriodStart || '?'}
            {' - '}
            {actionMap.targetPeriodEnd || '?'}
          </span>
        </div>
      )}

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="action-map-body">
          {/* ActionItem リスト */}
          {items.length === 0 ? (
            <div className="action-map-empty">
              ActionItem がありません
            </div>
          ) : (
            <div className="action-item-list">
              {items.map((item) => {
                const linkedTasks = tasks.filter((t) => t.actionItemId === item.id);
                return (
                  <div key={item.id} className="action-item">
                    <div className="action-item-row">
                      <button
                        className="action-item-status-btn"
                        onClick={() => handleStatusCycle(item)}
                        title={ACTION_ITEM_STATUS_LABELS[item.status]}
                      >
                        {statusIcon(item.status)}
                      </button>

                      <div className="action-item-info">
                        <span className={`action-item-title ${item.status === 'done' ? 'action-item-done' : ''}`}>
                          {item.title}
                        </span>
                        <div className="action-item-meta">
                          <span className={`action-item-priority priority-${item.priority}`}>
                            {ACTION_ITEM_PRIORITY_LABELS[item.priority]}
                          </span>
                          {item.dueDate && (
                            <span className="action-item-due">
                              <Calendar size={11} />
                              {item.dueDate}
                            </span>
                          )}
                          {(item.linkedTaskCount ?? 0) > 0 && (
                            <span className="action-item-task-count">
                              {item.doneTaskCount}/{item.linkedTaskCount} tasks
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="action-item-actions">
                        <button
                          className="action-item-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkingItemId(linkingItemId === item.id ? null : item.id);
                          }}
                          title="タスクを紐付け"
                        >
                          <Link size={14} />
                        </button>
                        <button
                          className="action-item-delete-btn"
                          onClick={() => onDeleteItem(item.id)}
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* リンク済みタスク表示 */}
                    {linkedTasks.length > 0 && (
                      <div className="action-item-linked-tasks">
                        {linkedTasks.map((t) => (
                          <div key={t.id} className="linked-task-tag">
                            {statusIcon(t.status === 'done' ? 'done' : t.status === 'in_progress' ? 'in_progress' : 'not_started')}
                            <span className={t.status === 'done' ? 'action-item-done' : ''}>
                              {t.title}
                            </span>
                            <button
                              className="linked-task-unlink"
                              onClick={() => onLinkTask(t.id, null)}
                              title="紐付け解除"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* タスク紐付けセレクター */}
                    {linkingItemId === item.id && unlinkedTasks.length > 0 && (
                      <div className="action-item-link-selector">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onLinkTask(e.target.value, item.id);
                              setLinkingItemId(null);
                            }
                          }}
                          defaultValue=""
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          <option value="">タスクを選択...</option>
                          {unlinkedTasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ActionItem 追加 */}
          {showAddItem ? (
            <div className="action-item-add-form">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="ActionItem のタイトル..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem();
                  if (e.key === 'Escape') setShowAddItem(false);
                }}
                autoFocus
                style={{ fontSize: '13px', padding: '6px 10px' }}
              />
              <button
                className="btn btn-primary btn-small"
                onClick={handleAddItem}
                disabled={isSubmitting || !newItemTitle.trim()}
              >
                追加
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => { setShowAddItem(false); setNewItemTitle(''); }}
              >
                取消
              </button>
            </div>
          ) : (
            <div className="action-map-footer">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowAddItem(true)}
              >
                <Plus size={14} />
                ActionItem を追加
              </button>
              <button
                className="action-map-delete-btn"
                onClick={() => {
                  if (confirm('この Action Map を削除しますか？')) {
                    onDeleteMap(actionMap.id);
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ActionMapCard;
