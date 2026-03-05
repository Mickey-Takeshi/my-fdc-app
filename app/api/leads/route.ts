/**
 * app/api/leads/route.ts
 *
 * リード一覧取得・作成 API（Phase 6）
 * GET  /api/leads?workspace_id=xxx - リード一覧（ワークスペース単位）
 * POST /api/leads - リード作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toProspect, type LeadRow } from '@/lib/types/prospect';

const CreateLeadSchema = z.object({
  workspace_id: z.uuid(),
  company_name: z.string().min(1, '会社名は必須です').max(200),
  contact_person: z.string().min(1, '担当者名は必須です').max(100),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(['new', 'approaching', 'negotiating', 'proposing', 'won', 'lost'] as const).optional(),
  channel: z.string().max(100).optional().or(z.literal('')),
  memo: z.string().max(2000).optional().or(z.literal('')),
});

/**
 * GET /api/leads?workspace_id=xxx
 * リード一覧（MEMBER 以上）
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
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Leads list error:', error);
    return NextResponse.json(
      { error: 'リードの取得に失敗しました' },
      { status: 500 }
    );
  }

  const leads = (data as LeadRow[]).map(toProspect);
  return NextResponse.json({ leads });
}

/**
 * POST /api/leads
 * リード作成（MEMBER 以上）
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

  const result = CreateLeadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...leadData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id,
      company_name: leadData.company_name,
      contact_person: leadData.contact_person,
      email: leadData.email || '',
      phone: leadData.phone || '',
      status: leadData.status || 'new',
      channel: leadData.channel || '',
      memo: leadData.memo || '',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Lead create error:', error);
    return NextResponse.json(
      { error: 'リードの作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { lead: toProspect(data as LeadRow) },
    { status: 201 }
  );
}
