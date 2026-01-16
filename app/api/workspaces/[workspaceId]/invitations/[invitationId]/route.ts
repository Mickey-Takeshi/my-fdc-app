/**
 * app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts
 *
 * Phase 18: 招待削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, isAuthError } from '@/lib/server/api-auth';
import { cancelInvitation } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; invitationId: string }>;
};

// 招待キャンセル
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, invitationId } = await params;

    // 認証・権限チェック（OWNER/ADMIN のみ）
    const auth = await checkAdminAuth(request, workspaceId);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { success, error } = await cancelInvitation(
      invitationId,
      auth.userId,
      workspaceId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
