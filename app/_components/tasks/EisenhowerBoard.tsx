/**
 * app/_components/tasks/EisenhowerBoard.tsx
 *
 * Phase 9: Eisenhower Matrix 4象限ボード
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, X } from 'lucide-react';
import { useTasks } from '@/lib/contexts/TaskContext';
import type { Task, Suit, CreateTaskInput } from '@/lib/types/task';
import { QuadrantColumn } from './QuadrantColumn';
import { JokerZone } from './JokerZone';
import { TaskCard } from './TaskCard';

export function EisenhowerBoard() {
  const {
    tasksBySuit,
    loading,
    error,
    addTask,
    deleteTask,
    moveSuit,
    updateStatus,
  } = useTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // 象限へのドロップ
    if (overId.startsWith('quadrant-')) {
      const newSuit = overId.replace('quadrant-', '') as Suit | 'joker';
      moveSuit(taskId, newSuit === 'joker' ? null : newSuit);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const input: CreateTaskInput = {
      title: newTaskTitle.trim(),
      status: 'not_started',
      // suit は未設定 = Joker
    };

    await addTask(input);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('このタスクを削除しますか？')) {
      await deleteTask(taskId);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        {error}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {/* Jokerゾーン */}
        <div style={{ marginBottom: '24px' }}>
          <JokerZone
            tasks={tasksBySuit.joker}
            onStatusChange={(id, status) => updateStatus(id, status)}
            onDelete={handleDelete}
            onAddTask={() => setShowAddForm(true)}
          />
        </div>

        {/* 4象限グリッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {/* 緊急×重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急 & 重要
            </div>
            <QuadrantColumn
              suit="spade"
              tasks={tasksBySuit.spade}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 非緊急×重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              重要だが緊急でない
            </div>
            <QuadrantColumn
              suit="heart"
              tasks={tasksBySuit.heart}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 緊急×非重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急だが重要でない
            </div>
            <QuadrantColumn
              suit="diamond"
              tasks={tasksBySuit.diamond}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 非緊急×非重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急でも重要でもない
            </div>
            <QuadrantColumn
              suit="club"
              tasks={tasksBySuit.club}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {activeTask && (
            <div style={{ width: '280px' }}>
              <TaskCard
                task={activeTask}
                onStatusChange={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>

        {/* タスク追加モーダル */}
        {showAddForm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAddForm(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ margin: 0 }}>新しいタスク</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="タスク名を入力..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  キャンセル
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                >
                  <Plus size={16} />
                  追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
