/**
 * lib/contexts/TaskContext.tsx
 *
 * Phase 9: Eisenhower Matrix対応
 * Supabase API連携版
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Suit,
  TaskStatus,
} from '@/lib/types/task';
import { groupTasksBySuit, groupTasksByStatus } from '@/lib/types/task';

interface TaskContextValue {
  // 状態
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // グループ化されたタスク
  tasksBySuit: {
    spade: Task[];
    heart: Task[];
    diamond: Task[];
    club: Task[];
    joker: Task[];
  };
  tasksByStatus: Record<TaskStatus, Task[]>;

  // アクション
  addTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  moveSuit: (taskId: string, newSuit: Suit | null) => Promise<void>;
  updateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  reloadTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // タスク読み込み
  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/tasks`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('タスクの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [workspaceId, fetchTasks]);

  // グループ化
  const tasksBySuit = groupTasksBySuit(tasks);
  const tasksByStatus = groupTasksByStatus(tasks);

  // タスク追加
  const addTask = useCallback(
    async (input: CreateTaskInput): Promise<Task | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('タスクの作成に失敗しました');
        }

        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        console.error('Error adding task:', err);
        setError('タスクの作成に失敗しました');
        return null;
      }
    },
    [workspaceId]
  );

  // タスク更新
  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('タスクの更新に失敗しました');
        }

        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        console.error('Error updating task:', err);
        setError('タスクの更新に失敗しました');
        return null;
      }
    },
    [workspaceId]
  );

  // タスク削除
  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      if (!workspaceId) return;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('タスクの削除に失敗しました');
        }

        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('タスクの削除に失敗しました');
      }
    },
    [workspaceId]
  );

  // Suit移動（ドラッグ&ドロップ用）
  const moveSuit = useCallback(
    async (taskId: string, newSuit: Suit | null): Promise<void> => {
      await updateTask(taskId, { suit: newSuit });
    },
    [updateTask]
  );

  // ステータス更新
  const updateStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus): Promise<void> => {
      await updateTask(taskId, { status: newStatus });
    },
    [updateTask]
  );

  // リロード
  const reloadTasks = useCallback(async (): Promise<void> => {
    if (!workspaceId) return;

    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Error reloading tasks:', err);
    }
  }, [workspaceId, fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        tasksBySuit,
        tasksByStatus,
        addTask,
        updateTask,
        deleteTask,
        moveSuit,
        updateStatus,
        reloadTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
}
