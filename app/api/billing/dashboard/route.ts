import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import type { BillingDashboardStats } from '@/lib/types/gmail-billing';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:read');
  if (isAuthError(auth)) return auth;

  const supabase = getAdminClient();

  const { data: payments } = await supabase
    .from('payments')
    .select('status, amount')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  const list = payments ?? [];
  const now = new Date();

  const { count: pendingMatches } = await supabase
    .from('payment_matches')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');

  const { data: gmailConfig } = await supabase
    .from('gmail_watch_configs')
    .select('is_active, last_poll_at, last_success_at, poll_error_count, last_error')
    .eq('workspace_id', workspaceId)
    .single();

  // Count payments that are pending and past due
  const { count: overdueCount } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .lt('due_date', now.toISOString().split('T')[0])
    .is('deleted_at', null);

  const stats: BillingDashboardStats = {
    totalPayments: list.length,
    completedPayments: list.filter((p) => p.status === 'completed').length,
    pendingPayments: list.filter((p) => p.status === 'pending').length,
    overduePayments: overdueCount ?? 0,
    pendingMatches: pendingMatches ?? 0,
    totalRevenue: list
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingRevenue: list
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    gmailStatus: {
      isActive: gmailConfig?.is_active ?? false,
      lastPollAt: gmailConfig?.last_poll_at ?? null,
      lastSuccessAt: gmailConfig?.last_success_at ?? null,
      errorCount: gmailConfig?.poll_error_count ?? 0,
      lastError: gmailConfig?.last_error ?? null,
    },
  };

  return apiSuccess(stats);
}
