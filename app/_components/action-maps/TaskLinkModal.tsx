/**
 * app/_components/action-maps/TaskLinkModal.tsx
 *
 * Phase 10: Task紐付けモーダル
 */

'use client';

import { useState, useEffect } from 'react';
import type { Task } from '@/lib/types/task';

interface TaskLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionItemId: string;
  linkedTaskIds: string[];
  workspaceId: string;
  onLink: (taskId: string) => Promise<void>;
  onUnlink: (taskId: string) => Promise<void>;
}

export function TaskLinkModal({
  isOpen,
  onClose,
  actionItemId,
  linkedTaskIds,
  workspaceId,
  onLink,
  onUnlink,
}: TaskLinkModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const linkedTasks = tasks.filter((t) => linkedTaskIds.includes(t.id));
  const unlinkedTasks = tasks.filter((t) => !t.actionItemId || t.actionItemId === actionItemId);
  const availableTasks = unlinkedTasks.filter((t) => !linkedTaskIds.includes(t.id));

  const handleLink = async (taskId: string) => {
    setProcessing(taskId);
    await onLink(taskId);
    setProcessing(null);
  };

  const handleUnlink = async (taskId: string) => {
    setProcessing(taskId);
    await onUnlink(taskId);
    setProcessing(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #fff)',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0 }}>Task紐付け</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-light)',
            }}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px' }}>
              読み込み中...
            </div>
          ) : (
            <>
              {/* 紐付け済みTask */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-light)' }}>
                  紐付け済み ({linkedTasks.length})
                </h4>
                {linkedTasks.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                    紐付けられたTaskはありません
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {linkedTasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-muted)',
                          borderRadius: '4px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '14px' }}>{task.title}</span>
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: task.status === 'done' ? 'var(--success)' : 'var(--text-light)',
                            }}
                          >
                            {task.status === 'done' ? '完了' : task.status === 'in_progress' ? '進行中' : '未着手'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnlink(task.id)}
                          disabled={processing === task.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            color: 'var(--danger)',
                            cursor: processing === task.id ? 'wait' : 'pointer',
                            opacity: processing === task.id ? 0.5 : 1,
                          }}
                        >
                          解除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 紐付け可能なTask */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-light)' }}>
                  紐付け可能 ({availableTasks.length})
                </h4>
                {availableTasks.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                    紐付け可能なTaskはありません
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableTasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '14px' }}>{task.title}</span>
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: task.status === 'done' ? 'var(--success)' : 'var(--text-light)',
                            }}
                          >
                            {task.status === 'done' ? '完了' : task.status === 'in_progress' ? '進行中' : '未着手'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLink(task.id)}
                          disabled={processing === task.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            cursor: processing === task.id ? 'wait' : 'pointer',
                            opacity: processing === task.id ? 0.5 : 1,
                          }}
                        >
                          紐付け
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
