import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError, parsePagination } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:confirm_match');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = parsePagination(searchParams);
  const status = searchParams.get('status') || 'pending';

  const supabase = getAdminClient();
  const { data, error, count } = await supabase
    .from('payment_matches')
    .select(
      '*, payment:payment_id(amount, expected_payer_name, invoice_number, status), message:message_id(from_address, subject, snippet, received_at)',
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError('INTERNAL', 'Failed to fetch matches', 500);

  return apiSuccess({
    matches: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
