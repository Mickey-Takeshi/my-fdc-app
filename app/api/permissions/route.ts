import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { DEFAULT_ROLE_PERMISSIONS, type PermissionKey, type Role } from '@/lib/types/permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  const admin = createAdminClient();

  // カスタム権限オーバーライドを取得
  const { data: override } = await admin
    .from('member_permission_overrides')
    .select('custom_permissions, permission_set_id, permission_sets(permissions)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', auth.userId)
    .single();

  // デフォルトロール権限をベースに
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[auth.role as Role] ?? [];
  const permissions: Record<string, boolean> = {};

  for (const key of Object.keys(DEFAULT_ROLE_PERMISSIONS.owner)) {
    permissions[key] = rolePermissions.includes(key as PermissionKey);
  }

  // 権限セットで上書き
  if (override?.permission_sets && !Array.isArray(override.permission_sets)) {
    const setPerms = (override.permission_sets as unknown as { permissions: Record<string, boolean> }).permissions;
    if (setPerms) Object.assign(permissions, setPerms);
  }

  // カスタム権限で上書き
  if (override?.custom_permissions) {
    Object.assign(permissions, override.custom_permissions as Record<string, boolean>);
  }

  return apiSuccess({ permissions });
}
