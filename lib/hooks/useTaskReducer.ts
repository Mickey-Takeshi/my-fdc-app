/**
 * lib/hooks/useTaskReducer.ts
 *
 * useReducer + localStorage によるタスク状態管理（Phase 1 レガシー）
 *
 * Phase 9 で tasks はSupabase に移行。
 * このフックは Phase 1 互換のローカルストレージ版として残す。
 * ダッシュボード等で軽量なローカルタスクが必要な場合に使用可能。
 */

'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';

/** ローカル専用のシンプルなタスク型（Phase 1互換） */
interface LocalTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── Storage ──
const STORAGE_KEY = 'fdc_tasks';

function loadTasks(): LocalTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalTask[]) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: LocalTask[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Actions ──
type TaskAction =
  | { type: 'INIT'; payload: LocalTask[] }
  | { type: 'ADD_TASK'; payload: { title: string } }
  | { type: 'UPDATE_TASK'; payload: { id: string; title: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } };

// ── Reducer ──
function taskReducer(state: LocalTask[], action: TaskAction): LocalTask[] {
  switch (action.type) {
    case 'INIT':
      return action.payload;

    case 'ADD_TASK': {
      const now = Date.now();
      const newTask: LocalTask = {
        id: crypto.randomUUID(),
        title: action.payload.title,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      return [newTask, ...state];
    }

    case 'UPDATE_TASK':
      return state.map((t) =>
        t.id === action.payload.id
          ? { ...t, title: action.payload.title, updatedAt: Date.now() }
          : t
      );

    case 'DELETE_TASK':
      return state.filter((t) => t.id !== action.payload.id);

    case 'TOGGLE_TASK':
      return state.map((t) =>
        t.id === action.payload.id
          ? { ...t, completed: !t.completed, updatedAt: Date.now() }
          : t
      );

    default:
      return state;
  }
}

// ── Hook ──
export function useTaskReducer() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const isInitialized = useRef(false);

  // 初回マウント時に localStorage から読み込み
  useEffect(() => {
    dispatch({ type: 'INIT', payload: loadTasks() });
    isInitialized.current = true;
  }, []);

  // tasks が変化したら localStorage に保存（初期化完了後のみ）
  useEffect(() => {
    if (!isInitialized.current) return;
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((title: string) => {
    dispatch({ type: 'ADD_TASK', payload: { title } });
  }, []);

  const updateTask = useCallback((id: string, title: string) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, title } });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { id } });
  }, []);

  const toggleTask = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: { id } });
  }, []);

  // 統計
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    stats: { total, completed, pending, progressRate },
  };
}
