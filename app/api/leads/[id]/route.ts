/**
 * app/api/leads/[id]/route.ts
 *
 * 個別リード操作 API（Phase 6）
 * GET    /api/leads/:id - リード詳細
 * PUT    /api/leads/:id - リード更新
 * DELETE /api/leads/:id - リード削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toProspect, type LeadRow } from '@/lib/types/prospect';

const UpdateLeadSchema = z.object({
  company_name: z.string().min(1).max(200).optional(),
  contact_person: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(['new', 'approaching', 'negotiating', 'proposing', 'won', 'lost'] as const).optional(),
  channel: z.string().max(100).optional().or(z.literal('')),
  memo: z.string().max(2000).optional().or(z.literal('')),
  lost_reason: z.string().max(500).optional().or(z.literal('')),
  lost_feedback: z.string().max(1000).optional().or(z.literal('')),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * リードの workspace_id を取得して権限チェック
 */
async function getLeadWithAuth(
  request: NextRequest,
  leadId: string
) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    return { error: NextResponse.json({ error: 'リードが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, lead.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, lead: lead as LeadRow, role, supabase };
}

/**
 * GET /api/leads/:id
 * リード詳細
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getLeadWithAuth(request, id);

  if ('error' in result && result.error) {
    return result.error;
  }

  return NextResponse.json({ lead: toProspect(result.lead) });
}

/**
 * PUT /api/leads/:id
 * リード更新（MEMBER 以上）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getLeadWithAuth(request, id);

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

  const result = UpdateLeadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string> = {};
  const parsed = result.data;
  if (parsed.company_name !== undefined) updateData.company_name = parsed.company_name;
  if (parsed.contact_person !== undefined) updateData.contact_person = parsed.contact_person;
  if (parsed.email !== undefined) updateData.email = parsed.email;
  if (parsed.phone !== undefined) updateData.phone = parsed.phone;
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.channel !== undefined) updateData.channel = parsed.channel;
  if (parsed.memo !== undefined) updateData.memo = parsed.memo;
  if (parsed.lost_reason !== undefined) updateData.lost_reason = parsed.lost_reason;
  if (parsed.lost_feedback !== undefined) updateData.lost_feedback = parsed.lost_feedback;

  const { data, error } = await authResult.supabase
    .from('leads')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Lead update error:', error);
    return NextResponse.json(
      { error: 'リードの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ lead: toProspect(data as LeadRow) });
}

/**
 * DELETE /api/leads/:id
 * リード削除（ADMIN 以上）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getLeadWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  // 削除は ADMIN 以上
  const adminRole = await requireRole(authResult.user.id, authResult.lead.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'リードの削除には ADMIN 以上の権限が必要です' },
      { status: 403 }
    );
  }

  const { error } = await authResult.supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Lead delete error:', error);
    return NextResponse.json(
      { error: 'リードの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
