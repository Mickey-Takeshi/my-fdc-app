/**
 * app/api/auth/callback/route.ts
 *
 * OAuth コールバック API
 * Phase 4: Google OAuth 認証
 * Phase 5.5: 新規ユーザー用ワークスペース自動作成
 * Phase 12: provider_token を暗号化して保存
 *
 * GET /api/auth/callback
 * - Supabase Auth からのコールバックを処理
 * - ユーザー情報を DB に保存
 * - 新規ユーザーの場合、デフォルトワークスペースを作成
 * - provider_token を暗号化して保存（Calendar/Tasks 連携用）
 * - セッションを作成
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/client';
import { encrypt, isEncryptionConfigured } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  // オープンリダイレクト防止（B氏）
  const redirectTarget = new URL(nextParam, request.url);
  const next =
    redirectTarget.origin === new URL(request.url).origin ? nextParam : '/dashboard';

  // エラーチェック
  if (error || !code) {
    console.error('[Auth Callback] Error or no code:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${error || 'no_code'}`, request.url)
    );
  }

  // レスポンス準備
  const response = NextResponse.redirect(new URL(next, request.url));

  try {
    // 1. Supabase クライアント作成（PKCE 用）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 2. PKCE コード交換
    console.log('[Auth Callback] Exchanging code for session...');
    const {
      data: { user, session: authSession },
      error: authError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !user) {
      console.error('[Auth Callback] Code exchange failed:', authError);
      throw authError || new Error('No user');
    }

    console.log('[Auth Callback] User authenticated:', user.email);

    // Phase 12: provider_token を取得
    const providerToken = authSession?.provider_token;
    const providerRefreshToken = authSession?.provider_refresh_token;
    if (providerToken) {
      console.log('[Auth Callback] Provider token received');
    }

    // 3. 管理者クライアント作成（RLS バイパス用）
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    // 4. ユーザーを upsert
    console.log('[Auth Callback] Upserting user...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          google_sub: user.id,
          email: user.email,
          name:
            user.user_metadata.full_name ||
            user.user_metadata.name ||
            user.email,
          picture: user.user_metadata.avatar_url,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'google_sub',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (userError || !userData) {
      console.error('[Auth Callback] User upsert failed:', userError);
      throw userError || new Error('User save failed');
    }

    console.log('[Auth Callback] User saved:', userData.id);

    // 5. ワークスペース確認・自動作成（新規ユーザー用）
    const { data: existingWorkspaces } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userData.id)
      .limit(1);

    if (!existingWorkspaces || existingWorkspaces.length === 0) {
      // 新規ユーザー：デフォルトワークスペースを作成
      console.log('[Auth Callback] Creating default workspace for new user...');

      const workspaceName = user.user_metadata.full_name
        ? `${user.user_metadata.full_name}のワークスペース`
        : 'マイワークスペース';

      const { data: newWorkspace, error: wsError } = await supabaseAdmin
        .from('workspaces')
        .insert({ name: workspaceName })
        .select('id')
        .single();

      if (wsError || !newWorkspace) {
        console.error('[Auth Callback] Workspace creation failed:', wsError);
        // ワークスペース作成失敗はログインをブロックしない
      } else {
        // OWNER として追加
        const { error: memberError } = await supabaseAdmin
          .from('workspace_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: userData.id,
            role: 'OWNER',
          });

        if (memberError) {
          console.error('[Auth Callback] Workspace member add failed:', memberError);
        } else {
          // workspace_data 初期化
          await supabaseAdmin.from('workspace_data').insert({
            workspace_id: newWorkspace.id,
            data: {},
            version: 1,
          });
          console.log('[Auth Callback] Default workspace created:', newWorkspace.id);
        }
      }
    } else {
      console.log('[Auth Callback] User already has workspace(s)');
    }

    // 5.5. Phase 12: provider_token を暗号化して保存
    if (providerToken && isEncryptionConfigured()) {
      try {
        const encryptedAccessToken = encrypt(providerToken);
        const tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

        const googleTokenData: Record<string, unknown> = {
          google_access_token: encryptedAccessToken,
          google_token_expires_at: tokenExpiresAt,
          google_api_enabled: true,
          google_scopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/tasks',
          ],
        };

        if (providerRefreshToken) {
          googleTokenData.google_refresh_token = encrypt(providerRefreshToken);
        }

        await supabaseAdmin.from('users').update(googleTokenData).eq('id', userData.id);
        console.log('[Auth Callback] Google tokens saved for user:', userData.id);
      } catch (encryptError) {
        console.error('[Auth Callback] Failed to save Google tokens:', encryptError);
        // トークン保存失敗はログインをブロックしない
      }
    }

    // 6. セッショントークン生成
    const sessionToken = `fdc_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日間

    // 7. セッション保存
    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userData.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (sessionError) {
      console.error('[Auth Callback] Session creation failed:', sessionError);
      throw sessionError;
    }

    console.log('[Auth Callback] Session created');

    // 8. FDC Cookie セット
    response.cookies.set('fdc_session', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1週間
    });

    console.log('[Auth Callback] Success - redirecting to', next);
    return response;
  } catch (err) {
    console.error('[Auth Callback] Error:', err);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}
