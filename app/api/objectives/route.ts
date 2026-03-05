/**
 * app/api/objectives/route.ts
 *
 * Objective 一覧取得・作成 API（Phase 11）
 * GET  /api/objectives?workspace_id=xxx
 * POST /api/objectives
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import {
  toObjective,
  toKeyResult,
  type ObjectiveRow,
  type KeyResultRow,
  type Objective,
} from '@/lib/types/okr';

const CreateObjectiveSchema = z.object({
  workspace_id: z.uuid(),
  title: z.string().min(1, 'タイトルは必須です').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  period: z.string().min(1, '期間は必須です').max(50),
});

/**
 * Objective に KeyResults と進捗を結合
 */
async function enrichObjectives(
  objectives: Objective[],
  workspaceId: string
): Promise<Objective[]> {
  if (objectives.length === 0) return objectives;

  const supabase = createServiceClient();

  // KeyResults を取得
  const { data: krRows } = await supabase
    .from('key_results')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  const keyResults = (krRows as KeyResultRow[] | null)?.map(toKeyResult) ?? [];

  // ActionMaps の key_result_id を確認
  const { data: actionMaps } = await supabase
    .from('action_maps')
    .select('id, key_result_id')
    .eq('workspace_id', workspaceId)
    .not('key_result_id', 'is', null);

  const actionMapsByKr = (actionMaps ?? []).reduce<Record<string, number>>((acc, am) => {
    const krId = am.key_result_id as string;
    acc[krId] = (acc[krId] || 0) + 1;
    return acc;
  }, {});

  // KR に linked ActionMap count を追加
  const krsWithLinks = keyResults.map((kr) => ({
    ...kr,
    linkedActionMapCount: actionMapsByKr[kr.id] || 0,
  }));

  // Objective に KR と progress を結合
  return objectives.map((obj) => {
    const objKrs = krsWithLinks.filter((kr) => kr.objectiveId === obj.id);
    const progressRate = objKrs.length > 0
      ? Math.round(objKrs.reduce((sum, kr) => sum + (kr.progressRate ?? 0), 0) / objKrs.length)
      : 0;

    return { ...obj, keyResults: objKrs, progressRate };
  });
}

/**
 * GET /api/objectives?workspace_id=xxx
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id は必須です' }, { status: 400 });
  }

  const role = await requireRole(user.id, workspaceId, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('objectives')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Objectives list error:', error);
    return NextResponse.json(
      { error: 'Objective の取得に失敗しました' },
      { status: 500 }
    );
  }

  const objectives = (data as ObjectiveRow[]).map(toObjective);
  const enriched = await enrichObjectives(objectives, workspaceId);

  return NextResponse.json({ objectives: enriched });
}

/**
 * POST /api/objectives
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの形式が不正です' },
      { status: 400 }
    );
  }

  const result = CreateObjectiveSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...objData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('objectives')
    .insert({
      workspace_id,
      title: objData.title,
      description: objData.description || '',
      period: objData.period,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Objective create error:', error);
    return NextResponse.json(
      { error: 'Objective の作成に失敗しました' },
      { status: 500 }
    );
  }

  const objective = toObjective(data as ObjectiveRow);
  return NextResponse.json(
    { objective: { ...objective, keyResults: [], progressRate: 0 } },
    { status: 201 }
  );
}
