import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { createTag } from '@/lib/server/crm-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';

const tagSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0].message, 400);

  const auth = await requireAuth(request, parsed.data.workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const tag = await createTag(parsed.data.workspaceId, auth.userId, parsed.data.name, parsed.data.color);
    return apiSuccess(tag, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to create tag', 500);
  }
}
