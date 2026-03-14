import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getForms, createForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';

const createFormSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/),
  schema: z.array(z.record(z.string(), z.unknown())).default([]),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const forms = await getForms(workspaceId);
    return apiSuccess(forms);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch forms', 500);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0].message, 400);

  const auth = await requireAuth(request, parsed.data.workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const form = await createForm(parsed.data.workspaceId, auth.userId, parsed.data);
    return apiSuccess(form, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to create form', 500);
  }
}
