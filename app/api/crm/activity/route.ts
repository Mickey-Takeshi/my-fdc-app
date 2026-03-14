import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getActivityLog } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const workspaceId = params.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const result = await getActivityLog(
      workspaceId,
      params.get('customerId') ?? undefined,
      Number(params.get('page')) || 1,
      Number(params.get('limit')) || 20
    );
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch activity log', 500);
  }
}
