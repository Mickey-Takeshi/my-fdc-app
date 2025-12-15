/**
 * app/api/workspaces/[workspaceId]/members/[memberId]/route.ts
 *
 * Phase 18: メンバー管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, changeMemberRole, removeMember } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; memberId: string }>;
};

// ロール変更
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;
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

    const body = await request.json();
    const { role } = body;

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { success, error } = await changeMemberRole(
      workspaceId,
      memberId,
      role,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/workspaces/[workspaceId]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// メンバー削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;
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

    const { success, error } = await removeMember(
      workspaceId,
      memberId,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
