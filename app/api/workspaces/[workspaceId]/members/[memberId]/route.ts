/**
 * app/api/workspaces/[workspaceId]/members/[memberId]/route.ts
 *
 * Phase 18: メンバー管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, isAuthError } from '@/lib/server/api-auth';
import { changeMemberRole, removeMember } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; memberId: string }>;
};

// ロール変更
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;
    const auth = await checkAdminAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const body = await request.json();
    const { role } = body;

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { success, error } = await changeMemberRole(
      workspaceId,
      memberId,
      role,
      userId
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
    const auth = await checkAdminAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = auth;

    const { success, error } = await removeMember(
      workspaceId,
      memberId,
      userId
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
