import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  companyName: z.string().optional(),
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  message: z.string().min(1, 'お問い合わせ内容は必須です'),
});

// Simple in-memory rate limiter (production should use Redis/KV store)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Content-Type validation
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = contactSchema.parse(body);

    // メール送信（Resend/SendGrid設定時に有効化）
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: process.env.CONTACT_NOTIFY_EMAIL,
    //   subject: '【お問い合わせ】新規お問い合わせがありました',
    //   html: escapeHtml(`<h2>新規お問い合わせ</h2>...`), // HTMLエスケープ必須
    // });

    console.log('[Contact] New inquiry received');

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Production: hide detailed error information
      const details =
        process.env.NODE_ENV === 'development' ? error.issues : undefined;
      return NextResponse.json(
        { error: 'Validation failed', ...(details && { details }) },
        { status: 400 }
      );
    }
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
