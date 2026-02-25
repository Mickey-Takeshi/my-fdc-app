import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolvePermissions } from '@/lib/server/permissions-resolver';
import { type Role } from '@/lib/types/permission';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return apiError('UNAUTHORIZED', 'Invalid session', 401);
  }

  const supabase = getAdminClient();

  // ユーザーの最初のワークスペースのメンバーシップを取得
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', session.userId)
    .limit(1)
    .single();

  if (!membership) {
    return apiError('NOT_FOUND', 'No workspace membership found', 404);
  }

  const role = membership.role.toLowerCase() as Role;
  const permissions = await resolvePermissions(
    session.userId,
    membership.workspace_id,
    role
  );

  return apiSuccess({ role, permissions });
}
