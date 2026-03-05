/**
 * app/api/clients/[id]/route.ts
 *
 * 個別クライアント操作 API（Phase 7）
 * GET    /api/clients/:id - クライアント詳細
 * PUT    /api/clients/:id - クライアント更新
 * DELETE /api/clients/:id - クライアント削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toClient, type ClientRow } from '@/lib/types/client';

const UpdateClientSchema = z.object({
  company_name: z.string().max(200).optional(),
  contact_person: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive'] as const).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  contract_deadline: z.string().optional().nullable(),
  next_meeting: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * クライアントの workspace_id を取得して権限チェック
 */
async function getClientWithAuth(
  request: NextRequest,
  clientId: string
) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (!client) {
    return { error: NextResponse.json({ error: 'クライアントが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, client.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, client: client as ClientRow, role, supabase };
}

/**
 * GET /api/clients/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getClientWithAuth(request, id);

  if ('error' in result && result.error) {
    return result.error;
  }

  return NextResponse.json({ client: toClient(result.client) });
}

/**
 * PUT /api/clients/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getClientWithAuth(request, id);

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

  const result = UpdateClientSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | null> = {};
  const parsed = result.data;
  if (parsed.company_name !== undefined) updateData.company_name = parsed.company_name;
  if (parsed.contact_person !== undefined) updateData.contact_person = parsed.contact_person;
  if (parsed.email !== undefined) updateData.email = parsed.email;
  if (parsed.phone !== undefined) updateData.phone = parsed.phone;
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.notes !== undefined) updateData.notes = parsed.notes;
  if (parsed.contract_deadline !== undefined) updateData.contract_deadline = parsed.contract_deadline ?? null;
  if (parsed.next_meeting !== undefined) updateData.next_meeting = parsed.next_meeting ?? null;

  const { data, error } = await authResult.supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Client update error:', error);
    return NextResponse.json(
      { error: 'クライアントの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ client: toClient(data as ClientRow) });
}

/**
 * DELETE /api/clients/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getClientWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const adminRole = await requireRole(authResult.user.id, authResult.client.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'クライアントの削除には ADMIN 以上の権限が必要です' },
      { status: 403 }
    );
  }

  const { error } = await authResult.supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Client delete error:', error);
    return NextResponse.json(
      { error: 'クライアントの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
