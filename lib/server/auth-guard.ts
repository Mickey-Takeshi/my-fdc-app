import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/utils/api-response';
import type { Role } from '@/lib/types/permission';

interface AuthContext {
  userId: string;
  email: string;
  workspaceId: string;
  role: Role;
}

export async function requireAuth(
  request: NextRequest,
  workspaceId?: string
): Promise<AuthContext | Response> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  if (!workspaceId) {
    return {
      userId: user.id,
      email: user.email!,
      workspaceId: '',
      role: 'viewer' as Role,
    };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return apiError('FORBIDDEN', 'Not a member of this workspace', 403);
  }

  return {
    userId: user.id,
    email: user.email!,
    workspaceId,
    role: member.role as Role,
  };
}
