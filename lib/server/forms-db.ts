/**
 * フォームサーバーサイドDB操作
 */

import { getAdminClient } from '@/lib/supabase/admin';

export async function listForms(workspaceId: string, page = 1, limit = 20) {
  const supabase = getAdminClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('forms')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    forms: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getFormById(workspaceId: string, formId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) throw error;
  return data;
}

export async function createForm(
  workspaceId: string,
  userId: string,
  formData: {
    title: string;
    description?: string;
    slug: string;
    schema: unknown[];
    settings: Record<string, unknown>;
  }
) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('forms')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      title: formData.title,
      description: formData.description ?? null,
      slug: formData.slug,
      schema: formData.schema,
      settings: formData.settings,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateForm(
  workspaceId: string,
  formId: string,
  updates: Record<string, unknown>
) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', formId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishForm(workspaceId: string, formId: string) {
  return updateForm(workspaceId, formId, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

export async function closeForm(workspaceId: string, formId: string) {
  return updateForm(workspaceId, formId, {
    status: 'closed',
    closed_at: new Date().toISOString(),
  });
}

export async function getPublicForm(slug: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('forms')
    .select('id, title, description, slug, schema, settings, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data;
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, unknown>,
  metadata: {
    respondentEmail?: string;
    respondentName?: string;
    ipHash?: string;
    userAgent?: string;
  }
) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('form_submissions')
    .insert({
      form_id: formId,
      respondent_email: metadata.respondentEmail ?? null,
      respondent_name: metadata.respondentName ?? null,
      answers,
      metadata: {
        ip_hash: metadata.ipHash,
        user_agent: metadata.userAgent?.slice(0, 200),
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFormSubmissions(
  formId: string,
  page = 1,
  limit = 20
) {
  const supabase = getAdminClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact' })
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    submissions: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
