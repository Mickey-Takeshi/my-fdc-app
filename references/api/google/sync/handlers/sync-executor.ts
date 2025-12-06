/**
 * app/api/google/sync/handlers/sync-executor.ts
 *
 * Phase 14.6.4: 同期実行ロジック
 * Phase 14.9-D: サーバー側でeventIdを保存（無限ループ修正）
 * Phase 16: サーバー側でのversion更新を廃止（409 Conflict根本解決）
 *   - eventIdはレスポンスで返し、クライアント側でsaveDataを呼ばせる
 *   - これにより、すべての保存がクライアントのsaveQueueを通るようになる
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/google/sync-engine';
import type { Task } from '@/lib/types/todo';
import { googleLogger } from '@/lib/server/logger';
import { getValidAccessToken } from './token-utils';
import { decompress } from '@/lib/core/compression';
// Phase 16: compress は不要になった（サーバー側でのversion更新を廃止）

/**
 * Phase 14.9-E: DBから最新のeventIdを取得してタスクにマージ
 * クライアントから送られるデータは古い可能性があるため、
 * カレンダー同期の前に常にDBの最新データで上書きする
 */
async function mergeEventIdsFromDB(
  supabase: SupabaseClient,
  userId: number,
  tasks: Task[]
): Promise<Task[]> {
  try {
    // ユーザーのworkspace_idを取得
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    if (!membership) {
      googleLogger.warn({ userId }, '[Google Sync] No workspace found for user');
      return tasks;
    }

    const workspaceId = membership.workspace_id;

    // workspace_dataを取得
    const { data: wsData, error: fetchError } = await supabase
      .from('workspace_data')
      .select('data')
      .eq('workspace_id', workspaceId)
      .single();

    if (fetchError || !wsData) {
      googleLogger.warn({ workspaceId, error: fetchError }, '[Google Sync] Failed to fetch workspace_data');
      return tasks;
    }

    // データを展開（圧縮されている場合）
    let appData: { tasks?: Task[] };
    if (typeof wsData.data === 'string') {
      const decompressed = await decompress(wsData.data);
      appData = JSON.parse(decompressed);
    } else {
      appData = wsData.data as { tasks?: Task[] };
    }

    if (!appData.tasks) {
      return tasks;
    }

    // DBのタスクからeventIdマップを作成
    const eventIdMap = new Map<string, string>();
    for (const dbTask of appData.tasks) {
      if (dbTask.googleCalendarEventId) {
        eventIdMap.set(dbTask.id, dbTask.googleCalendarEventId);
      }
    }

    googleLogger.info({ eventIdCount: eventIdMap.size }, '[Google Sync] Loaded eventIds from DB');

    // クライアントから送られたタスクにDBのeventIdをマージ
    return tasks.map((task) => {
      const dbEventId = eventIdMap.get(task.id);
      if (dbEventId && !task.googleCalendarEventId) {
        googleLogger.info({ taskId: task.id, eventId: dbEventId }, '[Google Sync] Merged eventId from DB');
        return { ...task, googleCalendarEventId: dbEventId };
      }
      return task;
    });
  } catch (error) {
    googleLogger.error({ err: error }, '[Google Sync] Error merging eventIds from DB');
    return tasks;
  }
}

/**
 * Phase 16: サーバー側でのversion更新を廃止
 *
 * 【旧実装】saveEventIdsToWorkspaceData - 削除
 * サーバー側でworkspace_dataのversionを更新すると、クライアントが保持している
 * versionと不一致になり、409 Conflictが発生する根本原因となっていた。
 *
 * 【新実装】
 * eventIdはレスポンスのcalendar.resultsに含めて返す。
 * クライアント側（GoogleSyncButton）でeventIdを受け取り、
 * 通常のsaveDataフローで保存する。
 * これにより、すべての保存がクライアントのsaveQueueを通り、
 * 並列操作時の競合が正しく処理される。
 */

/**
 * 同期処理を直接実行（従来の同期処理）
 */
export async function executeSyncDirectly(
  supabase: SupabaseClient,
  userId: number,
  tasks: Task[],
  syncToCalendar: boolean
): Promise<NextResponse> {
  const { accessToken, needsUpdate, newTokenData } = await getValidAccessToken(supabase, userId);

  if (needsUpdate && newTokenData) {
    await supabase
      .from('users')
      .update({
        ...newTokenData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  const syncEngine = new SyncEngine(accessToken);
  await syncEngine.initialize();

  const result = await syncEngine.syncAllTasks(tasks);

  let calendarResult = {
    created: 0,
    updated: 0,
    errors: [] as Array<{ taskId: string; error: string }>,
    results: [] as Array<{ taskId: string; eventId?: string }>,
  };

  if (syncToCalendar) {
    const tasksWithTime = tasks.filter((t) => t.startAt);
    if (tasksWithTime.length > 0) {
      // Phase 14.9-E: DBから最新のeventIdをマージしてから同期
      // これによりクライアントが古いデータを送っても正しく更新/作成を判定できる
      const tasksWithEventIds = await mergeEventIdsFromDB(supabase, userId, tasksWithTime);

      calendarResult = await syncEngine.syncTasksToCalendar(tasksWithEventIds);
      googleLogger.info({ calendarResult }, '[Google Sync] Calendar sync result');

      // Phase 16: サーバー側でのversion更新を廃止
      // eventIdはレスポンスのcalendar.resultsで返し、クライアント側で保存する
      // 旧コード: await saveEventIdsToWorkspaceData(supabase, userId, calendarResult.results);
    }
  }

  await supabase
    .from('users')
    .update({
      google_last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  googleLogger.info({ result }, '[Google Sync] Tasks result');
  googleLogger.info('[Google Sync] ========== POST SUCCESS ==========');

  return NextResponse.json({
    success: result.success,
    synced: result.syncedCount,
    conflicts: result.conflictCount,
    errors: result.errorCount,
    conflictDetails: result.conflicts,
    errorDetails: result.errors,
    calendar: {
      created: calendarResult.created,
      updated: calendarResult.updated,
      errors: calendarResult.errors.length,
      results: calendarResult.results,
    },
  });
}
