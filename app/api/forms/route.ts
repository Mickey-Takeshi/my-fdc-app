import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { listForms, createForm } from '@/lib/server/forms-db';
import { formCreateSchema } from '@/lib/types/form';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:read');
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    const result = await listForms(workspaceId, page, limit);
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to list forms', 500);
  }
}

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'forms:create');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = formCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  try {
    const form = await createForm(workspaceId, auth.userId, {
      title: parsed.data.title,
      description: parsed.data.description,
      slug: parsed.data.slug,
      schema: parsed.data.fields,
      settings: parsed.data.settings,
    });
    return apiSuccess(form, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('23505')) {
      return apiError('CONFLICT', 'Slug already exists in this workspace', 409);
    }
    return apiError('INTERNAL', 'Failed to create form', 500);
  }
}
