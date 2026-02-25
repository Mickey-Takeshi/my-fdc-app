import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

const assignSchema = z.object({
  customerId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:write');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('customer_tag_assignments')
    .insert({
      customer_id: parsed.data.customerId,
      tag_id: parsed.data.tagId,
      assigned_by: auth.userId,
    });

  if (error) {
    if (error.code === '23505') {
      return apiError('CONFLICT', 'Tag already assigned', 409);
    }
    return apiError('INTERNAL', 'Failed to assign tag', 500);
  }

  return apiSuccess({ assigned: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:write');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('customer_tag_assignments')
    .delete()
    .eq('customer_id', parsed.data.customerId)
    .eq('tag_id', parsed.data.tagId);

  if (error) return apiError('INTERNAL', 'Failed to remove tag', 500);
  return apiSuccess({ removed: true });
}
