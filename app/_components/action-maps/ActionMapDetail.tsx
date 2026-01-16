/**
 * app/_components/action-maps/ActionMapDetail.tsx
 *
 * Phase 10: ActionMap詳細ビューコンポーネント
 */

'use client';

import { useState } from 'react';
import { ActionItemRow } from './ActionItemRow';
import { TaskLinkModal } from './TaskLinkModal';
import { KRSelector } from './KRSelector';
import type { ActionMap, ActionItem, ActionItemPriority } from '@/lib/types/action-map';

interface ActionMapDetailProps {
  map: ActionMap & { items: ActionItem[] };
  workspaceId: string;
  onBack: () => void;
  onUpdateItem: (itemId: string, updates: Partial<ActionItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onCreateItem: (title: string, priority: ActionItemPriority) => Promise<void>;
  onUpdateMap: (updates: Partial<ActionMap>) => Promise<void>;
  onDeleteMap: () => Promise<void>;
  onLinkTask: (actionItemId: string, taskId: string) => Promise<void>;
  onUnlinkTask: (taskId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLinkKR: (krId: string | null) => Promise<void>;
}

export function ActionMapDetail({
  map,
  workspaceId,
  onBack,
  onUpdateItem,
  onDeleteItem,
  onCreateItem,
  onUpdateMap,
  onDeleteMap,
  onLinkTask,
  onUnlinkTask,
  onRefresh,
  onLinkKR,
}: ActionMapDetailProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<ActionItemPriority>('medium');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(map.title);
  const [taskLinkItemId, setTaskLinkItemId] = useState<string | null>(null);

  const progressRate = map.progressRate ?? 0;
  const items = map.items || [];

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    await onCreateItem(newItemTitle.trim(), newItemPriority);
    setNewItemTitle('');
    setNewItemPriority('medium');
    setIsAddingItem(false);
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== map.title) {
      await onUpdateMap({ title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← 一覧に戻る
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setEditTitle(map.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  border: '1px solid var(--primary)',
                  borderRadius: '4px',
                  width: '100%',
                  maxWidth: '400px',
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{ margin: 0, cursor: 'pointer' }}
              >
                {map.title}
              </h1>
            )}
            {map.description && (
              <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
                {map.description}
              </p>
            )}
          </div>

          <button
            onClick={onDeleteMap}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            削除
          </button>
        </div>

        {/* 全体進捗 */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            <span>全体進捗</span>
            <span style={{ fontWeight: 600 }}>{progressRate}%</span>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressRate}%`,
                backgroundColor: progressRate === 100 ? 'var(--success)' : 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* OKR連携 */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
            OKR連携（Key Result）
          </h3>
          <KRSelector
            workspaceId={workspaceId}
            currentKRId={map.keyResultId}
            onSelect={onLinkKR}
          />
        </div>
      </div>

      {/* ActionItem一覧 */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-muted)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px' }}>
            アクションアイテム ({items.length})
          </h2>
          <button
            onClick={() => setIsAddingItem(true)}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + 追加
          </button>
        </div>

        {/* 新規追加フォーム */}
        {isAddingItem && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
            }}
          >
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="アクションアイテムのタイトル"
              autoFocus
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') setIsAddingItem(false);
              }}
            />
            <select
              value={newItemPriority}
              onChange={(e) => setNewItemPriority(e.target.value as ActionItemPriority)}
              style={{
                padding: '8px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
            <button
              onClick={handleAddItem}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              追加
            </button>
            <button
              onClick={() => setIsAddingItem(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* アイテム一覧 */}
        {items.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-light)',
            }}
          >
            アクションアイテムがありません
          </div>
        ) : (
          items.map((item) => (
            <ActionItemRow
              key={item.id}
              item={item}
              onUpdate={(itemId, updates) => onUpdateItem(itemId, updates)}
              onDelete={onDeleteItem}
              onOpenTaskLink={(itemId) => setTaskLinkItemId(itemId)}
            />
          ))
        )}
      </div>

      {/* Task紐付けモーダル */}
      {taskLinkItemId && (
        <TaskLinkModal
          isOpen={true}
          onClose={() => setTaskLinkItemId(null)}
          actionItemId={taskLinkItemId}
          linkedTaskIds={items.find((i) => i.id === taskLinkItemId)?.linkedTaskIds || []}
          workspaceId={workspaceId}
          onLink={async (taskId) => {
            await onLinkTask(taskLinkItemId, taskId);
            await onRefresh();
          }}
          onUnlink={async (taskId) => {
            await onUnlinkTask(taskId);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}
