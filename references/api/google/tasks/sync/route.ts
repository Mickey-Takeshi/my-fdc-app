/**
 * app/api/google/tasks/sync/route.ts
 *
 * Google Tasks 双方向同期エンドポイント
 * 【Phase 15-A】リフレッシュトークンの鍵バージョン管理対応
 *
 * 【機能】
 * - POST: FDCタスク → Google Tasks 同期（新規作成・更新）
 * - GET: Google Tasks → FDC 同期（完了状態の取得）
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  decrypt,
  encrypt,
  isValidEncryptedData,
  decryptRefreshToken,
} from '@/lib/server/encryption';
import { isTokenExpired, refreshAccessToken, getOAuthConfig } from '@/lib/google/oauth';
import { googleLogger } from '@/lib/server/logger';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// スートに対応する絵文字マッピング
const SUIT_TO_EMOJI: Record<string, string> = {
  spade: '⬛️',
  heart: '🟥',
  diamond: '🟨',
  club: '🟦',
};

// 絵文字からスートへのマッピング
const EMOJI_TO_SUIT: Record<string, string> = {
  '⬛️': 'spade',
  '⬛': 'spade',
  '🟥': 'heart',
  '🟨': 'diamond',
  '🟦': 'club',
};

// FDCタスクリスト名（Google Tasks側での識別用）
const FDC_TASK_LIST_NAME = 'FDC Todo';

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
}

interface GoogleTaskList {
  id: string;
  title: string;
}

interface UserGoogleData {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
  google_api_enabled: boolean | null;
  token_key_version: string | null;
}

/**
 * アクセストークンを取得（必要に応じてリフレッシュ）
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 */
async function getAccessToken(userId: number): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_api_enabled, token_key_version')
    .eq('id', userId)
    .single();

  if (!userData) return null;

  const typedUserData = userData as UserGoogleData;

  if (!typedUserData.google_api_enabled || !typedUserData.google_access_token) {
    return null;
  }

  const encryptedToken = JSON.parse(typedUserData.google_access_token);
  if (!isValidEncryptedData(encryptedToken)) {
    return null;
  }

  let accessToken = decrypt(encryptedToken).toString('utf8');

  if (typedUserData.google_token_expires_at && isTokenExpired(typedUserData.google_token_expires_at)) {
    if (!typedUserData.google_refresh_token) return null;

    try {
      // Phase 15-A: 新しい復号関数を使用（旧形式・新形式両対応）
      const refreshToken = decryptRefreshToken(
        typedUserData.google_refresh_token,
        typedUserData.token_key_version ?? undefined
      );
      const config = getOAuthConfig();
      const newTokens = await refreshAccessToken(config, refreshToken);

      accessToken = newTokens.accessToken;

      const newEncryptedAccessToken = encrypt(newTokens.accessToken);
      await supabase
        .from('users')
        .update({
          google_access_token: JSON.stringify(newEncryptedAccessToken),
          google_token_expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq('id', userId);
    } catch {
      return null;
    }
  }

  return accessToken;
}

/**
 * FDC用タスクリストを取得または作成
 */
async function getOrCreateFdcTaskList(accessToken: string): Promise<string> {
  // 既存のタスクリストを検索
  const listsResponse = await fetch(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listsResponse.ok) {
    throw new Error('Failed to fetch task lists');
  }

  const listsData = await listsResponse.json();
  const fdcList = (listsData.items as GoogleTaskList[] || []).find(
    (list) => list.title === FDC_TASK_LIST_NAME
  );

  if (fdcList) {
    return fdcList.id;
  }

  // FDC用リストを新規作成
  const createResponse = await fetch(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: FDC_TASK_LIST_NAME }),
    }
  );

  if (!createResponse.ok) {
    throw new Error('Failed to create FDC task list');
  }

  const newList = await createResponse.json();
  googleLogger.info({ taskListId: newList.id }, '[Google Tasks Sync] Created FDC task list');
  return newList.id;
}

/**
 * FDCタスクIDをGoogle Taskのnotesから抽出
 */
function extractFdcTaskId(notes?: string): string | null {
  if (!notes) return null;
  const match = notes.match(/\[FDC:([^\]]+)\]/);
  return match ? match[1] : null;
}

/**
 * タイトルからスートを検出
 */
function detectSuitFromTitle(title: string): string | null {
  for (const [emoji, suit] of Object.entries(EMOJI_TO_SUIT)) {
    if (title.startsWith(emoji)) {
      return suit;
    }
  }
  return null;
}

/**
 * POST /api/google/tasks/sync
 *
 * FDCタスク → Google Tasks 同期
 * - 新規タスクをGoogle Tasksに作成
 * - 完了状態を同期
 */
export async function POST(request: NextRequest) {
  googleLogger.info('[Google Tasks Sync] ========== POST START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { tasks } = body as { tasks: Array<{
      id: string;
      title: string;
      suit?: string;
      status: string;
      description?: string;
      googleTaskId?: string;
    }> };

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid tasks data' }, { status: 400 });
    }

    // FDC用タスクリストを取得または作成
    const taskListId = await getOrCreateFdcTaskList(accessToken);

    // 既存のGoogle Tasksを取得
    const existingTasksResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const existingTasksData = await existingTasksResponse.json();
    const existingTasks = (existingTasksData.items as GoogleTask[] || []);

    // FDCタスクIDでマッピング
    const taskIdMap = new Map<string, GoogleTask>();
    for (const gt of existingTasks) {
      const fdcId = extractFdcTaskId(gt.notes);
      if (fdcId) {
        taskIdMap.set(fdcId, gt);
      }
    }

    const results: Array<{ fdcTaskId: string; googleTaskId: string; action: string }> = [];

    for (const task of tasks) {
      const emoji = task.suit ? SUIT_TO_EMOJI[task.suit] : '';
      const taskTitle = emoji ? `${emoji}${task.title}` : task.title;
      const googleStatus = task.status === 'done' ? 'completed' : 'needsAction';

      const existingGoogleTask = taskIdMap.get(task.id);

      if (existingGoogleTask) {
        // 既存タスクを更新
        const updateData: Record<string, unknown> = {
          title: taskTitle,
          status: googleStatus,
        };

        await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(existingGoogleTask.id)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        );

        results.push({
          fdcTaskId: task.id,
          googleTaskId: existingGoogleTask.id,
          action: 'updated',
        });
      } else {
        // 新規タスクを作成
        const taskData = {
          title: taskTitle,
          notes: `[FDC:${task.id}]${task.description ? '\n' + task.description : ''}`,
          status: googleStatus,
        };

        const createResponse = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
          }
        );

        if (createResponse.ok) {
          const createdTask = await createResponse.json();
          results.push({
            fdcTaskId: task.id,
            googleTaskId: createdTask.id,
            action: 'created',
          });
        }
      }
    }

    googleLogger.info({ count: results.length }, '[Google Tasks Sync] Synced tasks');

    return NextResponse.json({
      success: true,
      taskListId,
      results,
    });
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks Sync] POST ERROR');
    return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
  }
}

/**
 * GET /api/google/tasks/sync
 *
 * Google Tasks → FDC 同期状態を取得
 * - Google Tasksの完了状態を返す
 * - 絵文字プレフィックス付きタスクも含む
 */
export async function GET(_request: NextRequest) {
  googleLogger.info('[Google Tasks Sync] ========== GET START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheckGet = await checkUserTenantBoundary(_request, session.user_id);
    if (!tenantCheckGet.success) {
      return tenantCheckGet.response;
    }

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    // FDC用タスクリストを取得
    const listsResponse = await fetch(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch task lists' }, { status: 500 });
    }

    const listsData = await listsResponse.json();
    const fdcList = (listsData.items as GoogleTaskList[] || []).find(
      (list) => list.title === FDC_TASK_LIST_NAME
    );

    if (!fdcList) {
      // FDCリストがまだない場合は空を返す
      return NextResponse.json({
        tasks: [],
        newTasks: [],
      });
    }

    // タスクを取得
    const tasksResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(fdcList.id)}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!tasksResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasksData = await tasksResponse.json();
    const googleTasks = (tasksData.items as GoogleTask[] || []);

    // FDCタスクと新規タスクを分離
    const fdcTasks: Array<{
      fdcTaskId: string;
      googleTaskId: string;
      status: string;
      completed: boolean;
    }> = [];

    const newTasks: Array<{
      googleTaskId: string;
      title: string;
      suit: string | null;
      status: string;
      completed: boolean;
    }> = [];

    for (const gt of googleTasks) {
      const fdcId = extractFdcTaskId(gt.notes);
      const completed = gt.status === 'completed';

      if (fdcId) {
        // FDCから同期されたタスク
        fdcTasks.push({
          fdcTaskId: fdcId,
          googleTaskId: gt.id,
          status: gt.status,
          completed,
        });
      } else {
        // Google Tasksで直接作成されたタスク（絵文字プレフィックスで分類）
        const suit = detectSuitFromTitle(gt.title);
        const cleanTitle = suit
          ? gt.title.replace(/^[⬛️⬛🟥🟨🟦]\s*/, '')
          : gt.title;

        newTasks.push({
          googleTaskId: gt.id,
          title: cleanTitle,
          suit,
          status: gt.status,
          completed,
        });
      }
    }

    googleLogger.info({ fdcTasksCount: fdcTasks.length, newTasksCount: newTasks.length }, '[Google Tasks Sync] Found tasks');

    return NextResponse.json({
      taskListId: fdcList.id,
      tasks: fdcTasks,
      newTasks,
    });
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks Sync] GET ERROR');
    return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 });
  }
}
