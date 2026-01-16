/**
 * app/api/workspaces/[workspaceId]/approaches/route.ts
 *
 * Phase 8: Approaches API
 *
 * GET  - アプローチ一覧取得
 * POST - アプローチ作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateApproachSchema } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/approaches
 * クエリパラメータ: leadId, type, from, to
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
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('approaches')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('approached_at', { ascending: false });

    // リードIDフィルター
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    // タイプフィルター
    if (type) {
      query = query.eq('type', type);
    }

    // 日付範囲フィルター
    if (from) {
      query = query.gte('approached_at', from);
    }
    if (to) {
      query = query.lte('approached_at', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Approaches API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch approaches' },
        { status: 500 }
      );
    }

    // snake_case → camelCase
    const approaches = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      leadId: row.lead_id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      result: row.result,
      resultNote: row.result_note,
      approachedAt: row.approached_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ approaches });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/approaches
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { session, supabase } = auth;

  try {
    const body = await request.json();
    const parsed = CreateApproachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // リードの存在確認
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', input.leadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('approaches')
      .insert({
        workspace_id: workspaceId,
        lead_id: input.leadId,
        user_id: session.userId,
        type: input.type,
        content: input.content,
        result: input.result,
        result_note: input.resultNote,
        approached_at: input.approachedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Approaches API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create approach' },
        { status: 500 }
      );
    }

    const approach = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      result: data.result,
      resultNote: data.result_note,
      approachedAt: data.approached_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Approaches API] Created approach:', approach.id);
    return NextResponse.json({ approach }, { status: 201 });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
