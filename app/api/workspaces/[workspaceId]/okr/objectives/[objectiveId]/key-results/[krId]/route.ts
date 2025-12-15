/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/[krId]/route.ts
 *
 * Phase 11: 個別Key Result API
 * GET    - KR取得
 * PATCH  - KR更新（現在値更新含む）
 * DELETE - KR削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateKeyResultInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string; krId: string }>;
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

// GET: KR取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('key_results')
      .select('*')
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Key Result not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 紐付いたActionMap数を取得
    const { count } = await supabase
      .from('action_maps')
      .select('*', { count: 'exact', head: true })
      .eq('key_result_id', krId);

    const keyResult = {
      id: data.id,
      objectiveId: data.objective_id,
      workspaceId: data.workspace_id,
      title: data.title,
      targetValue: Number(data.target_value),
      currentValue: Number(data.current_value),
      unit: data.unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: calculateKeyResultProgress(data.current_value, data.target_value),
      linkedActionMapCount: count || 0,
    };

    return NextResponse.json(keyResult);
  } catch (error) {
    console.error('Error in GET /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: KR更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateKeyResultInputSchema.safeParse(body);

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
    if (input.targetValue !== undefined) updateData.target_value = input.targetValue;
    if (input.currentValue !== undefined) updateData.current_value = input.currentValue;
    if (input.unit !== undefined) updateData.unit = input.unit;

    const { data, error } = await supabase
      .from('key_results')
      .update(updateData)
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Key Result not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keyResult = {
      id: data.id,
      objectiveId: data.objective_id,
      workspaceId: data.workspace_id,
      title: data.title,
      targetValue: Number(data.target_value),
      currentValue: Number(data.current_value),
      unit: data.unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: calculateKeyResultProgress(data.current_value, data.target_value),
    };

    return NextResponse.json(keyResult);
  } catch (error) {
    console.error('Error in PATCH /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: KR削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // 紐付いたActionMapのkey_result_idをnullに
    await supabase
      .from('action_maps')
      .update({ key_result_id: null })
      .eq('key_result_id', krId);

    const { error } = await supabase
      .from('key_results')
      .delete()
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
