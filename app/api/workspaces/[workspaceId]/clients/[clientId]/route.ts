/**
 * app/api/workspaces/[workspaceId]/clients/[clientId]/route.ts
 *
 * Phase 7: Client 個別操作 API
 *
 * GET    - クライアント詳細取得
 * PATCH  - クライアント更新
 * DELETE - クライアント削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateClientSchema } from '@/lib/types/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; clientId: string }>;
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
 * GET /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
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

  return NextResponse.json({ client });
}

/**
 * PATCH /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateClientSchema.safeParse({ ...body, id: clientId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // camelCase → snake_case
    const updateData: Record<string, unknown> = {};
    if (input.companyName !== undefined)
      updateData.company_name = input.companyName;
    if (input.contactPerson !== undefined)
      updateData.contact_person = input.contactPerson;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.contractDeadline !== undefined)
      updateData.contract_deadline = input.contractDeadline;
    if (input.nextMeeting !== undefined)
      updateData.next_meeting = input.nextMeeting;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.history !== undefined) updateData.history = input.history;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Clients API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update client' },
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

    console.log('[Clients API] Updated client:', client.id);
    return NextResponse.json({ client });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Clients API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }

  console.log('[Clients API] Deleted client:', clientId);
  return NextResponse.json({ success: true });
}
