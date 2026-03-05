/**
 * lib/utils/apply-command.ts
 *
 * Command application utility (Phase 33)
 * Pure function: applies a command to local state for optimistic UI.
 *
 * Note: This is a reference implementation. The current FDC app uses
 * direct API calls. This serves as a foundation for future optimistic UI.
 */

import type { DataCommand } from '@/lib/types/commands';

interface TaskRecord {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}

interface LocalState {
  tasks: TaskRecord[];
  [key: string]: unknown;
}

/**
 * Apply a command to local state (pure function).
 * Returns new state without mutating the original.
 */
export function applyCommand(state: LocalState, command: DataCommand): LocalState {
  switch (command.type) {
    case 'COMPLETE_TASK': {
      const task = state.tasks.find((t) => t.id === command.taskId);
      if (!task || task.status === 'done') return state; // Idempotent
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === command.taskId ? { ...t, status: 'done' } : t
        ),
      };
    }

    case 'UNCOMPLETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === command.taskId ? { ...t, status: 'not_started' } : t
        ),
      };
    }

    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== command.taskId),
      };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === command.taskId ? { ...t, ...command.updates } : t
        ),
      };
    }

    default:
      return state;
  }
}
