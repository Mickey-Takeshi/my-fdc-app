/**
 * lib/server/task-sync.ts
 *
 * Phase 14: タスク同期サービス
 */

import { createAdminClient } from '@/lib/supabase/client';
import {
  getOrCreateDefaultTaskList,
  getTasks,
  createTask,
  updateTask,
} from './google-tasks';
import type { GoogleTask, SyncResult } from '@/lib/types/google-tasks';

interface FDCTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  google_task_id?: string;
  google_task_list_id?: string;
  last_synced_at?: string;
  updated_at: string;
  workspace_id: string;
}

/**
 * タスクを同期
 */
export async function syncTasks(
  userId: string,
  workspaceId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    createdInFDC: 0,
    updatedInFDC: 0,
    createdInGoogle: 0,
    updatedInGoogle: 0,
    errors: [],
    lastSyncAt: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (!supabase) {
    result.errors.push('Database not configured');
    return result;
  }

  try {
    // 1. Google タスクリストを取得/作成
    const taskList = await getOrCreateDefaultTaskList(userId);
    if (!taskList) {
      result.errors.push('Failed to get/create task list');
      return result;
    }

    // 2. 同期設定を更新
    await supabase.from('sync_settings').upsert({
      user_id: userId,
      workspace_id: workspaceId,
      google_task_list_id: taskList.id,
      google_task_list_name: taskList.title,
      sync_status: 'syncing',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,workspace_id',
    });

    // 3. Google Tasks を取得
    const googleTasks = await getTasks(userId, taskList.id, {
      showCompleted: true,
    });

    // 4. FDC Tasks を取得
    const { data: fdcTasks, error: fdcError } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (fdcError) {
      result.errors.push(`Failed to get FDC tasks: ${fdcError.message}`);
      return result;
    }

    // 5. Google → FDC 同期
    for (const gt of googleTasks) {
      try {
        const syncResult = await syncGoogleToFDC(
          supabase,
          gt,
          taskList.id,
          workspaceId,
          fdcTasks || []
        );
        if (syncResult === 'created') result.createdInFDC++;
        if (syncResult === 'updated') result.updatedInFDC++;
      } catch (err) {
        result.errors.push(`Google→FDC sync error: ${(err as Error).message}`);
      }
    }

    // 6. FDC → Google 同期
    for (const ft of fdcTasks || []) {
      try {
        const syncResult = await syncFDCToGoogle(
          supabase,
          userId,
          taskList.id,
          ft,
          googleTasks
        );
        if (syncResult === 'created') result.createdInGoogle++;
        if (syncResult === 'updated') result.updatedInGoogle++;
      } catch (err) {
        result.errors.push(`FDC→Google sync error: ${(err as Error).message}`);
      }
    }

    // 7. 同期完了
    await supabase.from('sync_settings').update({
      last_sync_at: result.lastSyncAt,
      sync_status: 'synced',
      sync_error: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('workspace_id', workspaceId);

    result.success = true;
  } catch (err) {
    result.errors.push(`Sync error: ${(err as Error).message}`);

    // エラー状態を保存
    await supabase?.from('sync_settings').update({
      sync_status: 'error',
      sync_error: (err as Error).message,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('workspace_id', workspaceId);
  }

  return result;
}

/**
 * Google → FDC 同期
 */
async function syncGoogleToFDC(
  supabase: ReturnType<typeof createAdminClient>,
  googleTask: GoogleTask,
  taskListId: string,
  workspaceId: string,
  fdcTasks: FDCTask[]
): Promise<'created' | 'updated' | 'skipped'> {
  if (!supabase) return 'skipped';

  // 削除済みはスキップ
  if (googleTask.deleted) return 'skipped';

  // FDC で対応するタスクを探す
  const fdcTask = fdcTasks.find((t) => t.google_task_id === googleTask.id);

  if (!fdcTask) {
    // FDC にない → 新規作成
    await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      title: googleTask.title,
      description: googleTask.notes,
      status: googleTask.status === 'completed' ? 'done' : 'todo',
      due_date: googleTask.due ? googleTask.due.split('T')[0] : null,
      google_task_id: googleTask.id,
      google_task_list_id: taskListId,
      last_synced_at: new Date().toISOString(),
      suit: 'unclassified', // Google から来たタスクは未分類
    });
    return 'created';
  }

  // 競合解決: Google が新しければ更新
  const googleUpdated = new Date(googleTask.updated);
  const fdcSynced = fdcTask.last_synced_at ? new Date(fdcTask.last_synced_at) : new Date(0);

  if (googleUpdated > fdcSynced) {
    await supabase.from('tasks').update({
      title: googleTask.title,
      description: googleTask.notes,
      status: googleTask.status === 'completed' ? 'done' : 'todo',
      due_date: googleTask.due ? googleTask.due.split('T')[0] : null,
      last_synced_at: new Date().toISOString(),
    }).eq('id', fdcTask.id);
    return 'updated';
  }

  return 'skipped';
}

/**
 * FDC → Google 同期
 */
async function syncFDCToGoogle(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  taskListId: string,
  fdcTask: FDCTask,
  googleTasks: GoogleTask[]
): Promise<'created' | 'updated' | 'skipped'> {
  if (!supabase) return 'skipped';

  const taskData = {
    title: fdcTask.title,
    notes: fdcTask.description || undefined,
    status: fdcTask.status === 'done' ? 'completed' as const : 'needsAction' as const,
    due: fdcTask.due_date ? `${fdcTask.due_date}T00:00:00.000Z` : undefined,
  };

  if (!fdcTask.google_task_id) {
    // Google にない → 新規作成
    const created = await createTask(userId, taskListId, taskData);
    if (created) {
      await supabase.from('tasks').update({
        google_task_id: created.id,
        google_task_list_id: taskListId,
        last_synced_at: new Date().toISOString(),
      }).eq('id', fdcTask.id);
      return 'created';
    }
    return 'skipped';
  }

  // 競合解決: FDC が新しければ更新
  const fdcUpdated = new Date(fdcTask.updated_at);
  const fdcSynced = fdcTask.last_synced_at ? new Date(fdcTask.last_synced_at) : new Date(0);

  if (fdcUpdated > fdcSynced) {
    const googleTask = googleTasks.find((t) => t.id === fdcTask.google_task_id);

    if (googleTask) {
      await updateTask(userId, taskListId, fdcTask.google_task_id, taskData);
      await supabase.from('tasks').update({
        last_synced_at: new Date().toISOString(),
      }).eq('id', fdcTask.id);
      return 'updated';
    }
  }

  return 'skipped';
}

/**
 * 同期状態を取得
 */
export async function getSyncStatus(
  userId: string,
  workspaceId: string
): Promise<{
  status: string;
  lastSyncAt: string | null;
  error: string | null;
  taskListName: string | null;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { status: 'error', lastSyncAt: null, error: 'Database not configured', taskListName: null };
  }

  const { data } = await supabase
    .from('sync_settings')
    .select('sync_status, last_sync_at, sync_error, google_task_list_name')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  return {
    status: data?.sync_status || 'idle',
    lastSyncAt: data?.last_sync_at || null,
    error: data?.sync_error || null,
    taskListName: data?.google_task_list_name || null,
  };
}
