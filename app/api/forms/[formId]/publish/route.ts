import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { publishForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:edit');
  if (isAuthError(auth)) return auth;

  try {
    const form = await publishForm(workspaceId, formId);
    return apiSuccess(form);
  } catch {
    return apiError('INTERNAL', 'Failed to publish form', 500);
  }
}
