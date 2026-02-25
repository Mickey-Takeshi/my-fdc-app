import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:confirm_match');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', 'Rejection reason is required', 400);
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('payment_matches')
    .update({
      status: 'rejected',
      confirmed_by: auth.userId,
      confirmed_at: new Date().toISOString(),
      rejection_reason: parsed.data.reason,
    })
    .eq('id', matchId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');

  if (error) return apiError('INTERNAL', 'Failed to reject match', 500);
  return apiSuccess({ rejected: true });
}
