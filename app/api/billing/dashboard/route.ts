import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getBillingDashboard } from '@/lib/server/billing-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const stats = await getBillingDashboard(workspaceId);
    return apiSuccess(stats);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch billing dashboard', 500);
  }
}
