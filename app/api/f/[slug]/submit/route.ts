import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { getPublicForm, submitFormResponse } from '@/lib/server/forms-db';
import { validateSubmission } from '@/lib/server/form-schema-validator';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import type { FormField } from '@/lib/types/form';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Origin/Referer ヘッダー検証（B氏: CSRF対策）
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && origin && !origin.startsWith(appUrl)) {
    return apiError('FORBIDDEN', 'Invalid origin', 403);
  }

  const form = await getPublicForm(slug);
  if (!form) {
    return apiError('NOT_FOUND', 'Form not found', 404);
  }

  const body = await request.json();
  const answers = body.answers as Record<string, unknown>;

  if (!answers || typeof answers !== 'object') {
    return apiError('VALIDATION', 'Answers are required', 400);
  }

  // スキーマバリデーション
  const schema = form.schema as FormField[];
  const errors = validateSubmission(schema, answers);
  if (errors.length > 0) {
    return apiError('VALIDATION', errors[0].message, 400);
  }

  // IPハッシュ化（GDPR対応 - B氏）
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? 'default-salt';
  const ipHash = createHash('sha256').update(`${rawIp}:${salt}`).digest('hex').slice(0, 16);

  try {
    const submission = await submitFormResponse(form.id, answers, {
      respondentEmail: body.email ?? undefined,
      respondentName: body.name ?? undefined,
      ipHash,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
    return apiSuccess(submission, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to submit form', 500);
  }
}
