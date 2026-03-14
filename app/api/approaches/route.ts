/**
 * app/api/approaches/route.ts
 *
 * アプローチ一覧取得・作成 API（Phase 8）
 * GET  /api/approaches?workspace_id=xxx&lead_id=yyy - アプローチ一覧
 * POST /api/approaches - アプローチ記録
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toApproach, type ApproachRow } from '@/lib/types/approach';

const CreateApproachSchema = z.object({
  workspace_id: z.uuid(),
  lead_id: z.uuid(),
  type: z.enum(['call', 'email', 'meeting', 'visit', 'other'] as const),
  content: z.string().min(1, '内容は必須です').max(2000),
  result: z.enum(['positive', 'neutral', 'negative', ''] as const).optional(),
  result_note: z.string().max(1000).optional().or(z.literal('')),
  approached_at: z.string().optional(),
});

/**
 * GET /api/approaches?workspace_id=xxx[&lead_id=yyy]
 * アプローチ一覧（MEMBER 以上）
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

  const leadId = request.nextUrl.searchParams.get('lead_id');
  const supabase = createServiceClient();

  let query = supabase
    .from('approaches')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('approached_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Approaches list error:', error);
    return NextResponse.json(
      { error: 'アプローチの取得に失敗しました' },
      { status: 500 }
    );
  }

  const approaches = (data as ApproachRow[]).map(toApproach);
  return NextResponse.json({ approaches });
}

/**
 * POST /api/approaches
 * アプローチ記録（MEMBER 以上）
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

  const result = CreateApproachSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...approachData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('approaches')
    .insert({
      workspace_id,
      lead_id: approachData.lead_id,
      user_id: user.id,
      type: approachData.type,
      content: approachData.content,
      result: approachData.result || '',
      result_note: approachData.result_note || '',
      approached_at: approachData.approached_at || new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Approach create error:', error);
    return NextResponse.json(
      { error: 'アプローチの記録に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { approach: toApproach(data as ApproachRow) },
    { status: 201 }
  );
}
