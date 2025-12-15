/**
 * app/api/workspaces/[workspaceId]/leads/[leadId]/convert/route.ts
 *
 * Phase 7: リード → クライアント変換 API
 *
 * POST - リードをクライアントに変換
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; leadId: string }>;
}

/**
 * 認証チェック
 */
async function checkAuth(request: NextRequest, workspaceId: string) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { error: 'Database not configured', status: 500 };
  }

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return { session, supabase, role: membership.role };
}

/**
 * POST /api/workspaces/[workspaceId]/leads/[leadId]/convert
 *
 * リードをクライアントに変換
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    // リード取得
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 既に変換済みかチェック
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: 'Lead already converted to client', clientId: existingClient.id },
        { status: 409 }
      );
    }

    // ステータスチェック（WON でなくても変換可能だが警告）
    const isWon = lead.status === 'WON';

    // クライアント作成
    const initialHistory = [
      {
        date: new Date().toISOString(),
        action: '顧客登録',
        note: `リード「${lead.contact_person}」から変換`,
      },
    ];

    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        email: lead.email,
        phone: lead.phone,
        status: 'client',
        notes: lead.memo,
        history: initialHistory,
      })
      .select()
      .single();

    if (insertError || !client) {
      console.error('[Convert API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    // リードのステータスを WON に更新（まだでなければ）
    if (!isWon) {
      await supabase.from('leads').update({ status: 'WON' }).eq('id', leadId);
    }

    const result = {
      id: client.id,
      workspaceId: client.workspace_id,
      leadId: client.lead_id,
      companyName: client.company_name,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone,
      status: client.status,
      contractDeadline: client.contract_deadline,
      nextMeeting: client.next_meeting,
      notes: client.notes,
      history: client.history || [],
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    };

    console.log('[Convert API] Converted lead to client:', result.id);
    return NextResponse.json({ client: result }, { status: 201 });
  } catch (error) {
    console.error('[Convert API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
