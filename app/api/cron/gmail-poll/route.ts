import { NextRequest } from 'next/server';
import { runPollingCycle } from '@/lib/server/gmail/polling-engine';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Cron 認証
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError('UNAUTHORIZED', 'Invalid cron secret', 401);
  }

  try {
    const result = await runPollingCycle();
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL', 'Polling cycle failed', 500);
  }
}
