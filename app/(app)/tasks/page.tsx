/**
 * app/(app)/tasks/page.tsx
 *
 * タスク一覧ページ（Phase 1）
 * - タスクの追加・完了・削除
 * - 統計表示（全タスク数、完了数、未完了数）
 * - localStorage で永続化
 */

'use client';

import { useState } from 'react';
import { useTaskReducer } from '@/lib/hooks/useTaskReducer';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ClipboardList,
  ListChecks,
  Clock,
  Pencil,
  X,
  Check,
} from 'lucide-react';

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, stats } =
    useTaskReducer();

  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setNewTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = () => {
    const trimmed = editingTitle.trim();
    if (!trimmed || !editingId) return;
    updateTask(editingId, trimmed);
    cancelEdit();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div>
      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">
            <ClipboardList size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            全タスク
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">
            <ListChecks size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            完了
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            未完了
          </div>
        </div>
      </div>

      {/* 進捗バー */}
      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
              color: 'var(--text-light)',
            }}
          >
            <span>進捗率</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
              {stats.progressRate}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.progressRate}%` }}
            />
          </div>
        </div>
      )}

      {/* タスク追加フォーム */}
      <div className="card">
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <input
              type="text"
              placeholder="新しいタスクを入力..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            追加
          </button>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="card">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={64} className="empty-state-icon" />
            <p>タスクがありません</p>
            <p style={{ fontSize: 14 }}>
              上のフォームからタスクを追加してみましょう
            </p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                {/* 完了トグル */}
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: task.completed
                      ? 'var(--success)'
                      : 'var(--text-muted)',
                    display: 'flex',
                  }}
                  aria-label={
                    task.completed ? 'タスクを未完了にする' : 'タスクを完了にする'
                  }
                >
                  {task.completed ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>

                {/* タイトル（編集中 / 表示） */}
                <div className="task-content">
                  {editingId === task.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid var(--primary)',
                          borderRadius: 6,
                          fontSize: 14,
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={saveEdit}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--success)',
                          padding: 4,
                        }}
                        aria-label="保存"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: 4,
                        }}
                        aria-label="キャンセル"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`task-title ${task.completed ? 'completed' : ''}`}
                    >
                      {task.title}
                    </span>
                  )}
                </div>

                {/* アクション */}
                {editingId !== task.id && (
                  <>
                    <button
                      onClick={() => startEdit(task.id, task.title)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 8,
                        borderRadius: 6,
                        transition: 'all 0.2s',
                      }}
                      aria-label="編集"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="task-delete"
                      onClick={() => deleteTask(task.id)}
                      aria-label="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
