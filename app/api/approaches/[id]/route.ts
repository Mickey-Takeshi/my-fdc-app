/**
 * app/api/approaches/[id]/route.ts
 *
 * 個別アプローチ操作 API（Phase 8）
 * DELETE /api/approaches/:id - アプローチ削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/approaches/:id
 * アプローチ削除（MEMBER 以上）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // アプローチのワークスペースを取得
  const { data: approach } = await supabase
    .from('approaches')
    .select('workspace_id')
    .eq('id', id)
    .single();

  if (!approach) {
    return NextResponse.json({ error: 'アプローチが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, approach.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const { error } = await supabase
    .from('approaches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Approach delete error:', error);
    return NextResponse.json(
      { error: 'アプローチの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
