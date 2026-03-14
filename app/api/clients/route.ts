/**
 * app/api/clients/route.ts
 *
 * クライアント一覧取得・作成 API（Phase 7）
 * GET  /api/clients?workspace_id=xxx - クライアント一覧
 * POST /api/clients - クライアント作成（リードからの変換含む）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toClient, type ClientRow } from '@/lib/types/client';

const CreateClientSchema = z.object({
  workspace_id: z.uuid(),
  company_name: z.string().max(200).optional().or(z.literal('')),
  contact_person: z.string().min(1, '担当者名は必須です').max(100),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  lead_id: z.uuid().optional(),
});

/**
 * GET /api/clients?workspace_id=xxx
 * クライアント一覧（MEMBER 以上）
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
    .from('clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Clients list error:', error);
    return NextResponse.json(
      { error: 'クライアントの取得に失敗しました' },
      { status: 500 }
    );
  }

  const clients = (data as ClientRow[]).map(toClient);
  return NextResponse.json({ clients });
}

/**
 * POST /api/clients
 * クライアント作成（MEMBER 以上）
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

  const result = CreateClientSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, lead_id, ...clientData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // リードからの変換の場合、リードのステータスを won に更新
  if (lead_id) {
    await supabase
      .from('leads')
      .update({ status: 'won' })
      .eq('id', lead_id)
      .eq('workspace_id', workspace_id);
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      workspace_id,
      lead_id: lead_id || null,
      company_name: clientData.company_name || '',
      contact_person: clientData.contact_person,
      email: clientData.email || '',
      phone: clientData.phone || '',
      status: 'active',
      notes: clientData.notes || '',
      history: lead_id
        ? [{ date: new Date().toISOString(), action: 'リードから変換' }]
        : [{ date: new Date().toISOString(), action: 'クライアント作成' }],
    })
    .select('*')
    .single();

  if (error) {
    console.error('Client create error:', error);
    return NextResponse.json(
      { error: 'クライアントの作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { client: toClient(data as ClientRow) },
    { status: 201 }
  );
}
