import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:read');
  if (isAuthError(auth)) return auth;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('customer_tags')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name');

  if (error) return apiError('INTERNAL', 'Failed to fetch tags', 500);
  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:write');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  // XSS: Strip HTML tags from name
  const safeName = parsed.data.name.replace(/<[^>]*>/g, '');

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('customer_tags')
    .insert({
      ...parsed.data,
      name: safeName,
      workspace_id: workspaceId,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return apiError('CONFLICT', 'Tag name already exists', 409);
    }
    return apiError('INTERNAL', 'Failed to create tag', 500);
  }

  return apiSuccess(data, 201);
}
