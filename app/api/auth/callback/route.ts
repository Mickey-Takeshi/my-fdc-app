/**
 * app/api/auth/callback/route.ts
 *
 * OAuth Callback ハンドラー
 * Phase 4: Google OAuth 認証後のコールバック処理
 *
 * 【フロー】
 * 1. Google -> Supabase -> /api/auth/callback?code=... へリダイレクト
 * 2. code を使って Supabase セッションを取得
 * 3. users テーブルに upsert
 * 4. fdc_session Cookie を設定（proxy.ts との互換性）
 * 5. /dashboard へリダイレクト
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/server/supabase';

interface CookieOptions {
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  secure?: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Supabase が設定する Cookie を収集
  const pendingCookies: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookies: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          pendingCookies.push(...cookies);
        },
      },
    }
  );

  // PKCE コード交換
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth code exchange failed:', error.message);
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // ユーザー情報を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // users テーブルに upsert（失敗してもログインは続行）
  // 既存テーブルは独自 id を持ち、google_sub で auth.users.id を参照
  try {
    const serviceClient = createServiceClient();
    await serviceClient.from('users').upsert(
      {
        email: user.email,
        name:
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          '',
        picture: user.user_metadata?.avatar_url || null,
        google_sub: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
  } catch (upsertError) {
    console.error('User upsert failed:', upsertError);
  }

  // fdc_session Cookie を作成（proxy.ts との互換性）
  const sessionData = JSON.stringify({
    user: {
      id: user.id,
      email: user.email || '',
      name:
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '',
    },
    loggedInAt: new Date().toISOString(),
    provider: 'google',
  });

  // レスポンスを作成
  const response = NextResponse.redirect(`${origin}${next}`);

  // Supabase Auth の Cookie を設定
  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  // fdc_session Cookie を設定
  response.cookies.set('fdc_session', encodeURIComponent(sessionData), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return response;
}
