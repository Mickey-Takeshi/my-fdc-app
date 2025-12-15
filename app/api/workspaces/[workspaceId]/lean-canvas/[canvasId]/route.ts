/**
 * app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/route.ts
 *
 * Phase 16: Lean Canvas 詳細・更新・削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; canvasId: string }> };

// Canvas詳細取得（ブロック含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Canvas取得
    const { data: canvas, error } = await supabase
      .from('lean_canvas')
      .select('*')
      .eq('id', canvasId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // ブロック取得
    const { data: blocks } = await supabase
      .from('lean_canvas_blocks')
      .select('*')
      .eq('canvas_id', canvasId);

    const formattedBlocks = (blocks || []).map((b) => ({
      id: b.id,
      canvasId: b.canvas_id,
      blockType: b.block_type,
      content: b.content,
      items: b.items || [],
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    const formatted = {
      id: canvas.id,
      workspaceId: canvas.workspace_id,
      brandId: canvas.brand_id,
      title: canvas.title,
      description: canvas.description,
      createdBy: canvas.created_by,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
      blocks: formattedBlocks,
    };

    return NextResponse.json({ canvas: formatted });
  } catch (error) {
    console.error('[Lean Canvas API] GET detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Canvas更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.brandId !== undefined) updates.brand_id = body.brandId;

    const { data: canvas, error } = await supabase
      .from('lean_canvas')
      .update(updates)
      .eq('id', canvasId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    return NextResponse.json({ canvas: formatted });
  } catch (error) {
    console.error('[Lean Canvas API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Canvas削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // OWNER/ADMIN のみ削除可能
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('lean_canvas')
      .delete()
      .eq('id', canvasId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Lean Canvas API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
