/**
 * app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks/route.ts
 *
 * Phase 16: Lean Canvas ブロック更新 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string; canvasId: string }> };

// ブロック更新（upsert）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

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

    // Canvas存在確認
    const { data: canvas } = await supabase
      .from('lean_canvas')
      .select('id')
      .eq('id', canvasId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    const body = await request.json();
    const { blockType, content, items } = body;

    if (!blockType) {
      return NextResponse.json({ error: 'blockType is required' }, { status: 400 });
    }

    // Upsert
    const { data: block, error } = await supabase
      .from('lean_canvas_blocks')
      .upsert(
        {
          canvas_id: canvasId,
          block_type: blockType,
          content: content ?? '',
          items: items ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'canvas_id,block_type' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      id: block.id,
      canvasId: block.canvas_id,
      blockType: block.block_type,
      content: block.content,
      items: block.items || [],
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    };

    return NextResponse.json({ block: formatted });
  } catch (error) {
    console.error('[Lean Canvas API] PUT block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
