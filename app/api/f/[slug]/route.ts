import { NextRequest } from 'next/server';
import { getPublicForm, submitFormResponse } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';
import { createHash } from 'crypto';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const form = await getPublicForm(slug);
  if (!form) return apiError('NOT_FOUND', 'Form not found', 404);
  return apiSuccess(form);
}

const submissionSchema = z.object({
  respondent_email: z.string().email().optional(),
  respondent_name: z.string().optional(),
  answers: z.record(z.string(), z.unknown()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const form = await getPublicForm(slug);
  if (!form) return apiError('NOT_FOUND', 'Form not found', 404);

  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0].message, 400);

  // IP ハッシュ化（GDPR 対応）
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ipHash = createHash('sha256').update(ip + process.env.CRON_SECRET).digest('hex').slice(0, 16);

  try {
    const submission = await submitFormResponse(form.id, {
      ...parsed.data,
      metadata: { ipHash, userAgent: request.headers.get('user-agent')?.slice(0, 200) },
    });
    return apiSuccess(submission, 201);
  } catch {
    return apiError('INTERNAL', 'Failed to submit form', 500);
  }
}
