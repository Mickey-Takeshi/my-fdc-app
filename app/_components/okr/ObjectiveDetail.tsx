/**
 * app/_components/okr/ObjectiveDetail.tsx
 *
 * Phase 11: Objective詳細ビューコンポーネント
 */

'use client';

import { useState } from 'react';
import { KeyResultRow } from './KeyResultRow';
import { UNIT_PRESETS } from '@/lib/types/okr';
import type { Objective, KeyResult } from '@/lib/types/okr';

interface ObjectiveDetailProps {
  objective: Objective & { keyResults: KeyResult[] };
  onBack: () => void;
  onUpdateKR: (krId: string, updates: Partial<KeyResult>) => Promise<void>;
  onDeleteKR: (krId: string) => Promise<void>;
  onCreateKR: (title: string, targetValue: number, unit: string) => Promise<void>;
  onUpdateObjective: (updates: Partial<Objective>) => Promise<void>;
  onDeleteObjective: () => Promise<void>;
}

export function ObjectiveDetail({
  objective,
  onBack,
  onUpdateKR,
  onDeleteKR,
  onCreateKR,
  onUpdateObjective,
  onDeleteObjective,
}: ObjectiveDetailProps) {
  const [isAddingKR, setIsAddingKR] = useState(false);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState('100');
  const [newKRUnit, setNewKRUnit] = useState('%');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(objective.title);

  const progress = objective.progress ?? 0;
  const keyResults = objective.keyResults || [];

  const handleAddKR = async () => {
    if (!newKRTitle.trim()) return;
    const target = parseFloat(newKRTarget);
    if (isNaN(target) || target <= 0) return;

    await onCreateKR(newKRTitle.trim(), target, newKRUnit);
    setNewKRTitle('');
    setNewKRTarget('100');
    setNewKRUnit('%');
    setIsAddingKR(false);
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== objective.title) {
      await onUpdateObjective({ title: editTitle.trim() });
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
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              {objective.period}
            </span>
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setEditTitle(objective.title);
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
                  maxWidth: '500px',
                  display: 'block',
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{ margin: 0, cursor: 'pointer' }}
              >
                {objective.title}
              </h1>
            )}
            {objective.description && (
              <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
                {objective.description}
              </p>
            )}
          </div>

          <button
            onClick={onDeleteObjective}
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
            <span>Objective 進捗</span>
            <span style={{ fontWeight: 600, fontSize: '20px' }}>{progress}%</span>
          </div>
          <div
            style={{
              height: '12px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress >= 70 ? 'var(--success)' : progress >= 30 ? 'var(--warning)' : 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Key Results一覧 */}
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
            Key Results ({keyResults.length})
          </h2>
          <button
            onClick={() => setIsAddingKR(true)}
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
            + KR追加
          </button>
        </div>

        {/* 新規追加フォーム */}
        {isAddingKR && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              value={newKRTitle}
              onChange={(e) => setNewKRTitle(e.target.value)}
              placeholder="Key Resultのタイトル"
              autoFocus
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKR();
                if (e.key === 'Escape') setIsAddingKR(false);
              }}
            />
            <input
              type="number"
              value={newKRTarget}
              onChange={(e) => setNewKRTarget(e.target.value)}
              placeholder="目標値"
              style={{
                width: '100px',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            />
            <select
              value={newKRUnit}
              onChange={(e) => setNewKRUnit(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              {UNIT_PRESETS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddKR}
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
              onClick={() => setIsAddingKR(false)}
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

        {/* KR一覧 */}
        {keyResults.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-light)',
            }}
          >
            Key Resultsがありません。「+ KR追加」から追加してください。
          </div>
        ) : (
          keyResults.map((kr) => (
            <KeyResultRow
              key={kr.id}
              kr={kr}
              onUpdate={(krId, updates) => onUpdateKR(krId, updates)}
              onDelete={onDeleteKR}
            />
          ))
        )}
      </div>
    </div>
  );
}
