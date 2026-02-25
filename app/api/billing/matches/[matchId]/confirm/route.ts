import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/server/audit-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'billing:confirm_match');
  if (isAuthError(auth)) return auth;

  const supabase = getAdminClient();

  // Get the match
  const { data: match } = await supabase
    .from('payment_matches')
    .select('payment_id')
    .eq('id', matchId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .single();

  if (!match) return apiError('NOT_FOUND', 'Match not found', 404);

  // Confirm the match
  const { error: matchErr } = await supabase
    .from('payment_matches')
    .update({
      status: 'confirmed',
      confirmed_by: auth.userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (matchErr) return apiError('INTERNAL', 'Failed to confirm match', 500);

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      gmail_confirmed_at: new Date().toISOString(),
    })
    .eq('id', match.payment_id);

  // Audit log
  await logAuditEvent({
    workspaceId,
    actorId: auth.userId,
    actorEmail: '',
    action: 'match_confirmed',
    resourceType: 'payment_match',
    resourceId: matchId,
    request,
  });

  return apiSuccess({ confirmed: true });
}
