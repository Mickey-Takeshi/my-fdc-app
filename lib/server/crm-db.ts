import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerInput, CrmSearchFilters, CrmDashboardStats } from '@/lib/types/customer';
import { apiLogger } from './logger';

const log = apiLogger({ service: 'crm' });

export async function getCustomers(
  workspaceId: string,
  filters: CrmSearchFilters
) {
  const admin = createAdminClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  let query = admin
    .from('customers')
    .select('*, customer_tag_assignments(tag_id, customer_tags(id, name, color))', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null);

  if (filters.query) {
    query = query.or(
      `contact_name.ilike.%${filters.query}%,company_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
    );
  }

  if (filters.stages && filters.stages.length > 0) {
    query = query.in('status', filters.stages);
  }

  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }

  if (filters.followupOverdue) {
    query = query.lt('next_followup_at', new Date().toISOString());
  }

  const sortBy = filters.sortBy ?? 'created_at';
  const sortColumn = sortBy === 'name' ? 'contact_name' : sortBy === 'last_contact' ? 'last_contact_at' : sortBy;
  query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    log.error({ error }, 'Failed to fetch customers');
    throw error;
  }

  return {
    customers: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createCustomer(
  workspaceId: string,
  userId: string,
  input: CustomerInput
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customers')
    .insert({ ...input, workspace_id: workspaceId, created_by: userId })
    .select()
    .single();

  if (error) throw error;

  await admin.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: data.id,
    actor_id: userId,
    action: 'customer_created',
    details: { customer_id: data.id },
  });

  return data;
}

export async function updateCustomer(
  workspaceId: string,
  customerId: string,
  userId: string,
  input: Partial<CustomerInput>
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customers')
    .update(input)
    .eq('id', customerId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw error;

  await admin.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: customerId,
    actor_id: userId,
    action: 'customer_updated',
    details: { fields: Object.keys(input) },
  });

  return data;
}

export async function deleteCustomer(
  workspaceId: string,
  customerId: string,
  userId: string
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  await admin.from('client_activity_log').insert({
    workspace_id: workspaceId,
    customer_id: customerId,
    actor_id: userId,
    action: 'customer_deleted',
    details: { customer_id: customerId },
  });
}

export async function getDashboardStats(workspaceId: string): Promise<CrmDashboardStats> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [customersRes, activityRes] = await Promise.all([
    admin.from('customers').select('status, source, estimated_value, next_followup_at').eq('workspace_id', workspaceId).is('deleted_at', null),
    admin.from('client_activity_log').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const customers = customersRes.data ?? [];
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let upcomingFollowups = 0;
  let overdueFollowups = 0;
  let estimatedPipelineValue = 0;

  for (const c of customers) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    if (c.source) bySource[c.source] = (bySource[c.source] ?? 0) + 1;
    if (c.estimated_value) estimatedPipelineValue += Number(c.estimated_value);
    if (c.next_followup_at) {
      if (c.next_followup_at < now) overdueFollowups++;
      else upcomingFollowups++;
    }
  }

  return {
    totalClients: customers.length,
    byStatus,
    bySource,
    upcomingFollowups,
    overdueFollowups,
    recentActivityCount: activityRes.count ?? 0,
    estimatedPipelineValue,
  };
}

export async function createTag(workspaceId: string, userId: string, name: string, color: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customer_tags')
    .insert({ workspace_id: workspaceId, name, color, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignTag(customerId: string, tagId: string, userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('customer_tag_assignments')
    .insert({ customer_id: customerId, tag_id: tagId, assigned_by: userId });
  if (error) throw error;
}

export async function getActivityLog(workspaceId: string, customerId?: string, page = 1, limit = 20) {
  const admin = createAdminClient();
  let query = admin
    .from('client_activity_log')
    .select('*, profiles(name, email)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { activities: data ?? [], total: count ?? 0, page, limit };
}
