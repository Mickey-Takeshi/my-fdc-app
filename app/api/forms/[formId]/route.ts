import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getFormById, updateForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:read');
  if (isAuthError(auth)) return auth;

  try {
    const form = await getFormById(workspaceId, formId);
    return apiSuccess(form);
  } catch {
    return apiError('NOT_FOUND', 'Form not found', 404);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:edit');
  if (isAuthError(auth)) return auth;

  const body = await request.json();

  try {
    const form = await updateForm(workspaceId, formId, body);
    return apiSuccess(form);
  } catch {
    return apiError('INTERNAL', 'Failed to update form', 500);
  }
}
