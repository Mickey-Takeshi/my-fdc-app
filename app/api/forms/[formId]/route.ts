import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getFormById, updateForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const form = await getFormById(formId, workspaceId);
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
  const body = await request.json();
  const workspaceId = body.workspaceId;
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const form = await updateForm(formId, workspaceId, body);
    return apiSuccess(form);
  } catch {
    return apiError('INTERNAL', 'Failed to update form', 500);
  }
}
