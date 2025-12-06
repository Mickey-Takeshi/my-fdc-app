import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { authLogger } from '@/lib/server/logger';
import { extractSubdomain } from '@/lib/server/tenants';
import { withSecurityMonitor, recordAuthFailure } from '@/lib/server/security-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * ホスト名からテナントIDを解決
 * 新規ユーザー登録時に tenant_id を設定するために使用
 */
async function resolveTenantId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: ReturnType<typeof createClient<any>>,
  host: string
): Promise<string> {
  const subdomain = extractSubdomain(host);

  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  if (error || !tenant) {
    // テナントが見つからない場合、デフォルトテナント 'app' を使用
    authLogger.warn({ subdomain }, '[Auth Callback] Tenant not found, using default "app"');
    const { data: defaultTenant, error: defaultError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subdomain', 'app')
      .single();

    if (defaultError || !defaultTenant) {
      throw new Error('Default tenant "app" not found in database');
    }
    return (defaultTenant as { id: string }).id;
  }

  return (tenant as { id: string }).id;
}

export async function GET(request: NextRequest) {
  authLogger.info('[Auth Callback] ========== START ==========');

  // Phase 14.9: セキュリティ監視（レート制限・入力検証）
  const security = await withSecurityMonitor(request, {
    rateLimit: true,
    validateInput: true,
  });
  if (security.blocked) {
    return security.response;
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  authLogger.debug({ codePresent: !!code }, '[Auth Callback] Code present');
  authLogger.debug({ error }, '[Auth Callback] Error param');

  // エラーチェック
  if (error || !code) {
    authLogger.error({ err: error, errorCode: error || 'no_code' }, '[Auth Callback] Error or no code');
    // Phase 14.9: 認証失敗を記録
    await recordAuthFailure(request, undefined, error || 'no_code');
    return NextResponse.redirect(new URL(`/login?error=${error || 'no_code'}`, request.url));
  }

  // レスポンス準備
  const response = NextResponse.redirect(new URL(next, request.url));

  try {
    // 1. Supabase クライアント作成（PKCE用）
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
    authLogger.info('[Auth Callback] Step 1: Exchanging code...');
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !user) {
      authLogger.error({ err: authError }, '[Auth Callback] Step 1 FAILED');
      // Phase 14.9: コード交換失敗を記録
      await recordAuthFailure(request, undefined, authError?.message || 'exchange_failed');
      throw authError || new Error('No user');
    }

    authLogger.info({ email: user.email }, '[Auth Callback] Step 1 SUCCESS - User');

    // 3. 管理者クライアント作成（RLSバイパス用）
    authLogger.debug('[Auth Callback] Step 2: Creating admin client...');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3.5. テナントIDを解決（Phase 14.4: マルチテナント対応）
    const host = request.headers.get('host') || 'localhost';
    authLogger.debug({ host }, '[Auth Callback] Step 2.5: Resolving tenant...');
    const tenantId = await resolveTenantId(supabaseAdmin, host);
    authLogger.info({ tenantId }, '[Auth Callback] Step 2.5 SUCCESS - Tenant ID');

    // 4. ユーザーをupsert
    // Phase 9.97: 新規ユーザーは system_role = 'TEST' でスタート（DBデフォルト）
    // 既存ユーザーは現在の system_role を維持
    // Phase 14.4: tenant_id を設定（マルチテナント対応）
    authLogger.info('[Auth Callback] Step 3: Saving user with SERVICE_ROLE_KEY...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          google_sub: user.id,
          email: user.email,
          name: user.user_metadata.full_name || user.user_metadata.name || user.email,
          picture: user.user_metadata.avatar_url,
          tenant_id: tenantId, // Phase 14.4: テナントID設定
          // system_role は指定しない → 新規ユーザーは DB デフォルト 'TEST' を使用
          // 既存ユーザーは現在の値を維持
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'google_sub',
          ignoreDuplicates: false  // 既存ユーザーは更新（email, name, picture のみ）
        }
      )
      .select('id')
      .single();

    if (userError || !userData) {
      authLogger.error({ err: userError }, '[Auth Callback] Step 3 FAILED');
      throw userError || new Error('User save failed');
    }

    authLogger.info({ userId: userData.id }, '[Auth Callback] Step 3 SUCCESS - User ID');

    // 4.5. 新規ユーザーの場合、デフォルトワークスペースを作成
    authLogger.debug('[Auth Callback] Step 3.5: Checking workspace membership...');
    const { data: existingMembership } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('user_id', userData.id)
      .limit(1)
      .maybeSingle();

    if (!existingMembership) {
      // 新規ユーザー：デフォルトワークスペースを作成
      // Phase 14.4: tenant_id を設定（マルチテナント対応）
      authLogger.info('[Auth Callback] Step 3.5: Creating default workspace for new user...');

      const userName = user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'User';
      const { data: newWorkspace, error: wsCreateError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: `${userName}のワークスペース`,
          tenant_id: tenantId, // Phase 14.4: テナントID設定
        })
        .select('id')
        .single();

      if (wsCreateError || !newWorkspace) {
        authLogger.error({ err: wsCreateError }, '[Auth Callback] Step 3.5 FAILED - Workspace creation');
        throw wsCreateError || new Error('Workspace creation failed');
      }

      // ワークスペースメンバーシップを作成（OWNER権限）
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: userData.id,
          role: 'OWNER'
        });

      if (memberError) {
        authLogger.error({ err: memberError }, '[Auth Callback] Step 3.5 FAILED - Membership creation');
        throw memberError;
      }

      // workspace_data を初期化（空のデータ）
      const { error: dataError } = await supabaseAdmin
        .from('workspace_data')
        .insert({
          workspace_id: newWorkspace.id,
          data: {},
          version: 1,
          updated_at: new Date().toISOString()
        });

      if (dataError) {
        // workspace_data作成失敗は致命的ではないのでログのみ
        authLogger.warn({ err: dataError }, '[Auth Callback] Step 3.5 WARNING - workspace_data creation failed');
      }

      authLogger.info({ workspaceId: newWorkspace.id }, '[Auth Callback] Step 3.5 SUCCESS - Default workspace created');
    } else {
      authLogger.debug('[Auth Callback] Step 3.5: User already has workspace membership');
    }

    // 5. セッショントークン生成
    authLogger.debug('[Auth Callback] Step 4: Creating session...');
    const sessionToken = `fdc_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 6. セッション保存
    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userData.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (sessionError) {
      authLogger.error({ err: sessionError }, '[Auth Callback] Step 4 FAILED');
      throw sessionError;
    }

    authLogger.info({ token: sessionToken.substring(0, 15) + '...' }, '[Auth Callback] Step 4 SUCCESS - Token');

    // 7. FDC Cookie セット
    authLogger.debug('[Auth Callback] Step 5: Setting fdc_session cookie...');
    response.cookies.set('fdc_session', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1週間
    });

    authLogger.debug('[Auth Callback] Step 5 SUCCESS');
    authLogger.info('[Auth Callback] ========== SUCCESS ==========');

    return response;

  } catch (error: unknown) {
    authLogger.error({ err: error }, '[Auth Callback] ========== CRITICAL ERROR ==========');
    authLogger.error({ err: error, message: error instanceof Error ? error.message : 'Unknown' }, '[Auth Callback] Error message');
    authLogger.error({ err: error }, '[Auth Callback] Error details');
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
