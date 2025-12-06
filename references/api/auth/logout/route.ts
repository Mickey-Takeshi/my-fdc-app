/**
 * app/api/auth/logout/route.ts
 *
 * 【Phase 9.7-A】ログアウト
 * 【Phase 14.2】セッションキャッシュ無効化追加
 *
 * POST /api/auth/logout
 * - セッションを削除
 * - セッションキャッシュを無効化
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/server/auth';
import { invalidateSessionCache } from '@/lib/server/session-cache';
import { authLogger } from '@/lib/server/logger';
import { withSecurityMonitor } from '@/lib/server/security-middleware';

const SESSION_COOKIE_NAME = 'fdc_session';

export async function POST(request: NextRequest) {
  try {
    // Phase 14.9: セキュリティ監視（レート制限）
    const security = await withSecurityMonitor(request, {
      rateLimit: true,
      validateInput: false, // ログアウトはボディなし
    });
    if (security.blocked) {
      return security.response;
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      // Phase 14.2: キャッシュを先に無効化
      await invalidateSessionCache(sessionToken);
      // DBからセッションを削除
      await deleteSession(sessionToken);
    }

    // レスポンスを作成し、Cookie を削除
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    authLogger.error({ err: error }, '[auth/logout] Error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
