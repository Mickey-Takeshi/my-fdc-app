import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getMatches } from '@/lib/server/billing-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const workspaceId = params.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const matches = await getMatches(workspaceId, params.get('status') ?? undefined);
    return apiSuccess(matches);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch matches', 500);
  }
}
