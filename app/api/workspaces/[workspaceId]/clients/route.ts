/**
 * app/api/workspaces/[workspaceId]/clients/route.ts
 *
 * Phase 7: Clients CRUD API
 *
 * GET  - クライアント一覧取得
 * POST - クライアント作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateClientSchema } from '@/lib/types/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * 認証 + ワークスペースアクセスチェック
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
 * GET /api/workspaces/[workspaceId]/clients
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('clients')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Clients API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // snake_case → camelCase
    const clients = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      leadId: row.lead_id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      status: row.status,
      contractDeadline: row.contract_deadline,
      nextMeeting: row.next_meeting,
      notes: row.notes,
      history: row.history || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/clients
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = CreateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 初期履歴
    const initialHistory = [
      {
        date: new Date().toISOString(),
        action: '顧客登録',
        note: input.leadId ? 'リードから変換' : '新規登録',
      },
    ];

    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        lead_id: input.leadId,
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        status: input.status,
        contract_deadline: input.contractDeadline,
        next_meeting: input.nextMeeting,
        notes: input.notes,
        history: initialHistory,
      })
      .select()
      .single();

    if (error) {
      console.error('[Clients API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    const client = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      contractDeadline: data.contract_deadline,
      nextMeeting: data.next_meeting,
      notes: data.notes,
      history: data.history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Clients API] Created client:', client.id);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
