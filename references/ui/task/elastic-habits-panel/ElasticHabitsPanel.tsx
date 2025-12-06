/**
 * app/_components/todo/elastic-habits-panel/ElasticHabitsPanel.tsx
 *
 * Phase 10: Elastic Habits（松竹梅）パネル（メインコンポーネント）
 *
 * 【機能】
 * - ♥ ハート（重要なこと）: 読書・運動・瞑想
 * - ♣ クラブ（未来創造20%タイム）: 趣味・興味・チャレンジ
 * - 梅(5分)・竹(15分)・松(30分)の具体内容を編集可能
 * - 梅を3つ選んで15分ブロックを作成
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { SuitIcon } from './SuitIcon';
import { HabitCard } from './HabitCard';
import { HabitEditModal } from './HabitEditModal';
import type { ElasticHabitsPanelProps, DateSelection } from './types';
import type { ElasticHabit } from '@/lib/types/todo';

export function ElasticHabitsPanel({
  elasticHabits,
  onCreateTask,
  onUpdateHabit,
  // 将来的な習慣マスタ管理機能で使用予定
  onCreateHabit: _onCreateHabit,
  onDeleteHabit: _onDeleteHabit,
  onCreateUmeBlock: _onCreateUmeBlock,
  selectionMode,
  selectedDate = 'today',
}: ElasticHabitsPanelProps) {
  const [editingHabit, setEditingHabit] = useState<ElasticHabit | null>(null);

  // ♥ハートと♣クラブに分類
  const heartHabits = elasticHabits.filter((h) => h.suit === 'heart');
  const clubHabits = elasticHabits.filter((h) => h.suit === 'club');

  // 日付関連のヘルパー
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  const getDateWithOffset = (offset: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
  };

  const getActualDate = (selection: DateSelection): Date => {
    switch (selection) {
      case 'yesterday': return getDateWithOffset(-1);
      case 'today': return getDateWithOffset(0);
      case 'tomorrow': return getDateWithOffset(1);
    }
  };

  const formatDateWithWeekday = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = WEEKDAYS[date.getDay()];
    return `${month}月${day}日（${weekday}）`;
  };

  const getDateLabel = (selection: DateSelection): string => {
    switch (selection) {
      case 'yesterday': return '昨日';
      case 'today': return '今日';
      case 'tomorrow': return '明日';
    }
  };

  // 選択モードのレベル名
  const levelNames = { ume: '梅', take: '竹', matsu: '松' };

  const handleSaveHabit = useCallback(
    async (updates: Partial<ElasticHabit>) => {
      if (editingHabit) {
        await onUpdateHabit(editingHabit.id, updates);
      }
    },
    [editingHabit, onUpdateHabit]
  );

  return (
    <div
      style={{
        background: 'var(--bg-gray)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      {/* 選択モードバナー */}
      {selectionMode?.active && (
        <div
          style={{
            background: SUIT_CONFIG[selectionMode.suit].color,
            color: 'white',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <SuitIcon suit={selectionMode.suit} size={24} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
              {selectionMode.suit === 'heart' ? '♥ ハート' : '♣ クラブ'}の習慣を選択中
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.9 }}>
              {levelNames[selectionMode.level]}レベルの習慣を選んでください
            </p>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {getDateLabel(selectedDate)}の習慣
        </h3>
        {/* 実際の日付を表示 */}
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-dark)',
          }}
        >
          {formatDateWithWeekday(getActualDate(selectedDate))}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-light)', marginLeft: 'auto' }}>
          梅・竹・松を選んでスタート
        </span>
      </div>

      {/* 説明 */}
      <div
        style={{
          background: '#E0F7FA',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--primary-dark)',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Elastic Habits</strong>: やる気がない日は「梅」(5分未満)、
          普通の日は「竹」(15分)、やる気がある日は「松」(30分)！
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
          梅を3つ組み合わせれば15分ブロックになります
        </p>
      </div>

      {/* ♥ ハート（重要） */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <SuitIcon suit="heart" size={20} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: SUIT_CONFIG.heart.color }}>
            重要
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            予定に入れ実行
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {heartHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onSelectLevel={(level) => onCreateTask(habit, level)}
              onEdit={() => setEditingHabit(habit)}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      </div>

      {/* ♣ クラブ（未来創造20%タイム） */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <SuitIcon suit="club" size={20} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: SUIT_CONFIG.club.color }}>
            未来創造20%タイム
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            そのまま
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clubHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onSelectLevel={(level) => onCreateTask(habit, level)}
              onEdit={() => setEditingHabit(habit)}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      </div>

      {/* 編集モーダル */}
      {editingHabit && (
        <HabitEditModal
          habit={editingHabit}
          isOpen={!!editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveHabit}
        />
      )}
    </div>
  );
}

export default ElasticHabitsPanel;
