/**
 * app/api/health/route.ts
 *
 * Health check endpoint (Phase 28)
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/server/supabase';

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Database check
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('workspaces').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every((v) => v !== 'error');

  return NextResponse.json(checks, {
    status: allOk ? 200 : 503,
  });
}
