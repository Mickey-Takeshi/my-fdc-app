/**
 * app/api/workspaces/[workspaceId]/invitations/route.ts
 *
 * Phase 18: 招待管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, isAuthError } from '@/lib/server/api-auth';
import { createInvitation, getInvitations } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

// 招待一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    // 認証・権限チェック（OWNER/ADMIN のみ）
    const auth = await checkAdminAuth(request, workspaceId);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const invitations = await getInvitations(workspaceId);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 招待作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    // 認証・権限チェック（OWNER/ADMIN のみ）
    const auth = await checkAdminAuth(request, workspaceId);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const { invitation, error } = await createInvitation(
      workspaceId,
      auth.userId,
      { email, role }
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workspaces/[workspaceId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
