import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getSubmissions } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const result = await getSubmissions(
      formId,
      Number(searchParams.get('page')) || 1,
      Number(searchParams.get('limit')) || 20
    );
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch submissions', 500);
  }
}
