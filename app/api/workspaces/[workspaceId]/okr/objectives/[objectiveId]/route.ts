/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/route.ts
 *
 * Phase 11: 個別Objective API
 * GET    - Objective取得（KR一覧付き）
 * PATCH  - Objective更新
 * DELETE - Objective削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateObjectiveInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string }>;
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

// GET: Objective取得（KR一覧付き）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data: obj, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // KR一覧取得
    const { data: krsData } = await supabase
      .from('key_results')
      .select('*')
      .eq('objective_id', objectiveId)
      .order('created_at', { ascending: true });

    const keyResults = (krsData || []).map((kr) => {
      const progress = calculateKeyResultProgress(kr.current_value, kr.target_value);
      return {
        id: kr.id,
        objectiveId: kr.objective_id,
        workspaceId: kr.workspace_id,
        title: kr.title,
        targetValue: Number(kr.target_value),
        currentValue: Number(kr.current_value),
        unit: kr.unit,
        createdAt: kr.created_at,
        updatedAt: kr.updated_at,
        progress,
      };
    });

    const completedCount = keyResults.filter((kr) => kr.progress >= 100).length;
    const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    const progress = keyResults.length > 0
      ? Math.round(totalProgress / keyResults.length)
      : 0;

    const objective = {
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
      keyResults,
    };

    return NextResponse.json(objective);
  } catch (error) {
    console.error('Error in GET /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Objective更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateObjectiveInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.period !== undefined) updateData.period = input.period;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    const { data, error } = await supabase
      .from('objectives')
      .update(updateData)
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
      }
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
    };

    return NextResponse.json(objective);
  } catch (error) {
    console.error('Error in PATCH /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Objective削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // 関連するActionMapのkey_result_idをnullに
    const { data: krs } = await supabase
      .from('key_results')
      .select('id')
      .eq('objective_id', objectiveId);

    if (krs && krs.length > 0) {
      const krIds = krs.map((kr) => kr.id);
      await supabase
        .from('action_maps')
        .update({ key_result_id: null })
        .in('key_result_id', krIds);
    }

    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
