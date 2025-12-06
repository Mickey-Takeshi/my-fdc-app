/**
 * app/_components/todo/HabitSlot.tsx
 *
 * Phase 13 WS-E: TodoBoardから分割
 * 習慣ブロック（松竹梅）のUI
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Package, Check } from 'lucide-react';
import type { Task, ElasticHabit, ElasticLevel } from '@/lib/types/todo';

// ========================================
// 型定義
// ========================================

export interface HabitSlotProps {
  suit: 'heart' | 'club';
  habits: ElasticHabit[];
  todayHabitTasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onCreateHabitTask?: (habit: ElasticHabit, level: ElasticLevel, startTime?: string) => void;
  onCreateUmeBlock?: (habits: ElasticHabit[], startTime?: string) => void;
  config: { color: string; ja: string };
}

// ========================================
// 定数
// ========================================

const HABIT_SELECTION_STORAGE_KEY = 'habit_selection_';

interface HabitSelection {
  habitId: string;
  habitTitle: string;
  level: ElasticLevel;
  startTime: string;
  date: string;
}

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00',
];

const LEVEL_COLORS = {
  heart: {
    ume:   { main: '#FFCDD2', bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' },
    take:  { main: '#EF5350', bg: '#FFCDD2', border: '#EF9A9A', text: '#C62828' },
    matsu: { main: '#C62828', bg: '#FFCDD2', border: '#E57373', text: '#B71C1C' },
  },
  club: {
    ume:   { main: '#BBDEFB', bg: '#E3F2FD', border: '#BBDEFB', text: '#1565C0' },
    take:  { main: '#42A5F5', bg: '#BBDEFB', border: '#90CAF9', text: '#1565C0' },
    matsu: { main: '#1565C0', bg: '#BBDEFB', border: '#64B5F6', text: '#0D47A1' },
  },
};

// ========================================
// ヘルパー関数
// ========================================

function getPreviousSelection(suit: 'heart' | 'club', level: ElasticLevel): HabitSelection | null {
  if (typeof window === 'undefined') return null;
  const key = `${HABIT_SELECTION_STORAGE_KEY}${suit}_${level}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as HabitSelection;
  } catch {
    return null;
  }
}

function saveSelection(suit: 'heart' | 'club', level: ElasticLevel, selection: HabitSelection) {
  if (typeof window === 'undefined') return;
  const key = `${HABIT_SELECTION_STORAGE_KEY}${suit}_${level}`;
  localStorage.setItem(key, JSON.stringify(selection));
}

// ========================================
// コンポーネント
// ========================================

export function HabitSlot({
  suit,
  habits,
  todayHabitTasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onCreateHabitTask,
  onCreateUmeBlock,
  config,
}: HabitSlotProps) {
  const [expandedLevel, setExpandedLevel] = useState<ElasticLevel | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 連打防止

  const levelColors = LEVEL_COLORS[suit];

  // 今日の習慣タスク（このスート）
  // Phase 14.9-V: elasticLevel も考慮（データ破損時の防御策）
  const suitHabitTasks = todayHabitTasks.filter(
    t => t.suit === suit && (t.isElasticHabit || t.elasticLevel)
  );

  const umeTasks = suitHabitTasks.filter(t => t.elasticLevel === 'ume');
  const takeTasks = suitHabitTasks.filter(t => t.elasticLevel === 'take');
  const matsuTasks = suitHabitTasks.filter(t => t.elasticLevel === 'matsu');

  const completedTasksCount = suitHabitTasks.filter(t => t.status === 'done').length;
  const totalTasksCount = suitHabitTasks.length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streakCount || 0), 0);

  const handleSelectClick = useCallback((level: ElasticLevel) => {
    if (expandedLevel === level) {
      setExpandedLevel(null);
      setSelectedHabitId('');
      setSelectedTime('');
    } else {
      setExpandedLevel(level);
      const prev = getPreviousSelection(suit, level);
      if (prev) {
        setSelectedHabitId(prev.habitId);
        setSelectedTime(prev.startTime);
      } else {
        setSelectedHabitId(habits[0]?.id || '');
        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
        setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      }
    }
  }, [expandedLevel, suit, habits]);

  const handleAddHabit = useCallback(async () => {
    if (!expandedLevel) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (expandedLevel === 'ume') {
        await onCreateUmeBlock?.(habits, selectedTime);
        const today = new Date().toISOString().split('T')[0];
        if (habits[0]) {
          saveSelection(suit, expandedLevel, {
            habitId: habits[0].id,
            habitTitle: habits[0].title,
            level: expandedLevel,
            startTime: selectedTime,
            date: today,
          });
        }
      } else {
        if (!selectedHabitId) {
          setIsSubmitting(false);
          return;
        }
        const habit = habits.find(h => h.id === selectedHabitId);
        if (!habit) {
          setIsSubmitting(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        saveSelection(suit, expandedLevel, {
          habitId: selectedHabitId,
          habitTitle: habit.title,
          level: expandedLevel,
          startTime: selectedTime,
          date: today,
        });

        await onCreateHabitTask?.(habit, expandedLevel, selectedTime);
      }

      setExpandedLevel(null);
      setSelectedHabitId('');
      setSelectedTime('');
    } finally {
      // 少し遅延してから解除（UI更新を待つ）
      setTimeout(() => setIsSubmitting(false), 500);
    }
  }, [expandedLevel, selectedHabitId, selectedTime, habits, suit, onCreateHabitTask, onCreateUmeBlock, isSubmitting]);

  const renderTaskItem = (task: Task) => {
    const isDone = task.status === 'done';
    const is3HabitBlock = task.linkedUmeHabits && task.linkedUmeHabits.length > 0;

    return (
      <div
        key={task.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          padding: '4px 8px',
          background: isDone ? '#e8f5e9' : (is3HabitBlock ? '#fff8e1' : 'white'),
          borderRadius: '4px',
          border: is3HabitBlock ? '1px solid #ffe082' : '1px solid #e0e0e0',
        }}
      >
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onTaskComplete?.(task.id)}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        />
        {is3HabitBlock && (
          <span style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center' }} title="3習慣セット">
            <Package size={12} />
          </span>
        )}
        <span
          onClick={() => onTaskClick?.(task)}
          style={{
            flex: 1,
            cursor: 'pointer',
            color: isDone ? '#2e7d32' : 'var(--text-medium)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
          title="クリックして編集"
        >
          {task.title.replace(/（梅）|（竹）|（松）/, '')}
          {task.startAt && <span style={{ marginLeft: '4px', color: 'var(--text-light)' }}>@{task.startAt}</span>}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('この習慣タスクを削除しますか？')) {
              onTaskDelete?.(task.id);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            flexShrink: 0,
          }}
          title="削除"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    );
  };

  const renderSelectionUI = (level: ElasticLevel, levelColor: string) => {
    if (expandedLevel !== level) return null;
    const isUme = level === 'ume';

    return (
      <div
        style={{
          marginTop: '8px',
          padding: '12px',
          background: 'white',
          borderRadius: '8px',
          border: `2px solid ${levelColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {isUme ? (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-medium)' }}>
              3習慣セット（5分×3 = 15分ブロック）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {habits.map(habit => (
                <div
                  key={habit.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    background: `${levelColor}10`,
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: levelColor, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                    <Check size={14} />
                  </span>
                  <span>{habit.title}</span>
                  <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>
                    {habit.levels.ume.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-medium)' }}>
              習慣を選択
            </label>
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '12px',
                background: 'white',
              }}
            >
              {habits.map(habit => (
                <option key={habit.id} value={habit.id}>
                  {habit.title} - {habit.levels[level].label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-medium)' }}>
            開始時間
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              fontSize: '12px',
              background: 'white',
            }}
          >
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddHabit}
            disabled={isSubmitting || (!isUme && !selectedHabitId)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: isSubmitting ? '#9e9e9e' : levelColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isSubmitting ? 'wait' : ((isUme || selectedHabitId) ? 'pointer' : 'not-allowed'),
              opacity: isSubmitting ? 0.7 : ((isUme || selectedHabitId) ? 1 : 0.5),
            }}
          >
            {isSubmitting ? '追加中...' : (isUme ? '3習慣を追加' : '追加')}
          </button>
          <button
            onClick={() => setExpandedLevel(null)}
            style={{
              padding: '8px 12px',
              background: '#f5f5f5',
              color: 'var(--text-medium)',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    );
  };

  const renderLevelBlock = (
    level: ElasticLevel,
    tasks: Task[],
    levelLabel: string,
    levelColor: string,
    bgColor: string,
    borderColor: string
  ) => {
    const isExpanded = expandedLevel === level;

    return (
      <div
        style={{
          padding: '10px',
          background: isExpanded ? `${levelColor}08` : (tasks.length > 0 ? bgColor : 'white'),
          borderRadius: '8px',
          border: `1px solid ${isExpanded ? levelColor : (tasks.length > 0 ? borderColor : '#e0e0e0')}`,
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tasks.length > 0 || isExpanded ? '6px' : 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: levelColor }}>
            {levelLabel}
          </span>
          <button
            onClick={() => handleSelectClick(level)}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              background: isExpanded ? 'white' : levelColor,
              color: isExpanded ? levelColor : 'white',
              border: isExpanded ? `1px solid ${levelColor}` : 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isExpanded ? '閉じる' : '選択'}
          </button>
        </div>
        {tasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tasks.map(renderTaskItem)}
          </div>
        )}
        {renderSelectionUI(level, levelColor)}
      </div>
    );
  };

  return (
    <div
      style={{
        background: `${config.color}05`,
        borderRadius: '10px',
        padding: '12px',
        border: `1px solid ${config.color}15`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: config.color }}>
            習慣ブロック
          </span>
          {maxStreak > 0 && (
            <span style={{ fontSize: '10px', color: '#e65100', background: '#fff3e0', padding: '2px 6px', borderRadius: '8px' }}>
              {maxStreak}日連続
            </span>
          )}
        </div>
        {totalTasksCount > 0 && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              background: completedTasksCount === totalTasksCount ? '#e8f5e9' : `${config.color}10`,
              color: completedTasksCount === totalTasksCount ? '#2e7d32' : config.color,
              borderRadius: '10px',
              fontWeight: 500,
            }}
          >
            {completedTasksCount}/{totalTasksCount} 完了
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {renderLevelBlock('ume', umeTasks, '梅（5分未満）', levelColors.ume.text, levelColors.ume.bg, levelColors.ume.border)}
        {renderLevelBlock('take', takeTasks, '竹（15分）', levelColors.take.text, levelColors.take.bg, levelColors.take.border)}
        {renderLevelBlock('matsu', matsuTasks, '松（30分）', levelColors.matsu.text, levelColors.matsu.bg, levelColors.matsu.border)}
      </div>

      {habits.length === 0 && (
        <p style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', margin: '8px 0 0' }}>
          習慣タブで習慣を追加してください
        </p>
      )}
    </div>
  );
}

export default HabitSlot;
