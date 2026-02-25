/**
 * CRM サーバーサイドDB操作
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { CrmSearchFilters, CrmDashboardStats } from '@/lib/types/customer';

export async function searchCustomers(
  workspaceId: string,
  filters: CrmSearchFilters
) {
  const supabase = getAdminClient();
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('customers')
    .select('*, customer_tag_assignments(tag_id, customer_tags(*))', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  if (filters.query) {
    query = query.or(
      `contact_name.ilike.%${filters.query}%,company_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
    );
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }

  if (filters.followupOverdue) {
    query = query.lt('next_followup_at', new Date().toISOString());
  }

  const ascending = sortOrder === 'asc';
  const sortColumn =
    sortBy === 'name' ? 'contact_name' :
    sortBy === 'last_contact' ? 'last_contact_at' :
    sortBy === 'next_followup' ? 'next_followup_at' :
    'created_at';
  query = query.order(sortColumn, { ascending });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count ?? 0;
  return {
    customers: data ?? [],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDashboardStats(
  workspaceId: string
): Promise<CrmDashboardStats> {
  const supabase = getAdminClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('status, source, next_followup_at, estimated_value')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  const list = customers ?? [];
  const now = new Date();

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let upcomingFollowups = 0;
  let overdueFollowups = 0;
  let estimatedPipelineValue = 0;

  for (const c of list) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    if (c.source) bySource[c.source] = (bySource[c.source] || 0) + 1;
    if (c.next_followup_at) {
      const d = new Date(c.next_followup_at);
      if (d < now) overdueFollowups++;
      else upcomingFollowups++;
    }
    if (c.estimated_value) estimatedPipelineValue += Number(c.estimated_value);
  }

  const { count: activityCount } = await supabase
    .from('client_activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    totalClients: list.length,
    byStatus,
    bySource,
    upcomingFollowups,
    overdueFollowups,
    recentActivityCount: activityCount ?? 0,
    estimatedPipelineValue,
  };
}

export async function createCustomer(
  workspaceId: string,
  userId: string,
  data: Record<string, unknown>
) {
  const supabase = getAdminClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({ ...data, workspace_id: workspaceId, created_by: userId })
    .select()
    .single();

  if (error) throw error;

  // Activity log
  await supabase.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: customer.id,
    actor_id: userId,
    action: 'customer_created',
    details: { customer_id: customer.id },
  });

  return customer;
}

export async function updateCustomer(
  workspaceId: string,
  customerId: string,
  userId: string,
  data: Record<string, unknown>
) {
  const supabase = getAdminClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', customerId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: customerId,
    actor_id: userId,
    action: 'customer_updated',
    details: { updated_fields: Object.keys(data) },
  });

  return customer;
}

export async function softDeleteCustomer(
  workspaceId: string,
  customerId: string,
  userId: string
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  if (error) throw error;

  await supabase.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: customerId,
    actor_id: userId,
    action: 'customer_deleted',
    details: { customer_id: customerId },
  });
}

export async function getActivityLog(
  workspaceId: string,
  customerId?: string,
  page = 1,
  limit = 20
) {
  const supabase = getAdminClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('client_activity_log')
    .select('*, profiles:actor_id(name, email)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    activities: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
