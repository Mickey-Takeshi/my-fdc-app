/**
 * app/api/auth/session/route.ts
 *
 * セッション取得 API
 * Phase 3: 認証基盤
 *
 * GET /api/auth/session
 * - Cookie からセッショントークンを取得
 * - セッションを検証してユーザー情報を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getUserById } from '@/lib/server/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[Session API] Checking session...');

  // Supabase 未設定の場合はモックモード
  if (!isSupabaseConfigured()) {
    console.log('[Session API] Supabase not configured, using mock mode');
    // localStorage ベースの認証を維持（Phase 0-2 互換）
    return NextResponse.json({
      user: null,
      mockMode: true,
      message: 'Supabase not configured. Using localStorage authentication.',
    });
  }

  // Cookie からセッショントークンを取得
  const sessionToken = request.cookies.get('fdc_session')?.value;
  console.log('[Session API] Token:', sessionToken ? sessionToken.substring(0, 15) + '...' : 'none');

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'No session' },
      { status: 401 }
    );
  }

  try {
    // セッションを検証
    console.log('[Session API] Validating session...');
    const session = await validateSession(sessionToken);

    if (!session) {
      console.log('[Session API] Session invalid or expired');
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
    console.log('[Session API] Session valid, userId:', session.userId);

    // ユーザー情報を取得
    const user = await getUserById(session.userId);

    if (!user) {
      console.log('[Session API] User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    console.log('[Session API] User found:', user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        accountType: user.accountType,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Session API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
