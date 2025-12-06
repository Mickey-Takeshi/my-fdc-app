/**
 * app/_components/todo/ume-habit-manager/types.ts
 *
 * UmeHabitManager の型定義
 */

import type { UmeHabit } from '@/lib/types/todo';

export interface UmeHabitManagerProps {
  umeHabits: UmeHabit[];
  onCreateHabit: (data: Partial<UmeHabit>) => Promise<UmeHabit>;
  onUpdateHabit: (habitId: string, updates: Partial<UmeHabit>) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onCompleteHabit: (habitId: string) => Promise<void>;
  onAddToTask?: (habit: UmeHabit) => void;
}

export interface HabitFormData {
  title: string;
  description: string;
  suit: 'heart' | 'club';
}

export const DEFAULT_FORM_DATA: HabitFormData = {
  title: '',
  description: '',
  suit: 'heart',
};

export interface HabitFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: HabitFormData;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateField: <K extends keyof HabitFormData>(key: K, value: HabitFormData[K]) => void;
}

export interface UmeHabitCardProps {
  habit: UmeHabit;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onAddToTask?: () => void;
}
