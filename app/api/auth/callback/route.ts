/**
 * app/api/auth/callback/route.ts
 *
 * OAuth Callback ハンドラー
 * Phase 4: Google OAuth 認証後のコールバック処理
 * Phase 12: provider_token / provider_refresh_token を暗号化保存
 *
 * 【フロー】
 * 1. Google -> Supabase -> /api/auth/callback?code=... へリダイレクト
 * 2. code を使って Supabase セッションを取得
 * 3. users テーブルに upsert
 * 4. provider_token を暗号化して保存（Calendar/Tasks 連携用）
 * 5. fdc_session Cookie を設定（proxy.ts との互換性）
 * 6. /dashboard へリダイレクト
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/server/supabase';
import { encrypt } from '@/lib/server/encryption';

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
  const { data: sessionData, error } =
    await supabase.auth.exchangeCodeForSession(code);

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

  const serviceClient = createServiceClient();

  // users テーブルに upsert（失敗してもログインは続行）
  try {
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

  // Phase 12: provider_token を暗号化して保存（Calendar/Tasks 連携用）
  try {
    const providerToken = sessionData?.session?.provider_token;
    const providerRefreshToken = sessionData?.session?.provider_refresh_token;

    if (providerToken) {
      const encryptedAccessToken = encrypt(providerToken);
      const tokenExpiresAt = new Date(
        Date.now() + 3600 * 1000
      ).toISOString();

      await serviceClient
        .from('users')
        .update({
          google_access_token: encryptedAccessToken,
          google_token_expires_at: tokenExpiresAt,
          google_api_enabled: true,
          google_scopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/tasks',
          ],
        })
        .eq('google_sub', user.id);
    }

    if (providerRefreshToken) {
      const encryptedRefreshToken = encrypt(providerRefreshToken);
      await serviceClient
        .from('users')
        .update({
          google_refresh_token: encryptedRefreshToken,
        })
        .eq('google_sub', user.id);
    }
  } catch (tokenError) {
    // トークン保存に失敗してもログインは続行
    console.error('Token save failed:', tokenError);
  }

  // fdc_session Cookie を作成（proxy.ts との互換性）
  const fdcSessionData = JSON.stringify({
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
  response.cookies.set('fdc_session', encodeURIComponent(fdcSessionData), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return response;
}
