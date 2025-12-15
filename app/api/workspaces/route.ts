/**
 * app/api/workspaces/route.ts
 *
 * ワークスペース一覧・作成 API
 * Phase 5: Workspace & ロール管理
 *
 * GET  /api/workspaces - ユーザーが所属するワークスペース一覧
 * POST /api/workspaces - 新規ワークスペース作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateWorkspaceSchema } from '@/lib/types/workspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspaces
 * ユーザーが所属するワークスペース一覧を取得
 */
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // ユーザーが所属するワークスペースを取得
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        joined_at,
        workspaces (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', session.userId);

    if (error) {
      console.error('[Workspaces API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workspaces' },
        { status: 500 }
      );
    }

    interface WorkspaceMemberRow {
      role: string;
      joined_at: string;
      workspaces: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      } | {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      }[] | null;
    }

    const workspaces = ((data || []) as WorkspaceMemberRow[]).map((item) => {
      const ws = Array.isArray(item.workspaces)
        ? item.workspaces[0]
        : item.workspaces;
      return {
        id: ws?.id,
        name: ws?.name,
        role: item.role,
        joinedAt: item.joined_at,
        createdAt: ws?.created_at,
        updatedAt: ws?.updated_at,
      };
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('[Workspaces API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * 新規ワークスペースを作成（作成者は OWNER）
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // ワークスペース作成
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: parsed.data.name })
      .select('id, name, created_at, updated_at')
      .single();

    if (wsError || !workspace) {
      console.error('[Workspaces API] Create error:', wsError);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // 作成者を OWNER として追加
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: session.userId,
        role: 'OWNER',
      });

    if (memberError) {
      console.error('[Workspaces API] Add owner error:', memberError);
      // ワークスペースをロールバック
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // workspace_data 初期化
    await supabase.from('workspace_data').insert({
      workspace_id: workspace.id,
      data: {},
      version: 1,
    });

    console.log('[Workspaces API] Created workspace:', workspace.id);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: 'OWNER',
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Workspaces API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
