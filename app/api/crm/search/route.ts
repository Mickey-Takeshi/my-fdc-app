import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getCustomers } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const workspaceId = params.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const result = await getCustomers(workspaceId, {
      query: params.get('query') ?? undefined,
      stages: params.get('stages')?.split(',').filter(Boolean),
      sources: params.get('sources')?.split(',').filter(Boolean),
      followupOverdue: params.get('followupOverdue') === 'true',
      sortBy: (params.get('sortBy') as 'name' | 'last_contact' | 'next_followup' | 'created_at') ?? undefined,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') ?? undefined,
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 20,
    });
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to search customers', 500);
  }
}
