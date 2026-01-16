/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/route.ts
 *
 * Phase 11: Key Results API
 * GET  - KR一覧取得
 * POST - KR作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateKeyResultInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string }>;
}

// GET: KR一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('key_results')
      .select('*')
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keyResults = (data || []).map((kr) => {
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

    return NextResponse.json(keyResults);
  } catch (error) {
    console.error('Error in GET /key-results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: KR作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateKeyResultInputSchema.safeParse({
      ...body,
      objectiveId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('key_results')
      .insert({
        objective_id: objectiveId,
        workspace_id: workspaceId,
        title: input.title,
        target_value: input.targetValue,
        current_value: input.currentValue ?? 0,
        unit: input.unit,
      })
      .select()
      .single();

    if (error) {
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

    return NextResponse.json(keyResult, { status: 201 });
  } catch (error) {
    console.error('Error in POST /key-results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
