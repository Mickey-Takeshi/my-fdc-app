import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { searchCustomers } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import type { CustomerStatus, CustomerSource } from '@/lib/types/customer';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:read');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);

  const filters = {
    query: searchParams.get('q') || undefined,
    statuses: (searchParams.get('statuses')?.split(',').filter(Boolean) as CustomerStatus[]) || undefined,
    sources: (searchParams.get('sources')?.split(',').filter(Boolean) as CustomerSource[]) || undefined,
    tagIds: searchParams.get('tagIds')?.split(',').filter(Boolean) || undefined,
    followupOverdue: searchParams.get('followupOverdue') === 'true',
    hasNoTags: searchParams.get('hasNoTags') === 'true',
    sortBy: (searchParams.get('sortBy') as 'name' | 'last_contact' | 'next_followup' | 'created_at') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
  };

  try {
    const result = await searchCustomers(workspaceId, filters);
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to search customers', 500);
  }
}
