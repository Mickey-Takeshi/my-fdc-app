/**
 * app/(app)/tasks/page.tsx
 *
 * Phase 9: Eisenhower Matrix タスクページ
 * Phase 14: Google Tasks 同期機能追加
 */

'use client';

import { TaskProvider, useTasks } from '@/lib/contexts/TaskContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { EisenhowerBoard } from '@/app/_components/tasks';
import { SyncButton, SyncStatus } from '@/app/_components/sync';

function TasksPageContent() {
  const { workspace } = useWorkspace();
  const { reloadTasks } = useTasks();

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ margin: 0 }}>タスク管理</h1>
          <p style={{ color: 'var(--text-light)', margin: '8px 0 0' }}>
            タスクをドラッグして4象限に振り分けてください。
          </p>
        </div>

        {workspace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SyncStatus workspaceId={workspace.id} />
            <SyncButton
              workspaceId={workspace.id}
              onSyncComplete={() => {
                reloadTasks();
              }}
            />
          </div>
        )}
      </div>

      <EisenhowerBoard />
    </div>
  );
}

export default function TasksPage() {
  return (
    <TaskProvider>
      <TasksPageContent />
    </TaskProvider>
  );
}
