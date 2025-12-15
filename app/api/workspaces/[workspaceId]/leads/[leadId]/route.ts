/**
 * app/api/workspaces/[workspaceId]/leads/[leadId]/route.ts
 *
 * Phase 6: Lead 個別操作 API
 *
 * GET    - リード詳細取得
 * PATCH  - リード更新
 * DELETE - リード削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateLeadSchema } from '@/lib/types/lead';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; leadId: string }>;
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
 * GET /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = {
    id: data.id,
    workspaceId: data.workspace_id,
    companyName: data.company_name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    status: data.status,
    channel: data.channel,
    memo: data.memo,
    tags: data.tags,
    lostReason: data.lost_reason,
    lostFeedback: data.lost_feedback,
    reminder: data.reminder,
    reminderNote: data.reminder_note,
    nextMeeting: data.next_meeting,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ lead });
}

/**
 * PATCH /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateLeadSchema.safeParse({ ...body, id: leadId });

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
    if (input.channel !== undefined) updateData.channel = input.channel;
    if (input.memo !== undefined) updateData.memo = input.memo;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.lostReason !== undefined)
      updateData.lost_reason = input.lostReason;
    if (input.lostFeedback !== undefined)
      updateData.lost_feedback = input.lostFeedback;
    if (input.reminder !== undefined) updateData.reminder = input.reminder;
    if (input.reminderNote !== undefined)
      updateData.reminder_note = input.reminderNote;
    if (input.nextMeeting !== undefined)
      updateData.next_meeting = input.nextMeeting;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Leads API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    const lead = {
      id: data.id,
      workspaceId: data.workspace_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      channel: data.channel,
      memo: data.memo,
      tags: data.tags,
      lostReason: data.lost_reason,
      lostFeedback: data.lost_feedback,
      reminder: data.reminder,
      reminderNote: data.reminder_note,
      nextMeeting: data.next_meeting,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Leads API] Updated lead:', lead.id);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Leads API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }

  console.log('[Leads API] Deleted lead:', leadId);
  return NextResponse.json({ success: true });
}
