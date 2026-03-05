import { describe, it, expect } from 'vitest';
import { applyCommand } from '@/lib/utils/apply-command';

const baseState = {
  tasks: [
    { id: '1', title: 'Task 1', status: 'not_started' },
    { id: '2', title: 'Task 2', status: 'in_progress' },
    { id: '3', title: 'Task 3', status: 'done' },
  ],
};

describe('applyCommand', () => {
  describe('COMPLETE_TASK', () => {
    it('marks a task as done', () => {
      const result = applyCommand(baseState, { type: 'COMPLETE_TASK', taskId: '1' });
      const task = result.tasks.find((t) => t.id === '1');
      expect(task?.status).toBe('done');
    });

    it('is idempotent - already done task returns same state', () => {
      const result = applyCommand(baseState, { type: 'COMPLETE_TASK', taskId: '3' });
      expect(result).toBe(baseState);
    });

    it('is idempotent - non-existent task returns same state', () => {
      const result = applyCommand(baseState, { type: 'COMPLETE_TASK', taskId: 'xxx' });
      expect(result).toBe(baseState);
    });
  });

  describe('UNCOMPLETE_TASK', () => {
    it('resets task to not_started', () => {
      const result = applyCommand(baseState, { type: 'UNCOMPLETE_TASK', taskId: '3' });
      const task = result.tasks.find((t) => t.id === '3');
      expect(task?.status).toBe('not_started');
    });
  });

  describe('DELETE_TASK', () => {
    it('removes the task', () => {
      const result = applyCommand(baseState, { type: 'DELETE_TASK', taskId: '2' });
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks.find((t) => t.id === '2')).toBeUndefined();
    });
  });

  describe('UPDATE_TASK', () => {
    it('updates task fields', () => {
      const result = applyCommand(baseState, {
        type: 'UPDATE_TASK',
        taskId: '1',
        updates: { title: 'Updated Title' },
      });
      const task = result.tasks.find((t) => t.id === '1');
      expect(task?.title).toBe('Updated Title');
      expect(task?.status).toBe('not_started');
    });
  });

  describe('unknown command', () => {
    it('returns state unchanged', () => {
      const result = applyCommand(baseState, {
        type: 'CREATE_BRAND',
        name: 'Test',
      });
      expect(result).toBe(baseState);
    });
  });
});
