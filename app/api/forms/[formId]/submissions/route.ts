import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getFormSubmissions } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:view_responses');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    const result = await getFormSubmissions(formId, page, limit);
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch submissions', 500);
  }
}
