/**
 * app/_components/action-maps/ActionMapList.tsx
 *
 * Phase 10: ActionMap一覧コンポーネント
 */

'use client';

import { useState } from 'react';
import { ActionMapCard } from './ActionMapCard';
import type { ActionMap } from '@/lib/types/action-map';

interface ActionMapListProps {
  maps: ActionMap[];
  loading: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onCreate: (title: string, description?: string) => Promise<void>;
}

export function ActionMapList({
  maps,
  loading,
  onSelect,
  onArchive,
  onCreate,
}: ActionMapListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeMaps = maps.filter((m) => !m.isArchived);
  const archivedMaps = maps.filter((m) => m.isArchived);
  const displayMaps = showArchived ? archivedMaps : activeMaps;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim(), newDescription.trim() || undefined);
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>ActionMap</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: !showArchived ? 'var(--primary)' : 'transparent',
                color: !showArchived ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              アクティブ ({activeMaps.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: showArchived ? 'var(--primary)' : 'transparent',
                color: showArchived ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              アーカイブ ({archivedMaps.length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
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
          + 新規作成
        </button>
      </div>

      {/* 新規作成フォーム */}
      {isCreating && (
        <div
          style={{
            padding: '16px',
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>新規ActionMap</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="タイトル（必須）"
              autoFocus
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="説明（任意）"
              rows={2}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsCreating(false)}
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
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: newTitle.trim() ? 'var(--primary)' : 'var(--bg-muted)',
                  color: newTitle.trim() ? 'white' : 'var(--text-light)',
                  cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カード一覧 */}
      {displayMaps.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-light)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
          }}
        >
          {showArchived
            ? 'アーカイブされたActionMapはありません'
            : 'ActionMapがありません。「新規作成」から作成してください。'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {displayMaps.map((map) => (
            <ActionMapCard
              key={map.id}
              map={map}
              onSelect={onSelect}
              onArchive={showArchived ? undefined : onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
