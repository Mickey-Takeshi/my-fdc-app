import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getDashboardStats } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:dashboard');
  if (isAuthError(auth)) return auth;

  try {
    const stats = await getDashboardStats(workspaceId);
    return apiSuccess(stats);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch dashboard stats', 500);
  }
}
