import { NextRequest } from 'next/server';
import { getPublicForm } from '@/lib/server/forms-db';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const form = await getPublicForm(slug);
  if (!form) {
    // slug列挙攻撃対策（B氏）: 非公開フォームは404
    return apiError('NOT_FOUND', 'Form not found', 404);
  }

  return apiSuccess(form);
}
