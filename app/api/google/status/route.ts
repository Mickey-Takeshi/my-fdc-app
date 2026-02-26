/**
 * app/api/google/status/route.ts
 *
 * Phase 12: Google 連携状態確認
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getGoogleTokens, isTokenExpired } from '@/lib/server/google-tokens';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const tokens = await getGoogleTokens(session.userId);

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        scopes: [],
      });
    }

    return NextResponse.json({
      connected: true,
      scopes: tokens.scopes || [],
      expiresAt: tokens.expiresAt?.toISOString(),
      isExpired: isTokenExpired(tokens.expiresAt),
      hasRefreshToken: !!tokens.refreshToken,
    });
  } catch (error) {
    console.error('Error in GET /api/google/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
