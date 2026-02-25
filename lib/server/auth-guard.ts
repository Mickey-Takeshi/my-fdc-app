/**
 * 認証ガード（RBAC統合）
 * 全APIルートで使用する共通認証・権限チェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { type PermissionKey, type Role } from '@/lib/types/permission';
import { checkPermission } from './permissions-resolver';
import { apiError } from '@/lib/utils/api-response';
import { validateSession } from './auth';
import { getAdminClient } from '@/lib/supabase/admin';

export interface AuthResult {
  userId: string;
  workspaceId: string;
  role: Role;
}

export async function requireAuth(
  request: NextRequest,
  workspaceId: string,
  permission: PermissionKey
): Promise<AuthResult | NextResponse> {
  // セッショントークン取得
  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  // セッション検証
  const session = await validateSession(sessionToken);
  if (!session) {
    return apiError('UNAUTHORIZED', 'Invalid session', 401);
  }

  const supabase = getAdminClient();

  // ワークスペースメンバーシップ確認
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (!member) {
    return apiError('FORBIDDEN', 'Not a workspace member', 403);
  }

  const role = member.role as Role;

  // 権限チェック
  const hasAccess = await checkPermission(session.userId, workspaceId, role, permission);
  if (!hasAccess) {
    return apiError('FORBIDDEN', 'Insufficient permissions', 403);
  }

  return { userId: session.userId, workspaceId, role };
}

export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
