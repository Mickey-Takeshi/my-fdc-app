/**
 * app/api/workspaces/[workspaceId]/approaches/stats/route.ts
 *
 * Phase 8: アプローチ統計 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { calculateApproachStats } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  // ワークスペースアクセス確認
  const { data: membership, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // 全アプローチ取得
    const { data, error } = await supabase
      .from('approaches')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[Approaches Stats API] Error:', error);
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

    const stats = calculateApproachStats(approaches);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Approaches Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
