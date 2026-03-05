/**
 * app/api/workspaces/route.ts
 *
 * ワークスペース一覧取得・作成 API（Phase 5）
 * GET  /api/workspaces - ユーザーが所属するワークスペース一覧
 * POST /api/workspaces - 新規ワークスペース作成（作成者は OWNER）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'ワークスペース名は必須です').max(100),
});

/**
 * GET /api/workspaces
 * ユーザーが所属するワークスペース一覧を取得
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // ユーザーが所属するワークスペースをロール付きで取得
  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspaces (
        id,
        name,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Workspace list error:', error);
    return NextResponse.json(
      { error: 'ワークスペースの取得に失敗しました' },
      { status: 500 }
    );
  }

  // フラットな構造に変換
  interface WorkspaceData {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }
  const workspaces = (memberships ?? []).map((m) => {
    const ws = m.workspaces as unknown as WorkspaceData;
    return {
      id: ws.id,
      name: ws.name,
      created_at: ws.created_at,
      updated_at: ws.updated_at,
      role: m.role,
    };
  });

  return NextResponse.json({ workspaces });
}

/**
 * POST /api/workspaces
 * 新規ワークスペース作成（作成者は OWNER として追加）
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの形式が不正です' },
      { status: 400 }
    );
  }

  const result = CreateWorkspaceSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { name } = result.data;
  const supabase = createServiceClient();

  // ワークスペース作成
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name })
    .select()
    .single();

  if (wsError || !workspace) {
    console.error('Workspace creation error:', wsError);
    return NextResponse.json(
      { error: 'ワークスペースの作成に失敗しました' },
      { status: 500 }
    );
  }

  // 作成者を OWNER として追加
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'OWNER',
    });

  if (memberError) {
    console.error('Member addition error:', memberError);
    // ワークスペースが作成済みなのでロールバック
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    return NextResponse.json(
      { error: 'メンバーの追加に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ workspace: { ...workspace, role: 'OWNER' } }, { status: 201 });
}
