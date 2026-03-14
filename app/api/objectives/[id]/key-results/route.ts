/**
 * app/api/objectives/[id]/key-results/route.ts
 *
 * Key Result 作成 API（Phase 11）
 * POST /api/objectives/:id/key-results
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toKeyResult, type KeyResultRow } from '@/lib/types/okr';

const CreateKeyResultSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  target_value: z.number().min(0).optional(),
  current_value: z.number().min(0).optional(),
  unit: z.string().max(20).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: objectiveId } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: obj } = await supabase
    .from('objectives')
    .select('workspace_id')
    .eq('id', objectiveId)
    .single();

  if (!obj) {
    return NextResponse.json({ error: 'Objective が見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, obj.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
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

  const result = CreateKeyResultSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const krData = result.data;

  const { data, error } = await supabase
    .from('key_results')
    .insert({
      objective_id: objectiveId,
      workspace_id: obj.workspace_id,
      title: krData.title,
      target_value: krData.target_value ?? 100,
      current_value: krData.current_value ?? 0,
      unit: krData.unit || '%',
    })
    .select('*')
    .single();

  if (error) {
    console.error('KeyResult create error:', error);
    return NextResponse.json(
      { error: 'Key Result の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { keyResult: toKeyResult(data as KeyResultRow) },
    { status: 201 }
  );
}
