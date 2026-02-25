import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getActivityLog } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:read');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    const result = await getActivityLog(workspaceId, customerId, page, limit);
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch activity log', 500);
  }
}
