/**
 * app/api/workspaces/[workspaceId]/goals/route.ts
 *
 * Phase 8: PDCA目標管理API
 * GET: 目標一覧取得
 * POST: 目標作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateApproachGoalInputSchema } from '@/lib/types/pdca';

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

// GET: 目標一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // クエリパラメータ
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType'); // weekly or monthly
    const current = searchParams.get('current'); // true: 現在の期間のみ

    let query = supabase
      .from('approach_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('period_start', { ascending: false });

    if (periodType) {
      query = query.eq('period_type', periodType);
    }

    if (current === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('period_start', today).gte('period_end', today);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // snake_case → camelCase変換
    const goals = (data || []).map((g) => ({
      id: g.id,
      workspaceId: g.workspace_id,
      periodType: g.period_type,
      periodStart: g.period_start,
      periodEnd: g.period_end,
      targetCount: g.target_count,
      targetSuccessRate: g.target_success_rate,
      improvementNote: g.improvement_note,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error in GET /goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 目標作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateApproachGoalInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 作成
    const { data, error } = await supabase
      .from('approach_goals')
      .insert({
        workspace_id: workspaceId,
        period_type: input.periodType,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        target_count: input.targetCount,
        target_success_rate: input.targetSuccessRate ?? null,
        improvement_note: input.improvementNote ?? null,
      })
      .select()
      .single();

    if (error) {
      // 重複エラー
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'この期間の目標は既に存在します' },
          { status: 409 }
        );
      }
      console.error('Error creating goal:', error);
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

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error in POST /goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
