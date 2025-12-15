/**
 * app/_components/okr/ObjectiveList.tsx
 *
 * Phase 11: Objective一覧コンポーネント
 */

'use client';

import { useState } from 'react';
import { ObjectiveCard } from './ObjectiveCard';
import { PERIOD_PRESETS } from '@/lib/types/okr';
import type { Objective } from '@/lib/types/okr';

interface ObjectiveListProps {
  objectives: Objective[];
  loading: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onCreate: (title: string, period: string, description?: string) => Promise<void>;
}

export function ObjectiveList({
  objectives,
  loading,
  onSelect,
  onArchive,
  onCreate,
}: ObjectiveListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState(PERIOD_PRESETS[0].value);
  const [newDescription, setNewDescription] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeObjectives = objectives.filter((o) => !o.isArchived);
  const archivedObjectives = objectives.filter((o) => o.isArchived);
  const displayObjectives = showArchived ? archivedObjectives : activeObjectives;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim(), newPeriod, newDescription.trim() || undefined);
    setNewTitle('');
    setNewPeriod(PERIOD_PRESETS[0].value);
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
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Objectives</h2>
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
              アクティブ ({activeObjectives.length})
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
              アーカイブ ({archivedObjectives.length})
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
          + 新規Objective
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>新規Objective</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Objectiveのタイトル（必須）"
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
            <select
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              {PERIOD_PRESETS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
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
      {displayObjectives.length === 0 ? (
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
            ? 'アーカイブされたObjectiveはありません'
            : 'Objectiveがありません。「新規Objective」から作成してください。'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {displayObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onSelect={onSelect}
              onArchive={showArchived ? undefined : onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
