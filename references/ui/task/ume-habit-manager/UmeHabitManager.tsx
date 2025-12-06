/**
 * app/_components/todo/ume-habit-manager/UmeHabitManager.tsx
 *
 * Phase 10-E: 梅習慣マスタ管理UI（メインコンポーネント）
 *
 * 【機能】
 * - 5分単位の梅習慣マスタの CRUD
 * - ストリーク表示
 * - 今日のタスクへの追加
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Timer } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { SuitIcon } from './SuitIcon';
import { HabitFormModal } from './HabitFormModal';
import { UmeHabitCard } from './UmeHabitCard';
import type { UmeHabitManagerProps, HabitFormData } from './types';
import { DEFAULT_FORM_DATA } from './types';
import type { UmeHabit } from '@/lib/types/todo';

export function UmeHabitManager({
  umeHabits,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  onCompleteHabit,
  onAddToTask,
}: UmeHabitManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<UmeHabit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>(DEFAULT_FORM_DATA);

  // ♥ と ♣ でグループ分け
  const heartHabits = umeHabits.filter((h) => h.suit === 'heart');
  const clubHabits = umeHabits.filter((h) => h.suit === 'club');

  const openCreateForm = useCallback(() => {
    setEditingHabit(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((habit: UmeHabit) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || '',
      suit: habit.suit,
    });
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingHabit(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsFormOpen(false);
  }, []);

  const updateFormData = useCallback(
    <K extends keyof HabitFormData>(key: K, value: HabitFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const submitForm = useCallback(async () => {
    if (!formData.title.trim()) {
      alert('習慣名を入力してください');
      return;
    }

    if (editingHabit) {
      await onUpdateHabit(editingHabit.id, {
        title: formData.title,
        description: formData.description || undefined,
        suit: formData.suit,
      });
    } else {
      await onCreateHabit({
        title: formData.title,
        description: formData.description || undefined,
        suit: formData.suit,
      });
    }

    closeForm();
  }, [formData, editingHabit, onCreateHabit, onUpdateHabit, closeForm]);

  return (
    <div
      style={{
        background: 'var(--bg-gray)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Timer size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
            梅習慣（5分）
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-light)',
              background: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {umeHabits.length}件
          </span>
        </div>

        <button
          onClick={openCreateForm}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <Plus size={14} />
          追加
        </button>
      </div>

      {/* 説明 */}
      <div
        style={{
          background: '#E3F2FD',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#1565C0',
        }}
      >
        5分の梅習慣を3つ組み合わせて15分タスクブロックを作成できます
      </div>

      {/* 習慣が0件の場合 */}
      {umeHabits.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px',
            color: 'var(--text-light)',
          }}
        >
          <Timer size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>
            まだ梅習慣がありません
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
            「追加」ボタンから作成してください
          </p>
        </div>
      ) : (
        <>
          {/* ♥ 重要なこと */}
          {heartHabits.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: SUIT_CONFIG.heart.color,
                }}
              >
                <SuitIcon suit="heart" size={14} />
                重要なこと
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {heartHabits.map((habit) => (
                  <UmeHabitCard
                    key={habit.id}
                    habit={habit}
                    onEdit={() => openEditForm(habit)}
                    onDelete={() => onDeleteHabit(habit.id)}
                    onComplete={() => onCompleteHabit(habit.id)}
                    onAddToTask={onAddToTask ? () => onAddToTask(habit) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ♣ 未来創造20%タイム */}
          {clubHabits.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: SUIT_CONFIG.club.color,
                }}
              >
                <SuitIcon suit="club" size={14} />
                未来創造20%タイム
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clubHabits.map((habit) => (
                  <UmeHabitCard
                    key={habit.id}
                    habit={habit}
                    onEdit={() => openEditForm(habit)}
                    onDelete={() => onDeleteHabit(habit.id)}
                    onComplete={() => onCompleteHabit(habit.id)}
                    onAddToTask={onAddToTask ? () => onAddToTask(habit) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* フォームモーダル */}
      <HabitFormModal
        isOpen={isFormOpen}
        isEditing={!!editingHabit}
        formData={formData}
        onClose={closeForm}
        onSubmit={submitForm}
        onUpdateField={updateFormData}
      />
    </div>
  );
}

export default UmeHabitManager;
