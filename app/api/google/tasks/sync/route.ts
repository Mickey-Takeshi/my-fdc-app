/**
 * app/api/google/tasks/sync/route.ts
 *
 * Google Tasks 双方向同期 API（Phase 14）
 * POST /api/google/tasks/sync?workspace_id=xxx
 *
 * 【同期ロジック - Last Write Wins】
 * 1. Google Tasks を取得
 * 2. FDC Tasks を取得
 * 3. Google にあって FDC にない → FDC に作成
 * 4. 両方にある → updated が新しい方を正とする
 * 5. FDC にあって Google にない → Google に作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getGoogleAccessToken } from '@/lib/server/google-auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import type { TaskRow } from '@/lib/types/task';
import type { GoogleTask, SyncResult } from '@/lib/types/google-tasks';

const DEFAULT_TASK_LIST_ID = '@default';

/**
 * POST /api/google/tasks/sync?workspace_id=xxx
 * 双方向同期を実行
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json(
      { error: 'workspace_id は必須です' },
      { status: 400 }
    );
  }

  // Phase 86: 権限チェックとトークン取得を並列実行
  const [role, accessToken] = await Promise.all([
    requireRole(user.id, workspaceId, 'MEMBER'),
    getGoogleAccessToken(user.id),
  ]);

  if (!role) {
    return NextResponse.json(
      { error: 'アクセス権限がありません' },
      { status: 403 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Google API 連携が無効です。再ログインしてください。' },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  const result: SyncResult = {
    createdInFdc: 0,
    updatedInFdc: 0,
    createdInGoogle: 0,
    updatedInGoogle: 0,
    errors: [],
    lastSyncAt: new Date().toISOString(),
  };

  try {
    // 1. Google Tasks を取得
    const googleTasks = await fetchAllGoogleTasks(accessToken);

    // 2. FDC Tasks を取得（このワークスペースのもの）
    const { data: fdcRows } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    const fdcTasks = (fdcRows ?? []) as TaskRow[];

    // google_task_id でインデックスを作成
    const fdcByGoogleId = new Map<string, TaskRow>();
    for (const ft of fdcTasks) {
      if (ft.google_task_id) {
        fdcByGoogleId.set(ft.google_task_id, ft);
      }
    }

    const processedGoogleIds = new Set<string>();

    // 3. Google → FDC 同期
    for (const gt of googleTasks) {
      processedGoogleIds.add(gt.id);
      const existing = fdcByGoogleId.get(gt.id);

      if (!existing) {
        // Google にあって FDC にない → FDC に作成
        try {
          await supabase.from('tasks').insert({
            workspace_id: workspaceId,
            title: gt.title || '(no title)',
            description: gt.notes || '',
            status: gt.status === 'completed' ? 'done' : 'not_started',
            suit: null,
            due_date: gt.due ? gt.due.split('T')[0] : null,
            priority: 0,
            google_task_id: gt.id,
            google_task_list_id: DEFAULT_TASK_LIST_ID,
            last_synced_at: result.lastSyncAt,
          });
          result.createdInFdc++;
        } catch (err) {
          result.errors.push(
            `FDC作成失敗: ${gt.title} - ${err instanceof Error ? err.message : 'unknown'}`
          );
        }
      } else {
        // 両方にある → Last Write Wins
        const googleUpdated = new Date(gt.updated).getTime();
        const fdcUpdated = new Date(existing.updated_at).getTime();
        const lastSynced = existing.last_synced_at
          ? new Date(existing.last_synced_at).getTime()
          : 0;

        if (googleUpdated > fdcUpdated && googleUpdated > lastSynced) {
          // Google が新しい → FDC を更新
          try {
            await supabase
              .from('tasks')
              .update({
                title: gt.title || existing.title,
                description: gt.notes || existing.description,
                status: gt.status === 'completed' ? 'done' : mapFdcStatus(existing.status),
                due_date: gt.due ? gt.due.split('T')[0] : existing.due_date,
                last_synced_at: result.lastSyncAt,
              })
              .eq('id', existing.id);
            result.updatedInFdc++;
          } catch (err) {
            result.errors.push(
              `FDC更新失敗: ${gt.title} - ${err instanceof Error ? err.message : 'unknown'}`
            );
          }
        } else if (fdcUpdated > lastSynced) {
          // FDC が新しい → Google を更新
          try {
            await updateGoogleTask(accessToken, gt.id, existing);
            // last_synced_at を更新
            await supabase
              .from('tasks')
              .update({ last_synced_at: result.lastSyncAt })
              .eq('id', existing.id);
            result.updatedInGoogle++;
          } catch (err) {
            result.errors.push(
              `Google更新失敗: ${existing.title} - ${err instanceof Error ? err.message : 'unknown'}`
            );
          }
        } else {
          // 変更なし → last_synced_at だけ更新
          await supabase
            .from('tasks')
            .update({ last_synced_at: result.lastSyncAt })
            .eq('id', existing.id);
        }
      }
    }

    // 4. FDC → Google 同期（Google にないタスク）
    for (const ft of fdcTasks) {
      if (ft.google_task_id && processedGoogleIds.has(ft.google_task_id)) {
        continue; // 既に処理済み
      }

      if (ft.google_task_id) {
        // google_task_id があるが Google 側にない → Google で削除された可能性
        // last_synced_at がある場合は Google で削除されたと判断して FDC でも紐付け解除
        if (ft.last_synced_at) {
          await supabase
            .from('tasks')
            .update({
              google_task_id: null,
              google_task_list_id: null,
              last_synced_at: null,
            })
            .eq('id', ft.id);
        }
        continue;
      }

      // FDC にあって Google にない → Google に作成
      try {
        const created = await createGoogleTask(accessToken, ft);
        if (created) {
          await supabase
            .from('tasks')
            .update({
              google_task_id: created.id,
              google_task_list_id: DEFAULT_TASK_LIST_ID,
              last_synced_at: result.lastSyncAt,
            })
            .eq('id', ft.id);
          result.createdInGoogle++;
        }
      } catch (err) {
        result.errors.push(
          `Google作成失敗: ${ft.title} - ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    }

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: '同期処理に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * Google Tasks を全件取得
 */
async function fetchAllGoogleTasks(
  accessToken: string
): Promise<GoogleTask[]> {
  const params = new URLSearchParams({
    showCompleted: 'true',
    showHidden: 'false',
    maxResults: '100',
  });

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(DEFAULT_TASK_LIST_ID)}/tasks?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Google Tasks API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.items ?? []).filter(
    (item: GoogleTask) => !item.deleted && !item.hidden
  );
}

/**
 * FDC Task → Google Task に変換して作成
 */
async function createGoogleTask(
  accessToken: string,
  fdcTask: TaskRow
): Promise<GoogleTask | null> {
  const body: Record<string, string> = {
    title: fdcTask.title,
  };

  if (fdcTask.description) {
    body.notes = fdcTask.description;
  }

  if (fdcTask.due_date) {
    body.due = new Date(fdcTask.due_date).toISOString();
  }

  if (fdcTask.status === 'done') {
    body.status = 'completed';
  }

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(DEFAULT_TASK_LIST_ID)}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Task create error: ${res.status}`);
  }

  return await res.json();
}

/**
 * FDC Task の変更を Google Task に反映
 */
async function updateGoogleTask(
  accessToken: string,
  googleTaskId: string,
  fdcTask: TaskRow
): Promise<void> {
  const body: Record<string, string | null> = {
    title: fdcTask.title,
    notes: fdcTask.description || '',
  };

  if (fdcTask.due_date) {
    body.due = new Date(fdcTask.due_date).toISOString();
  }

  body.status = fdcTask.status === 'done' ? 'completed' : 'needsAction';

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(DEFAULT_TASK_LIST_ID)}/tasks/${encodeURIComponent(googleTaskId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Task update error: ${res.status}`);
  }
}

/**
 * FDC のステータスを維持（Google の completed → done 以外はそのまま）
 */
function mapFdcStatus(status: string): string {
  if (['not_started', 'in_progress', 'done'].includes(status)) {
    return status;
  }
  return 'not_started';
}
