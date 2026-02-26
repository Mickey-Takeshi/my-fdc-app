import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  companyName: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    if (!checkRateLimit(getClientIP(request))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    contactSchema.parse(await request.json());
    console.log('[Contact] New inquiry received');
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = process.env.NODE_ENV === 'development' ? error.issues : undefined;
      return NextResponse.json({ error: 'Validation failed', ...(details && { details }) }, { status: 400 });
    }
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
