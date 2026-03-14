import { createAdminClient } from '@/lib/supabase/admin';
import type { PaymentInput } from '@/lib/types/payment';
import { apiLogger } from './logger';

const log = apiLogger({ service: 'billing' });

export async function getPayments(workspaceId: string, page = 1, limit = 20, status?: string) {
  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  let query = admin
    .from('payments')
    .select('*, customers(contact_name, company_name)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) { log.error({ error }, 'Failed to fetch payments'); throw error; }
  return { payments: data ?? [], total: count ?? 0, page, limit };
}

export async function createPayment(workspaceId: string, userId: string, input: PaymentInput) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payments')
    .insert({ ...input, workspace_id: workspaceId, created_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayment(paymentId: string, workspaceId: string, input: Partial<PaymentInput>) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payments')
    .update(input)
    .eq('id', paymentId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBillingDashboard(workspaceId: string) {
  const admin = createAdminClient();
  const [paymentsRes, matchesRes, gmailRes] = await Promise.all([
    admin.from('payments').select('amount, status').eq('workspace_id', workspaceId).is('deleted_at', null),
    admin.from('payment_matches').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('status', 'pending'),
    admin.from('gmail_watch_configs').select('is_active, last_poll_at, last_success_at, poll_error_count, last_error').eq('workspace_id', workspaceId).maybeSingle(),
  ]);

  const payments = paymentsRes.data ?? [];
  let totalRevenue = 0;
  let pendingRevenue = 0;
  const statusCounts: Record<string, number> = {};

  for (const p of payments) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    const amount = Number(p.amount);
    if (p.status === 'completed') totalRevenue += amount;
    if (p.status === 'pending') pendingRevenue += amount;
  }

  return {
    totalPayments: payments.length,
    completedPayments: statusCounts['completed'] ?? 0,
    pendingPayments: statusCounts['pending'] ?? 0,
    overduePayments: 0,
    pendingMatches: matchesRes.count ?? 0,
    totalRevenue,
    pendingRevenue,
    gmailStatus: gmailRes.data ? {
      isActive: gmailRes.data.is_active,
      lastPollAt: gmailRes.data.last_poll_at,
      lastSuccessAt: gmailRes.data.last_success_at,
      errorCount: gmailRes.data.poll_error_count,
      lastError: gmailRes.data.last_error,
    } : null,
  };
}

export async function getMatches(workspaceId: string, status?: string) {
  const admin = createAdminClient();
  let query = admin
    .from('payment_matches')
    .select('*, payments(amount, expected_payer_name, invoice_number), gmail_processed_messages(subject, snippet, from_address)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function confirmMatch(matchId: string, userId: string) {
  const admin = createAdminClient();
  const { data: match, error: fetchError } = await admin
    .from('payment_matches')
    .select('payment_id, parsed_amount')
    .eq('id', matchId)
    .single();

  if (fetchError || !match) throw fetchError ?? new Error('Match not found');

  const { error } = await admin
    .from('payment_matches')
    .update({ status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .eq('id', matchId);

  if (error) throw error;

  await admin
    .from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('id', match.payment_id);

  return { confirmed: true };
}

export async function rejectMatch(matchId: string, userId: string, reason: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('payment_matches')
    .update({ status: 'rejected', confirmed_by: userId, confirmed_at: new Date().toISOString(), rejection_reason: reason })
    .eq('id', matchId);

  if (error) throw error;
  return { rejected: true };
}
