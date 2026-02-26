import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { createCustomer } from '@/lib/server/crm-db';
import { customerSchema } from '@/lib/types/customer';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:write');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  try {
    const customer = await createCustomer(workspaceId, auth.userId, parsed.data);
    return apiSuccess(customer, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to create customer', 500);
  }
}
