/**
 * app/_components/todo/elastic-habits-panel/types.ts
 *
 * ElasticHabitsPanel の型定義
 */

import type { ElasticLevel, ElasticHabit } from '@/lib/types/todo';

// 選択モードの状態
export interface SelectionModeState {
  active: boolean;
  suit: 'heart' | 'club';
  level: 'ume' | 'take' | 'matsu';
}

// 日付選択
export type DateSelection = 'yesterday' | 'today' | 'tomorrow';

export interface ElasticHabitsPanelProps {
  elasticHabits: ElasticHabit[];
  onCreateTask: (habit: ElasticHabit, level: ElasticLevel) => void;
  onUpdateHabit: (habitId: string, updates: Partial<ElasticHabit>) => Promise<void>;
  onCreateHabit: (habit: ElasticHabit) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  // 梅を複数選んで15分ブロック作成
  onCreateUmeBlock?: (habits: { habit: ElasticHabit; count: number }[]) => void;
  // 4象限から呼ばれた選択モード
  selectionMode?: SelectionModeState | null;
  // 選択された日付
  selectedDate?: DateSelection;
}

export interface HabitEditModalProps {
  habit: ElasticHabit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ElasticHabit>) => void;
}

export interface HabitCardProps {
  habit: ElasticHabit;
  onSelectLevel: (level: ElasticLevel) => void;
  onEdit: () => void;
  // 選択モード時のフィルタリング
  selectionMode?: SelectionModeState | null;
}
