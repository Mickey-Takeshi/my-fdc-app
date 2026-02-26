import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
  '/api/f/',
  '/api/webhooks',
  '/api/health',
  '/f/',
  '/_next',
  '/favicon.ico',
  '/invite',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // LP (root page)
  if (pathname === '/') {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (pathname === '/login' && request.cookies.get('fdc_session')?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 認証チェック
  const session = request.cookies.get('fdc_session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
