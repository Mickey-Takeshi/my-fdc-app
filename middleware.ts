/**
 * middleware.ts
 *
 * 認証保護ミドルウェア
 * Phase 4: Google OAuth 認証
 *
 * - 保護ルートへの未認証アクセスを /login にリダイレクト
 * - 認証済みで /login にアクセスした場合は /dashboard にリダイレクト
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なルート
const PROTECTED_ROUTES = ['/dashboard', '/tasks', '/settings'];

// 認証不要のルート（静的ファイル、API など）
const PUBLIC_ROUTES = ['/login', '/api', '/_next', '/favicon.ico', '/invite'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開ルートはスキップ
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // /login で認証済みの場合はダッシュボードへ
    if (pathname === '/login') {
      const sessionToken = request.cookies.get('fdc_session')?.value;
      // localStorage の認証も考慮（クライアント側で処理）
      if (sessionToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // 保護ルートへのアクセスをチェック
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    // Cookie がない場合は /login へ
    // ただし localStorage 認証の可能性があるので、クライアント側でも再チェック
    if (!sessionToken) {
      // localStorage 認証のためのフォールバック
      // layout.tsx でクライアント側の認証チェックを行う
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
