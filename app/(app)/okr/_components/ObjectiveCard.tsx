'use client';

/**
 * app/(app)/okr/_components/ObjectiveCard.tsx
 *
 * Objective カード（Phase 11）
 * 進捗バー + KeyResult リスト + ActionMap 紐付け表示
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Link2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import type { Objective, KeyResult } from '@/lib/types/okr';
import type { ActionMap } from '@/lib/types/action-map';

interface ObjectiveCardProps {
  objective: Objective;
  actionMaps: ActionMap[];
  onAddKr: (objectiveId: string, data: {
    title: string;
    target_value: number;
    unit: string;
  }) => Promise<boolean>;
  onUpdateKr: (krId: string, data: Record<string, string | number>) => Promise<boolean>;
  onDeleteKr: (krId: string) => Promise<boolean>;
  onLinkActionMap: (actionMapId: string, keyResultId: string | null) => Promise<boolean>;
  onDeleteObjective: (objId: string) => Promise<boolean>;
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 70
    ? 'var(--success, #10b981)'
    : value >= 40
      ? 'var(--primary)'
      : 'var(--text-muted)';

  return (
    <div className="okr-progress-bar">
      <div
        className="okr-progress-fill"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

function KeyResultItem({
  kr,
  actionMaps,
  onUpdate,
  onDelete,
  onLinkActionMap,
}: {
  kr: KeyResult;
  actionMaps: ActionMap[];
  onUpdate: (krId: string, data: Record<string, string | number>) => Promise<boolean>;
  onDelete: (krId: string) => Promise<boolean>;
  onLinkActionMap: (actionMapId: string, keyResultId: string | null) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(kr.currentValue));
  const [showLinkSelector, setShowLinkSelector] = useState(false);

  const progress = kr.progressRate ?? 0;

  // この KR に紐付いている ActionMaps
  const linkedMaps = actionMaps.filter((m) => m.keyResultId === kr.id);
  // 未紐付けの ActionMaps
  const unlinkedMaps = actionMaps.filter((m) => !m.keyResultId);

  const handleSaveValue = async () => {
    const numValue = parseFloat(currentValue);
    if (isNaN(numValue) || numValue < 0) return;

    await onUpdate(kr.id, { current_value: numValue });
    setEditing(false);
  };

  return (
    <div className="okr-kr-item">
      <div className="okr-kr-row">
        <div className="okr-kr-icon">
          <Target size={14} />
        </div>

        <div className="okr-kr-info">
          <div className="okr-kr-title">{kr.title}</div>
          <div className="okr-kr-progress-row">
            <ProgressBar value={progress} />
            <span className="okr-kr-progress-text">{progress}%</span>
          </div>
          <div className="okr-kr-values">
            {editing ? (
              <span className="okr-kr-edit-inline">
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveValue();
                    if (e.key === 'Escape') { setEditing(false); setCurrentValue(String(kr.currentValue)); }
                  }}
                  autoFocus
                  min={0}
                  style={{ width: '80px', fontSize: '12px', padding: '2px 6px' }}
                />
                <button className="okr-kr-action-btn" onClick={handleSaveValue} title="保存">
                  <Check size={12} />
                </button>
                <button
                  className="okr-kr-action-btn"
                  onClick={() => { setEditing(false); setCurrentValue(String(kr.currentValue)); }}
                  title="取消"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <span
                className="okr-kr-value-display"
                onClick={() => setEditing(true)}
                title="クリックして編集"
              >
                {kr.currentValue} / {kr.targetValue} {kr.unit}
                <Edit3 size={10} style={{ marginLeft: 4, opacity: 0.5 }} />
              </span>
            )}
          </div>
        </div>

        <div className="okr-kr-actions">
          <button
            className="okr-kr-action-btn"
            onClick={() => setShowLinkSelector(!showLinkSelector)}
            title="Action Map を紐付け"
          >
            <Link2 size={14} />
          </button>
          <button
            className="okr-kr-action-btn okr-kr-delete-btn"
            onClick={() => onDelete(kr.id)}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 紐付き ActionMap 表示 */}
      {linkedMaps.length > 0 && (
        <div className="okr-kr-linked-maps">
          {linkedMaps.map((m) => (
            <div key={m.id} className="okr-linked-map-tag">
              <TrendingUp size={10} />
              <span>{m.title}</span>
              <span className="okr-linked-map-progress">{m.progressRate ?? 0}%</span>
              <button
                className="okr-linked-map-unlink"
                onClick={() => onLinkActionMap(m.id, null)}
                title="紐付け解除"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ActionMap 紐付けセレクター */}
      {showLinkSelector && unlinkedMaps.length > 0 && (
        <div className="okr-kr-link-selector">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLinkActionMap(e.target.value, kr.id);
                setShowLinkSelector(false);
              }
            }}
            defaultValue=""
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            <option value="">Action Map を選択...</option>
            {unlinkedMaps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {showLinkSelector && unlinkedMaps.length === 0 && (
        <div className="okr-kr-link-selector">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            紐付け可能な Action Map がありません
          </span>
        </div>
      )}
    </div>
  );
}

export default function ObjectiveCard({
  objective,
  actionMaps,
  onAddKr,
  onUpdateKr,
  onDeleteKr,
  onLinkActionMap,
  onDeleteObjective,
}: ObjectiveCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddKr, setShowAddKr] = useState(false);
  const [newKrTitle, setNewKrTitle] = useState('');
  const [newKrTarget, setNewKrTarget] = useState('100');
  const [newKrUnit, setNewKrUnit] = useState('%');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const keyResults = objective.keyResults ?? [];
  const progress = objective.progressRate ?? 0;

  const handleAddKr = async () => {
    if (!newKrTitle.trim()) return;

    const targetValue = parseFloat(newKrTarget);
    if (isNaN(targetValue) || targetValue <= 0) return;

    setIsSubmitting(true);
    const success = await onAddKr(objective.id, {
      title: newKrTitle.trim(),
      target_value: targetValue,
      unit: newKrUnit.trim() || '%',
    });

    if (success) {
      setNewKrTitle('');
      setNewKrTarget('100');
      setNewKrUnit('%');
      setShowAddKr(false);
    }
    setIsSubmitting(false);
  };

  const progressColor = progress >= 70
    ? 'var(--success, #10b981)'
    : progress >= 40
      ? 'var(--primary)'
      : 'var(--text-muted)';

  return (
    <div className="okr-objective-card">
      {/* Header */}
      <div className="okr-objective-header" onClick={() => setExpanded(!expanded)}>
        <div className="okr-objective-expand">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        <div className="okr-objective-info">
          <h3 className="okr-objective-title">{objective.title}</h3>
          {objective.description && (
            <p className="okr-objective-desc">{objective.description}</p>
          )}
          <div className="okr-objective-meta">
            <span className="okr-objective-period">{objective.period}</span>
            <span className="okr-objective-kr-count">
              KR: {keyResults.length}
            </span>
          </div>
        </div>
        <div className="okr-objective-progress">
          <span className="okr-objective-progress-value" style={{ color: progressColor }}>
            {progress}%
          </span>
          <div className="okr-progress-bar okr-progress-bar-lg">
            <div
              className="okr-progress-fill"
              style={{ width: `${Math.min(progress, 100)}%`, background: progressColor }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="okr-objective-body">
          {/* Key Results List */}
          {keyResults.length === 0 ? (
            <div className="okr-empty-kr">
              Key Result がありません
            </div>
          ) : (
            <div className="okr-kr-list">
              {keyResults.map((kr) => (
                <KeyResultItem
                  key={kr.id}
                  kr={kr}
                  actionMaps={actionMaps}
                  onUpdate={onUpdateKr}
                  onDelete={onDeleteKr}
                  onLinkActionMap={onLinkActionMap}
                />
              ))}
            </div>
          )}

          {/* Add Key Result */}
          {showAddKr ? (
            <div className="okr-add-kr-form">
              <input
                type="text"
                value={newKrTitle}
                onChange={(e) => setNewKrTitle(e.target.value)}
                placeholder="Key Result のタイトル..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddKr();
                  if (e.key === 'Escape') setShowAddKr(false);
                }}
                autoFocus
                style={{ flex: 1, fontSize: '13px', padding: '6px 10px' }}
              />
              <input
                type="number"
                value={newKrTarget}
                onChange={(e) => setNewKrTarget(e.target.value)}
                placeholder="目標値"
                min={1}
                style={{ width: '70px', fontSize: '13px', padding: '6px 10px' }}
              />
              <input
                type="text"
                value={newKrUnit}
                onChange={(e) => setNewKrUnit(e.target.value)}
                placeholder="単位"
                style={{ width: '50px', fontSize: '13px', padding: '6px 10px' }}
              />
              <button
                className="btn btn-primary btn-small"
                onClick={handleAddKr}
                disabled={isSubmitting || !newKrTitle.trim()}
              >
                追加
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => { setShowAddKr(false); setNewKrTitle(''); }}
              >
                取消
              </button>
            </div>
          ) : (
            <div className="okr-objective-footer">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowAddKr(true)}
              >
                <Plus size={14} />
                Key Result を追加
              </button>
              <button
                className="okr-objective-delete-btn"
                onClick={() => {
                  if (confirm('この Objective を削除しますか？')) {
                    onDeleteObjective(objective.id);
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
}
