/**
 * app/api/google/sync/route.ts
 *
 * Phase 10-D: Google Tasks 同期エンドポイント
 * 【Phase 14.2】非同期ジョブキュー対応
 * 【Phase 14.6.4】handlers/ に分割
 *
 * 【機能】
 * - POST: 同期ジョブをキューに追加（即座にレスポンス）
 * - GET: 同期状態またはジョブステータスを取得
 *
 * 【非同期モード】
 * - 環境変数 SYNC_ASYNC_MODE=true で有効化
 * - 無効時は従来の同期処理を維持（後方互換性）
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isTokenExpired } from '@/lib/google/oauth';
import { SyncEngine } from '@/lib/google/sync-engine';
import type { Task } from '@/lib/types/todo';
import {
  enqueueSyncJob,
  getSyncJobStatus,
  updateSyncJob,
  type SyncJob,
} from '@/lib/server/sync-queue';
import { googleLogger } from '@/lib/server/logger';
import { getValidAccessToken, executeSyncDirectly } from './handlers';
import { handleApiError, ApiErrors } from '@/lib/server/api-errors';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';
import { withSecurityMonitor } from '@/lib/server/security-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Phase 14.2: 非同期モードフラグ
const ASYNC_MODE_ENABLED = process.env.SYNC_ASYNC_MODE === 'true';

// ========================================
// Phase 14.9-B: Google Sync レート制限設定
// ========================================

/**
 * Google Sync API レート制限
 * - 制限単位: ユーザーID（同一ユーザーからの連続リクエストを制限）
 * - 上限: 10リクエスト/分
 * - 理由: Google API クォータ保護、サービス安定性確保
 */
const GOOGLE_SYNC_RATE_LIMIT = 10; // req/min
const GOOGLE_SYNC_RATE_WINDOW = 60000; // 1分

/**
 * POST /api/google/sync
 *
 * Google Tasks との同期を実行
 * Phase 14.2: 非同期モード対応
 * Phase 14.9-E: サーバー側でDB参照してeventId判定（完全修正）
 */
export async function POST(request: NextRequest) {
  googleLogger.info('[Google Sync] ========== POST START ==========');

  try {
    // Phase 14.9: セキュリティ監視
    // Note: validateInputはfalse - タスクデータ内の文字列がSQL検知で誤検出されるため
    const security = await withSecurityMonitor(request, {
      rateLimit: false, // 下の独自レート制限を使用
      validateInput: false, // タスクデータ内の文字列（例：日本語タイトル）が誤検出される
    });
    if (security.blocked) {
      return security.response;
    }

    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return ApiErrors.unauthorized(null, 'Google Sync POST');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. セッションからユーザー ID を取得
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return ApiErrors.unauthorized('Session expired', 'Google Sync POST');
    }

    const userId = session.user_id;

    // 2.5. テナント境界チェック（Phase 15.1）
    const tenantCheck = await checkUserTenantBoundary(request, userId);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. レート制限チェック
    const rateLimitResult = await checkRateLimit(
      `google-sync:${userId}`,
      GOOGLE_SYNC_RATE_LIMIT,
      GOOGLE_SYNC_RATE_WINDOW
    );

    if (!rateLimitResult.allowed) {
      googleLogger.warn({ userId, remaining: rateLimitResult.remaining }, '[Google Sync] Rate limit exceeded');
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { status: 429 }
      );
    }

    // 4. ユーザーの Google API 有効性確認
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, google_api_enabled')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return ApiErrors.notFound(null, 'Google Sync POST');
    }

    if (!userData.google_api_enabled) {
      return NextResponse.json(
        { error: 'Google API not enabled' },
        { status: 400 }
      );
    }

    // 5. リクエストボディを取得
    const body = await request.json();
    const tasks: Task[] = body.tasks || [];
    const syncToCalendar = body.syncToCalendar !== false;

    googleLogger.info({ userId, taskCount: tasks.length, syncToCalendar }, '[Google Sync] Processing sync request');

    // 6. 非同期モードか同期モードかで分岐
    if (ASYNC_MODE_ENABLED) {
      // 非同期モード: ジョブをキューに追加
      const jobId = await enqueueSyncJob(
        String(userId),
        'full',
        { tasks, syncToCalendar }
      );

      googleLogger.info({ jobId }, '[Google Sync] Job enqueued');

      return NextResponse.json({
        success: true,
        async: true,
        jobId,
        message: 'Sync job enqueued',
      });
    } else {
      // 同期モード: 直接実行（Phase 14.9-E: DBからeventIdをマージ）
      return executeSyncDirectly(supabase, userId, tasks, syncToCalendar);
    }
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Sync] ========== POST ERROR ==========');
    return handleApiError(error, 'Google Sync POST');
  }
}

/**
 * 同期ジョブを処理（Cronワーカーから呼び出される）
 * @internal
 */
export async function processSyncJob(job: SyncJob): Promise<void> {
  googleLogger.info({ jobId: job.id }, '[Google Sync] Processing job');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ジョブを処理中に更新
    await updateSyncJob(job.id, {
      status: 'processing',
      startedAt: new Date().toISOString(),
    });

    const tasks = (job.payload?.tasks as Task[]) || [];
    const syncToCalendar = job.payload?.syncToCalendar !== false;

    // アクセストークンを取得
    const { accessToken, needsUpdate, newTokenData } = await getValidAccessToken(
      supabase,
      Number(job.userId)
    );

    if (needsUpdate && newTokenData) {
      await supabase
        .from('users')
        .update({
          ...newTokenData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.userId);
    }

    // 同期エンジンを初期化
    const syncEngine = new SyncEngine(accessToken);
    await syncEngine.initialize();

    // Google Tasks への同期
    const tasksResult = await syncEngine.syncAllTasks(tasks);

    // Google Calendar への同期
    let calendarResult = { created: 0, updated: 0, errors: [] as Array<{ taskId: string; error: string }> };
    if (syncToCalendar) {
      const tasksWithTime = tasks.filter((t) => t.startAt);
      if (tasksWithTime.length > 0) {
        calendarResult = await syncEngine.syncTasksToCalendar(tasksWithTime);
      }
    }

    // 最終同期日時を更新
    await supabase
      .from('users')
      .update({
        google_last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.userId);

    // ジョブを完了に更新
    await updateSyncJob(job.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: {
        tasksSync: {
          synced: tasksResult.syncedCount,
          conflicts: tasksResult.conflictCount,
          errors: tasksResult.errorCount,
        },
        calendarSync: {
          created: calendarResult.created,
          updated: calendarResult.updated,
          errors: calendarResult.errors.length,
        },
      },
    });

    googleLogger.info({ jobId: job.id }, '[Google Sync] Job completed');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    googleLogger.error({ err: error, jobId: job.id }, '[Google Sync] Job failed');

    await updateSyncJob(job.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: errorMessage,
    });
  }
}

/**
 * GET /api/google/sync
 *
 * 同期状態を取得
 * Phase 14.2: ジョブステータス取得対応（?jobId=xxx）
 */
export async function GET(request: NextRequest) {
  googleLogger.info('[Google Sync] ========== GET START ==========');

  try {
    // Phase 14.2: ジョブステータス取得
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      googleLogger.info({ jobId }, '[Google Sync] Getting job status');
      const job = await getSyncJobStatus(jobId);

      if (!job) {
        return ApiErrors.notFound(null, 'Google Sync GET');
      }

      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.result,
        error: job.error,
      });
    }

    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return ApiErrors.unauthorized(null, 'Google Sync GET');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. セッションからユーザー ID を取得
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return ApiErrors.unauthorized('Session expired', 'Google Sync GET');
    }

    // 2.5. テナント境界チェック（Phase 15.1）
    const tenantCheck = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. ユーザーの同期状態を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return ApiErrors.notFound(null, 'Google Sync GET');
    }

    // google_* カラムを別途取得（存在しない場合はnullになる）
    const { data: googleData } = await supabase
      .from('users')
      .select('google_api_enabled, google_last_synced_at, google_scopes, google_token_expires_at')
      .eq('id', session.user_id)
      .single();

    // カラムが存在しない場合はデフォルト値を返す
    if (!googleData) {
      googleLogger.info('[Google Sync] Google columns not found, returning defaults');
      return NextResponse.json({
        enabled: false,
        lastSyncedAt: null,
        scopes: [],
        tokenExpired: false,
      });
    }

    const user = googleData as {
      google_api_enabled: boolean | null;
      google_last_synced_at: string | null;
      google_scopes: string[] | null;
      google_token_expires_at: string | null;
    };

    // トークンの有効性チェック
    const tokenExpired = user.google_token_expires_at
      ? isTokenExpired(user.google_token_expires_at)
      : false;

    googleLogger.info('[Google Sync] ========== GET SUCCESS ==========');

    return NextResponse.json({
      enabled: user.google_api_enabled || false,
      lastSyncedAt: user.google_last_synced_at,
      scopes: user.google_scopes || [],
      tokenExpired,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    googleLogger.error({ err: error }, '[Google Sync] ========== GET ERROR ==========');

    // カラムが存在しないエラーの場合はデフォルト値を返す
    if (errorMessage.includes('column') || errorMessage.includes('does not exist')) {
      googleLogger.info('[Google Sync] Google columns not migrated yet, returning defaults');
      return NextResponse.json({
        enabled: false,
        lastSyncedAt: null,
        scopes: [],
        tokenExpired: false,
      });
    }

    return handleApiError(error, 'Google Sync GET');
  }
}
