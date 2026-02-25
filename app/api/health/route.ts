import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const checks: Record<string, string> = {};

  // Database check
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('workspaces').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  // Gmail configs health
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('gmail_watch_configs')
      .select('is_active, poll_error_count')
      .eq('is_active', true);

    const hasErrors = data?.some((c) => c.poll_error_count > 3);
    checks.gmail = hasErrors ? 'degraded' : 'ok';
  } catch {
    checks.gmail = 'unknown';
  }

  const allHealthy = Object.values(checks).every((c) => c === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
