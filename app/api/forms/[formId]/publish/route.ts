import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { publishForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(
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
    const form = await publishForm(formId, workspaceId);
    return apiSuccess(form);
  } catch {
    return apiError('INTERNAL', 'Failed to publish form', 500);
  }
}
