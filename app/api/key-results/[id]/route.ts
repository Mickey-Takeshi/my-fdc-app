/**
 * app/api/key-results/[id]/route.ts
 *
 * 個別 Key Result 操作 API（Phase 11）
 * PUT    /api/key-results/:id
 * DELETE /api/key-results/:id
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toKeyResult, type KeyResultRow } from '@/lib/types/okr';

const UpdateKeyResultSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  target_value: z.number().min(0).optional(),
  current_value: z.number().min(0).optional(),
  unit: z.string().max(20).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getKeyResultWithAuth(request: NextRequest, krId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: kr } = await supabase
    .from('key_results')
    .select('*')
    .eq('id', krId)
    .single();

  if (!kr) {
    return { error: NextResponse.json({ error: 'Key Result が見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, kr.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, kr: kr as KeyResultRow, role, supabase };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getKeyResultWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
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

  const result = UpdateKeyResultSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | number> = {};
  const parsed = result.data;
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.target_value !== undefined) updateData.target_value = parsed.target_value;
  if (parsed.current_value !== undefined) updateData.current_value = parsed.current_value;
  if (parsed.unit !== undefined) updateData.unit = parsed.unit;

  const { data, error } = await authResult.supabase
    .from('key_results')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('KeyResult update error:', error);
    return NextResponse.json(
      { error: 'Key Result の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ keyResult: toKeyResult(data as KeyResultRow) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getKeyResultWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const adminRole = await requireRole(authResult.user.id, authResult.kr.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'Key Result の削除には ADMIN 以上の権限が必要です' },
      { status: 403 }
    );
  }

  // 紐付き ActionMap の key_result_id をクリア
  await authResult.supabase
    .from('action_maps')
    .update({ key_result_id: null })
    .eq('key_result_id', id);

  const { error } = await authResult.supabase
    .from('key_results')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('KeyResult delete error:', error);
    return NextResponse.json(
      { error: 'Key Result の削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
