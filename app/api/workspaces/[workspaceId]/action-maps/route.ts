/**
 * app/api/workspaces/[workspaceId]/action-maps/route.ts
 *
 * Phase 10: ActionMap API
 * GET  - ActionMap一覧取得（進捗率計算付き）
 * POST - ActionMap作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateActionMapInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// GET: ActionMap一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // ActionMaps取得
    let query = supabase
      .from('action_maps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: mapsData, error: mapsError } = await query;

    if (mapsError) {
      console.error('Error fetching action maps:', mapsError);
      return NextResponse.json({ error: mapsError.message }, { status: 500 });
    }

    // 各ActionMapの進捗率を計算
    const maps = await Promise.all(
      (mapsData || []).map(async (m) => {
        // ActionItems取得
        const { data: items } = await supabase
          .from('action_items')
          .select('id, status')
          .eq('action_map_id', m.id);

        const itemCount = items?.length || 0;
        const completedItemCount = items?.filter((i) => i.status === 'done').length || 0;
        const progressRate = itemCount > 0
          ? Math.round((completedItemCount / itemCount) * 100)
          : 0;

        return {
          id: m.id,
          workspaceId: m.workspace_id,
          title: m.title,
          description: m.description,
          targetPeriodStart: m.target_period_start,
          targetPeriodEnd: m.target_period_end,
          isArchived: m.is_archived,
          version: m.version,
          keyResultId: m.key_result_id,  // Phase 11: OKR連携
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          progressRate,
          itemCount,
          completedItemCount,
        };
      })
    );

    return NextResponse.json(maps);
  } catch (error) {
    console.error('Error in GET /action-maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: ActionMap作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateActionMapInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('action_maps')
      .insert({
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        target_period_start: input.targetPeriodStart ?? null,
        target_period_end: input.targetPeriodEnd ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action map:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actionMap = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      targetPeriodStart: data.target_period_start,
      targetPeriodEnd: data.target_period_end,
      isArchived: data.is_archived,
      version: data.version,
      keyResultId: data.key_result_id,  // Phase 11: OKR連携
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progressRate: 0,
      itemCount: 0,
      completedItemCount: 0,
    };

    return NextResponse.json(actionMap, { status: 201 });
  } catch (error) {
    console.error('Error in POST /action-maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
