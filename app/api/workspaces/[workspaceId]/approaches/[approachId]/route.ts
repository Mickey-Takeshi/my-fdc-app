/**
 * app/api/workspaces/[workspaceId]/approaches/[approachId]/route.ts
 *
 * Phase 8: Approach 個別操作 API
 *
 * GET    - アプローチ詳細取得
 * PATCH  - アプローチ更新
 * DELETE - アプローチ削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { UpdateApproachSchema } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; approachId: string }>;
}

/**
 * GET /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('approaches')
    .select('*')
    .eq('id', approachId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Approach not found' }, { status: 404 });
  }

  const approach = {
    id: data.id,
    workspaceId: data.workspace_id,
    leadId: data.lead_id,
    userId: data.user_id,
    type: data.type,
    content: data.content,
    result: data.result,
    resultNote: data.result_note,
    approachedAt: data.approached_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ approach });
}

/**
 * PATCH /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateApproachSchema.safeParse({ ...body, id: approachId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.result !== undefined) updateData.result = input.result;
    if (input.resultNote !== undefined)
      updateData.result_note = input.resultNote;
    if (input.approachedAt !== undefined)
      updateData.approached_at = input.approachedAt;

    const { data, error } = await supabase
      .from('approaches')
      .update(updateData)
      .eq('id', approachId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Approaches API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update approach' },
        { status: 500 }
      );
    }

    const approach = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      result: data.result,
      resultNote: data.result_note,
      approachedAt: data.approached_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Approaches API] Updated approach:', approach.id);
    return NextResponse.json({ approach });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('approaches')
    .delete()
    .eq('id', approachId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Approaches API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete approach' },
      { status: 500 }
    );
  }

  console.log('[Approaches API] Deleted approach:', approachId);
  return NextResponse.json({ success: true });
}
