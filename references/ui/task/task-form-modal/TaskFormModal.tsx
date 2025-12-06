/**
 * app/_components/todo/task-form-modal/TaskFormModal.tsx
 *
 * Phase 10-B: タスク追加/編集モーダル（メインコンポーネント）
 *
 * 【機能】
 * - タスクの新規作成・編集
 * - 推奨時間サジェスト表示
 * - Elastic Habits 設定
 */

'use client';

import React, { useMemo, useState } from 'react';
import { X, Clock, CalendarPlus } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import type { UmeHabit, LinkedUmeHabit } from '@/lib/types/todo';
import { SuitSelector } from './SuitSelector';
import { DurationSelector } from './DurationSelector';
import { ElasticHabitSelector } from './ElasticHabitSelector';
import { UmeHabitSelector } from './UmeHabitSelector';
import type { TaskFormModalProps, DurationSuggestion } from './types';

export function TaskFormModal({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onUpdateField,
  getDurationSuggestion,
  umeHabits = [],
}: TaskFormModalProps) {
  // Phase 10-E: 梅習慣セレクタの開閉状態
  const [showUmeSelector, setShowUmeSelector] = useState(false);

  // タイトル変更時に推奨時間を計算（useMemo で派生状態として扱う）
  const suggestion = useMemo((): DurationSuggestion | null => {
    if (getDurationSuggestion && formData.title.length >= 2) {
      return getDurationSuggestion(formData.title);
    }
    return null;
  }, [formData.title, getDurationSuggestion]);

  // Phase 10-E: 梅習慣のトグル選択
  const toggleUmeHabit = (habit: UmeHabit) => {
    const currentLinked = formData.linkedUmeHabits || [];
    const isLinked = currentLinked.some(lh => lh.habitId === habit.id);

    if (isLinked) {
      // 解除
      onUpdateField('linkedUmeHabits', currentLinked.filter(lh => lh.habitId !== habit.id));
    } else {
      // 追加（最大3つまで）
      if (currentLinked.length >= 3) {
        alert('梅習慣は最大3つまで選択できます');
        return;
      }
      const newLinked: LinkedUmeHabit = {
        habitId: habit.id,
        title: habit.title,
        completed: false,
      };
      onUpdateField('linkedUmeHabits', [...currentLinked, newLinked]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const applySuggestion = () => {
    if (suggestion) {
      onUpdateField('durationMinutes', suggestion.suggestedMinutes);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          margin: '16px',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {isEditing ? 'タスクを編集' : '新しいタスク'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} color="var(--text-light)" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* タスク名 */}
            <div>
              <label
                htmlFor="task-title"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                タスク名 <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={formData.title}
                onChange={(e) => onUpdateField('title', e.target.value)}
                placeholder="タスク名を入力"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                autoFocus
              />
            </div>

            {/* 4象限選択 */}
            <SuitSelector
              selectedSuit={formData.suit}
              onSelectSuit={(suit) => onUpdateField('suit', suit)}
            />

            {/* 時間設定 */}
            <DurationSelector
              durationMinutes={formData.durationMinutes}
              suggestion={suggestion}
              onSelectDuration={(minutes) => onUpdateField('durationMinutes', minutes)}
              onApplySuggestion={applySuggestion}
            />

            {/* 開始時間 */}
            <div>
              <label
                htmlFor="task-start"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                開始時間（オプション）
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--text-light)' }} />
                <input
                  id="task-start"
                  type="time"
                  value={formData.startAt}
                  onChange={(e) => onUpdateField('startAt', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Googleカレンダー同期（新規作成時のみ、開始時間と所要時間が設定されている場合） */}
            {!isEditing && formData.startAt && formData.durationMinutes && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#E8F5E9',
                  borderRadius: '12px',
                  border: '1px solid #A5D6A7',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.syncToCalendar}
                    onChange={(e) => onUpdateField('syncToCalendar', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <CalendarPlus size={18} color="#2E7D32" />
                  <span style={{ fontWeight: 500, color: '#2E7D32' }}>
                    Googleカレンダーに予定を作成
                  </span>
                </label>
                {formData.syncToCalendar && (
                  <p style={{ margin: '8px 0 0 28px', fontSize: '12px', color: '#558B2F' }}>
                    タスク作成時に「{formData.suit ? SUIT_CONFIG[formData.suit].symbol : '🃏'} {formData.title || 'タスク名'}」として予定を登録します
                  </p>
                )}
              </div>
            )}

            {/* Elastic Habits */}
            <ElasticHabitSelector
              isElasticHabit={formData.isElasticHabit}
              elasticLevel={formData.elasticLevel}
              onToggleElastic={(enabled) => onUpdateField('isElasticHabit', enabled)}
              onSelectLevel={(level) => onUpdateField('elasticLevel', level)}
              onSetDuration={(minutes) => onUpdateField('durationMinutes', minutes)}
            />

            {/* Phase 10-E: 梅習慣選択 */}
            {umeHabits.length > 0 && (
              <UmeHabitSelector
                umeHabits={umeHabits}
                linkedUmeHabits={formData.linkedUmeHabits || []}
                showSelector={showUmeSelector}
                onToggleSelector={() => setShowUmeSelector(!showUmeSelector)}
                onToggleHabit={toggleUmeHabit}
                onRemoveHabit={(habitId) => {
                  const updated = (formData.linkedUmeHabits || []).filter(
                    h => h.habitId !== habitId
                  );
                  onUpdateField('linkedUmeHabits', updated);
                }}
              />
            )}

            {/* 説明 */}
            <div>
              <label
                htmlFor="task-description"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                メモ（オプション）
              </label>
              <textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => onUpdateField('description', e.target.value)}
                placeholder="メモを入力"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-gray)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskFormModal;
