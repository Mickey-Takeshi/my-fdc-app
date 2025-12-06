/**
 * app/_components/todo/task-form-modal/UmeHabitSelector.tsx
 *
 * 梅習慣選択コンポーネント（Phase 10-E）
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Check, Timer, Flame, X } from 'lucide-react';
import type { UmeHabit, LinkedUmeHabit } from '@/lib/types/todo';

interface UmeHabitSelectorProps {
  umeHabits: UmeHabit[];
  linkedUmeHabits: LinkedUmeHabit[];
  showSelector: boolean;
  onToggleSelector: () => void;
  onToggleHabit: (habit: UmeHabit) => void;
  onRemoveHabit: (habitId: string) => void;
}

export function UmeHabitSelector({
  umeHabits,
  linkedUmeHabits,
  showSelector,
  onToggleSelector,
  onToggleHabit,
  onRemoveHabit,
}: UmeHabitSelectorProps) {
  const selectedUmeDuration = linkedUmeHabits.length * 5;

  return (
    <div
      style={{
        padding: '16px',
        background: '#E3F2FD',
        borderRadius: '12px',
        border: '1px solid #90CAF9',
      }}
    >
      <button
        type="button"
        onClick={onToggleSelector}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: '#1565C0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Timer size={18} color="#1565C0" />
          <span>梅習慣を紐付け（5分×最大3つ）</span>
          {linkedUmeHabits.length > 0 && (
            <span
              style={{
                background: '#1565C0',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              {linkedUmeHabits.length}件選択中 ({selectedUmeDuration}分)
            </span>
          )}
        </div>
        {showSelector ? <ChevronUp size={18} color="#1565C0" /> : <ChevronDown size={18} color="#1565C0" />}
      </button>

      {showSelector && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {umeHabits.map((habit) => {
              const isSelected = linkedUmeHabits.some(
                lh => lh.habitId === habit.id
              );
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => onToggleHabit(habit)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: isSelected
                      ? '2px solid #1565C0'
                      : '1px solid #BBDEFB',
                    borderRadius: '8px',
                    background: isSelected ? 'white' : '#E3F2FD',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isSelected
                        ? '2px solid #1565C0'
                        : '2px solid #90CAF9',
                      background: isSelected ? '#1565C0' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={14} color="white" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: '13px',
                        color: '#1565C0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {habit.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#64B5F6',
                      }}
                    >
                      <span>5分</span>
                      {habit.streakCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#FF8F00' }}>
                          <Flame size={10} color="#FF8F00" />
                          {habit.streakCount}日
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {linkedUmeHabits.length > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1565C0',
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                選択中の梅習慣:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {linkedUmeHabits.map((lh) => (
                  <span
                    key={lh.habitId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#E3F2FD',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  >
                    {lh.title}（5分）
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveHabit(lh.habitId);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '2px',
                        color: '#90CAF9',
                      }}
                    >
                      <X size={12} color="#90CAF9" />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#64B5F6' }}>
                合計: {selectedUmeDuration}分
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
