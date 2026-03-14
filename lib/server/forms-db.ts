import { createAdminClient } from '@/lib/supabase/admin';
import { apiLogger } from './logger';

const log = apiLogger({ service: 'forms' });

export async function getForms(workspaceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('forms')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    log.error({ error }, 'Failed to fetch forms');
    throw error;
  }
  return data ?? [];
}

export async function getFormById(formId: string, workspaceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
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
  input: { title: string; description?: string; slug: string; schema: unknown[]; settings: Record<string, unknown> }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('forms')
    .insert({
      workspace_id: workspaceId,
      title: input.title,
      description: input.description,
      slug: input.slug,
      schema: input.schema,
      settings: input.settings,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateForm(
  formId: string,
  workspaceId: string,
  input: Partial<{ title: string; description: string; schema: unknown[]; settings: Record<string, unknown> }>
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('forms')
    .update(input)
    .eq('id', formId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishForm(formId: string, workspaceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('forms')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', formId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function closeForm(formId: string, workspaceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('forms')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', formId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPublicForm(slug: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
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
  submission: { respondent_email?: string; respondent_name?: string; answers: Record<string, unknown>; metadata?: Record<string, unknown> }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('form_submissions')
    .insert({
      form_id: formId,
      respondent_email: submission.respondent_email,
      respondent_name: submission.respondent_name,
      answers: submission.answers,
      metadata: submission.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubmissions(formId: string, page = 1, limit = 20) {
  const admin = createAdminClient();
  const offset = (page - 1) * limit;
  const { data, error, count } = await admin
    .from('form_submissions')
    .select('*', { count: 'exact' })
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { submissions: data ?? [], total: count ?? 0, page, limit };
}
