import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { paymentSchema } from '@/lib/types/payment';
import { apiSuccess, apiError, parsePagination } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:read');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = parsePagination(searchParams);
  const status = searchParams.get('status');

  const supabase = getAdminClient();
  let query = supabase
    .from('payments')
    .select('*, customer:customer_id(company_name, contact_name)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return apiError('INTERNAL', 'Failed to fetch payments', 500);

  return apiSuccess({
    payments: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:manage');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...parsed.data,
      workspace_id: workspaceId,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) return apiError('INTERNAL', 'Failed to create payment', 500);
  return apiSuccess(data, 201);
}
