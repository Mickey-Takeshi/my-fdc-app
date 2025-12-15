/**
 * app/api/workspaces/[workspaceId]/goals/[goalId]/route.ts
 *
 * Phase 8: 個別目標API
 * GET: 目標取得
 * PATCH: 目標更新
 * DELETE: 目標削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateApproachGoalInputSchema } from '@/lib/types/pdca';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; goalId: string }>;
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

  // ワークスペースメンバーシップ確認
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return { session, supabase };
}

// GET: 目標取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, goalId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('approach_goals')
      .select('*')
      .eq('id', goalId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const goal = {
      id: data.id,
      workspaceId: data.workspace_id,
      periodType: data.period_type,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      targetCount: data.target_count,
      targetSuccessRate: data.target_success_rate,
      improvementNote: data.improvement_note,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error in GET /goals/[goalId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: 目標更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, goalId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateApproachGoalInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (input.targetCount !== undefined) {
      updateData.target_count = input.targetCount;
    }
    if (input.targetSuccessRate !== undefined) {
      updateData.target_success_rate = input.targetSuccessRate;
    }
    if (input.improvementNote !== undefined) {
      updateData.improvement_note = input.improvementNote;
    }

    const { data, error } = await supabase
      .from('approach_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const goal = {
      id: data.id,
      workspaceId: data.workspace_id,
      periodType: data.period_type,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      targetCount: data.target_count,
      targetSuccessRate: data.target_success_rate,
      improvementNote: data.improvement_note,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error in PATCH /goals/[goalId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 目標削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, goalId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { error } = await supabase
      .from('approach_goals')
      .delete()
      .eq('id', goalId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /goals/[goalId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
