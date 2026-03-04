/**
 * lib/types/task.ts
 *
 * タスクの型定義（Phase 1）
 */

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
