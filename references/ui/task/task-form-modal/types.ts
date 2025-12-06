/**
 * app/_components/todo/task-form-modal/types.ts
 *
 * TaskFormModal の型定義
 */

import type { UmeHabit } from '@/lib/types/todo';
import type { TaskFormData, DurationSuggestion } from '@/lib/hooks/useTaskViewModel';

// Re-export for backwards compatibility
export type { TaskFormData, DurationSuggestion } from '@/lib/hooks/useTaskViewModel';

export interface TaskFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: TaskFormData;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateField: <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => void;
  getDurationSuggestion?: (title: string) => DurationSuggestion;
  // Phase 10-E: 梅習慣選択用
  umeHabits?: UmeHabit[];
}

export const DURATION_OPTIONS = [
  { value: 5, label: '5分' },
  { value: 15, label: '15分' },
  { value: 30, label: '30分' },
  { value: 45, label: '45分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1.5時間' },
  { value: 120, label: '2時間' },
];
