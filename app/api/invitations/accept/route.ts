/**
 * app/api/invitations/accept/route.ts
 *
 * Phase 18: 招待承認 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { acceptInvitation } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { success, workspaceId, error } = await acceptInvitation(
      token,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error('Error in POST /api/invitations/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
