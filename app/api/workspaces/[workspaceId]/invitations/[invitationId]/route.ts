/**
 * app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts
 *
 * Phase 18: 招待削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, cancelInvitation } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; invitationId: string }>;
};

// 招待キャンセル
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, invitationId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['OWNER', 'ADMIN']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { success, error } = await cancelInvitation(
      invitationId,
      session.userId,
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
