/**
 * app/api/workspaces/[workspaceId]/okr/objectives/route.ts
 *
 * Phase 11: Objectives API
 * GET  - Objective一覧取得（KR進捗込み）
 * POST - Objective作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateObjectiveInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

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

  return { session, supabase };
}

// GET: Objective一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = supabase
      .from('objectives')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: objectivesData, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 各ObjectiveのKRを取得して進捗計算
    const objectives = await Promise.all(
      (objectivesData || []).map(async (obj) => {
        const { data: krs } = await supabase
          .from('key_results')
          .select('*')
          .eq('objective_id', obj.id);

        const keyResults = krs || [];
        const completedCount = keyResults.filter((kr) => {
          const progress = calculateKeyResultProgress(kr.current_value, kr.target_value);
          return progress >= 100;
        }).length;

        const totalProgress = keyResults.reduce((sum, kr) => {
          return sum + calculateKeyResultProgress(kr.current_value, kr.target_value);
        }, 0);

        const progress = keyResults.length > 0
          ? Math.round(totalProgress / keyResults.length)
          : 0;

        return {
          id: obj.id,
          workspaceId: obj.workspace_id,
          title: obj.title,
          description: obj.description,
          period: obj.period,
          isArchived: obj.is_archived,
          createdAt: obj.created_at,
          updatedAt: obj.updated_at,
          progress,
          keyResultCount: keyResults.length,
          completedKeyResultCount: completedCount,
        };
      })
    );

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('Error in GET /okr/objectives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Objective作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateObjectiveInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('objectives')
      .insert({
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        period: input.period,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const objective = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      period: data.period,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: 0,
      keyResultCount: 0,
      completedKeyResultCount: 0,
    };

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    console.error('Error in POST /okr/objectives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
