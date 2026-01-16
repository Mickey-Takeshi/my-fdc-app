/**
 * app/api/workspaces/[workspaceId]/lean-canvas/route.ts
 *
 * Phase 16: Lean Canvas 一覧・作成 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

// Canvas一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // Canvas一覧取得
    const { data: canvases, error } = await supabase
      .from('lean_canvas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // キャメルケースに変換
    const formatted = (canvases || []).map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      brandId: c.brand_id,
      title: c.title,
      description: c.description,
      createdBy: c.created_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({ canvases: formatted });
  } catch (error) {
    console.error('[Lean Canvas API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Canvas作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, userId } = auth;

    const body = await request.json();
    const { title, description, brandId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Canvas作成
    const { data: canvas, error } = await supabase
      .from('lean_canvas')
      .insert({
        workspace_id: workspaceId,
        brand_id: brandId || null,
        title,
        description: description || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 9ブロックを初期作成
    const blockTypes = [
      'customer_segments',
      'problem',
      'unique_value',
      'solution',
      'channels',
      'revenue_streams',
      'cost_structure',
      'key_metrics',
      'unfair_advantage',
    ];

    const blocksToInsert = blockTypes.map((blockType) => ({
      canvas_id: canvas.id,
      block_type: blockType,
      content: '',
      items: [],
    }));

    await supabase.from('lean_canvas_blocks').insert(blocksToInsert);

    const formatted = {
      id: canvas.id,
      workspaceId: canvas.workspace_id,
      brandId: canvas.brand_id,
      title: canvas.title,
      description: canvas.description,
      createdBy: canvas.created_by,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
    };

    return NextResponse.json({ canvas: formatted }, { status: 201 });
  } catch (error) {
    console.error('[Lean Canvas API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
