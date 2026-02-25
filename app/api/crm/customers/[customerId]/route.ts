import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { updateCustomer, softDeleteCustomer } from '@/lib/server/crm-db';
import { customerSchema } from '@/lib/types/customer';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:write');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = customerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', parsed.error.issues[0].message, 400);
  }

  try {
    const customer = await updateCustomer(workspaceId, customerId, auth.userId, parsed.data);
    return apiSuccess(customer);
  } catch {
    return apiError('INTERNAL', 'Failed to update customer', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'crm:delete');
  if (isAuthError(auth)) return auth;

  try {
    await softDeleteCustomer(workspaceId, customerId, auth.userId);
    return apiSuccess({ deleted: true });
  } catch {
    return apiError('INTERNAL', 'Failed to delete customer', 500);
  }
}
