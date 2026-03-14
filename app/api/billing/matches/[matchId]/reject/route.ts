import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { rejectMatch } from '@/lib/server/billing-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const body = await request.json();
  const workspaceId = body.workspaceId;
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const result = await rejectMatch(matchId, auth.userId, body.reason ?? '');
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to reject match', 500);
  }
}
