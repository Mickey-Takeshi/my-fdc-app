import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { getPayments, createPayment } from '@/lib/server/billing-db';
import { paymentSchema } from '@/lib/types/payment';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const workspaceId = params.get('workspaceId');
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  try {
    const result = await getPayments(
      workspaceId,
      Number(params.get('page')) || 1,
      Number(params.get('limit')) || 20,
      params.get('status') ?? undefined
    );
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Failed to fetch payments', 500);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const workspaceId = body.workspaceId;
  if (!workspaceId) return apiError('BAD_REQUEST', 'workspaceId is required', 400);

  const auth = await requireAuth(request, workspaceId);
  if (auth instanceof Response) return auth;

  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0].message, 400);

  try {
    const payment = await createPayment(workspaceId, auth.userId, parsed.data);
    return apiSuccess(payment, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to create payment', 500);
  }
}
