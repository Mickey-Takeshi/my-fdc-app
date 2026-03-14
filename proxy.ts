import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/',
  '/api/auth/callback',
  '/api/f/',
  '/api/webhooks/',
  '/api/health',
  '/f/',
  '/_next',
  '/favicon.ico',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = isPublicRoute(pathname)
    ? NextResponse.next()
    : (() => {
        // 認証チェック: Supabase セッション Cookie の存在確認
        // 実際のトークン検証は各 API Route の requireAuth で実施
        const hasSession = request.cookies.getAll()
          .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
        if (!hasSession) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
      })();

  // API ルートにセキュリティヘッダーを設定
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
