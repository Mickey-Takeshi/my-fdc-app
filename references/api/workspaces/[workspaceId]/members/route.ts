/**
 * app/api/workspaces/[workspaceId]/members/route.ts
 *
 * ワークスペースメンバー管理API
 *
 * GET /api/workspaces/[workspaceId]/members - メンバー一覧取得
 * DELETE /api/workspaces/[workspaceId]/members/[userId] - メンバー削除（別ファイルで対応）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSA, getAccountType } from '@/lib/utils/permissions';
import { apiLogger } from '@/lib/server/logger';
import { checkTenantBoundary } from '@/lib/server/workspace-auth';
import { isE2ETestRequest } from '@/lib/server/test-mode';
import { handleApiError } from '@/lib/server/api-errors';

export const dynamic = 'force-dynamic';

// セッション検証とユーザー情報取得
async function getAuthenticatedUser(request: NextRequest) {
  // Phase 14.6.7: E2Eテストモードのチェック（開発環境限定）
  if (isE2ETestRequest(request)) {
    return {
      user: {
        id: 'test-owner-1',
        email: 'owner@test.founderdirect.jp',
        name: 'Test Owner',
        system_role: 'SA',
      },
      supabase: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      ),
    };
  }

  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return { user: null, error: 'No session', status: 401 };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // セッション検索
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', sessionToken)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (sessionError || !sessionData) {
    return { user: null, error: 'Invalid session', status: 401 };
  }

  // ユーザー情報取得（Phase 9.97: system_role のみ）
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, picture, system_role')
    .eq('id', sessionData.user_id)
    .single();

  if (userError || !userData) {
    return { user: null, error: 'User not found', status: 401 };
  }

  return { user: userData, supabase };
}

/**
 * GET /api/workspaces/[workspaceId]/members
 * ワークスペースのメンバー一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const resolvedParams = await params;
  const workspaceId = parseInt(resolvedParams.workspaceId, 10);

  apiLogger.debug(`[Members API] GET - workspaceId: ${workspaceId}`);

  if (isNaN(workspaceId)) {
    return NextResponse.json(
      { error: 'Invalid workspace ID' },
      { status: 400 }
    );
  }

  const authResult = await getAuthenticatedUser(request);
  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status || 401 }
    );
  }

  const { user, supabase } = authResult;

  try {
    // SA (システム管理者) は全ワークスペースにアクセス可能
    const accountType = getAccountType(user.system_role);
    const isSystemAdmin = isSA(accountType);

    // ユーザーがワークスペースのメンバーかチェック（SA以外）
    if (!isSystemAdmin) {
      const { data: membership, error: membershipError } = await supabase!
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'このワークスペースへのアクセス権限がありません' },
          { status: 403 }
        );
      }

      // 全メンバーがメンバー一覧を閲覧可能（OWNER/ADMIN/MEMBER）
      // 新権限体系では viewer は存在しない
    }

    // テナント境界チェック（Phase 14.6-J: セキュリティ強化）
    const tenantCheck = await checkTenantBoundary(request, workspaceId);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // メンバー一覧を取得
    const { data: members, error: membersError } = await supabase!
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

    if (membersError) {
      apiLogger.error({ err: membersError }, '[Members API] Error fetching members');
      throw membersError;
    }

    // レスポンス形式に変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedMembers = (members || []).map((m: any) => {
      // Supabaseのjoin結果は配列または単一オブジェクトの可能性
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      return {
        userId: String(m.user_id),
        email: user?.email || '',
        name: user?.name || null,
        picture: user?.picture || null,
        role: m.role,
        joinedAt: m.joined_at,
      };
    });

    apiLogger.info(`[Members API] Found ${formattedMembers.length} members`);

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    return handleApiError(error, 'Members API');
  }
}
