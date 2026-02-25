import { NextRequest, NextResponse } from 'next/server';
import { runPolling } from '@/lib/server/gmail/polling-engine';
import { logger } from '@/lib/server/logger';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Vercel Cron 認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log = logger.child({ service: 'cron-gmail-poll' });
  log.info('Starting Gmail polling cron job');

  try {
    const result = await runPolling();
    log.info(result, 'Gmail polling completed');
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    log.error({ err }, 'Gmail polling cron failed');
    return NextResponse.json({ error: 'Polling failed' }, { status: 500 });
  }
}
