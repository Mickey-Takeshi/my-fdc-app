/**
 * app/api/workspaces/[workspaceId]/leads/route.ts
 *
 * Phase 6: Leads CRUD API
 *
 * GET  - リード一覧取得
 * POST - リード作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateLeadSchema } from '@/lib/types/lead';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/leads
 * リード一覧を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // ステータスフィルター
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // 検索フィルター
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,memo.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Leads API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // snake_case → camelCase 変換
    const leads = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      status: row.status,
      channel: row.channel,
      memo: row.memo,
      tags: row.tags,
      lostReason: row.lost_reason,
      lostFeedback: row.lost_feedback,
      reminder: row.reminder,
      reminderNote: row.reminder_note,
      nextMeeting: row.next_meeting,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/leads
 * リード作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = CreateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        status: input.status,
        channel: input.channel,
        memo: input.memo,
        tags: input.tags,
      })
      .select()
      .single();

    if (error) {
      console.error('[Leads API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Leads API] Created lead:', lead.id);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
