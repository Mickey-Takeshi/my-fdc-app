/**
 * app/api/auth/logout/route.ts
 *
 * ログアウト API
 * Phase 3: 認証基盤
 *
 * POST /api/auth/logout
 * - セッションを削除
 * - Cookie を削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/server/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const SESSION_COOKIE_NAME = 'fdc_session';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Supabase 設定済みかつセッションがある場合は DB から削除
    if (isSupabaseConfigured() && sessionToken) {
      await deleteSession(sessionToken);
    }

    // レスポンスを作成し、Cookie を削除
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('[Logout API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
