/**
 * app/api/workspaces/[workspaceId]/members/route.ts
 *
 * メンバー一覧・追加 API
 * Phase 5: Workspace & ロール管理
 *
 * GET  /api/workspaces/[workspaceId]/members - メンバー一覧
 * POST /api/workspaces/[workspaceId]/members - メンバー追加
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, checkAdminAuth, isAuthError } from '@/lib/server/api-auth';
import { AddMemberSchema } from '@/lib/types/workspace';

export const dynamic = 'force-dynamic';

interface WorkspaceMemberRow {
  user_id: string;
  role: string;
  joined_at: string;
  users: {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
  } | {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
  }[] | null;
}

/**
 * GET /api/workspaces/[workspaceId]/members
 * メンバー一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        role,
        joined_at,
        users (
          id,
          email,
          name,
          picture
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('[Members API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    const members = ((data || []) as WorkspaceMemberRow[]).map((m) => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      return {
        userId: m.user_id,
        email: user?.email || '',
        name: user?.name || null,
        picture: user?.picture || null,
        role: m.role,
        joinedAt: m.joined_at,
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[Members API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/members
 * メンバーを追加（ADMIN 以上のみ）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const auth = await checkAdminAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = AddMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // ユーザーをメールで検索
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, picture')
      .eq('email', parsed.data.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 既にメンバーかチェック
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 409 }
      );
    }

    // メンバー追加
    const { error: insertError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: parsed.data.role,
      });

    if (insertError) {
      console.error('[Members API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add member' },
        { status: 500 }
      );
    }

    console.log('[Members API] Added member:', user.email);

    return NextResponse.json({
      member: {
        userId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: parsed.data.role,
        joinedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Members API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
