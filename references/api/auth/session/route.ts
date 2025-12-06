/**
 * app/api/auth/session/route.ts
 *
 * 【Phase 9.7-A】セッション取得（Supabase SDK完全移行版）
 * 【Phase 14.4】マルチテナント対応 - テナント情報・複数ワークスペース対応追加
 * 【Phase 14.9】セキュリティ監視対応
 *
 * GET /api/auth/session
 * - 現在のユーザー情報を返す
 * - SERVICE_ROLE_KEY を使用してRLSをバイパス
 * - Phase 14.4: テナント情報と所属ワークスペース一覧を含める
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authLogger } from '@/lib/server/logger';
import { extractSubdomain } from '@/lib/server/tenants';
import { isE2ETestRequest } from '@/lib/server/test-mode';
import { handleApiError } from '@/lib/server/api-errors';
import { withSecurityMonitor, recordAuthFailure } from '@/lib/server/security-middleware';

// Supabase JOIN クエリ結果の型（JOIN 結果は配列または単一オブジェクト）
interface WorkspaceMemberRow {
  workspace_id: number;
  role: string;
  workspaces: { id: number; name: string; tenant_id: string | null } | { id: number; name: string; tenant_id: string | null }[] | null;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  authLogger.debug('[Session] Checking session...');

  // Phase 14.9: セキュリティ監視（レート制限・入力検証）
  const security = await withSecurityMonitor(request, {
    rateLimit: true,
    validateInput: true,
  });
  if (security.blocked) {
    return security.response;
  }

  // Phase 14.6.7: E2Eテストモードのチェック（開発環境限定）
  if (isE2ETestRequest(request)) {
    authLogger.debug('[Session] E2E Test mode enabled (development only) - returning mock user');
    return NextResponse.json({
      user: {
        id: 'test-owner-1',
        email: 'owner@test.founderdirect.jp',
        name: 'Test Owner',
        picture: null,
        systemRole: 'SA',
        accountType: 'SA',
        subscriptionStatus: 'SA',
        createdAt: new Date().toISOString(),
        trialDaysRemaining: null,
        isTrialExpired: false,
        workspaceId: '1',
        workspaceRole: 'OWNER',
        tenant: {
          id: 'test-tenant-1',
          name: 'Test Tenant',
          subdomain: 'app',
        },
        workspaces: [
          { id: 1, name: 'Test Workspace', role: 'OWNER' },
        ],
      },
    });
  }

  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    authLogger.debug('[Session] No fdc_session cookie found');
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  authLogger.debug({ token: sessionToken.substring(0, 15) + '...' }, '[Session] Token found');

  try {
    // SERVICE_ROLE_KEY を使用してRLSをバイパス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    authLogger.debug('[Session] Querying session...');

    // セッション検索
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      authLogger.debug({ message: sessionError?.message }, '[Session] Session not found or expired');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    authLogger.debug('[Session] Session valid, fetching user...');

    // Phase 14.8: クエリを並列実行して高速化
    const host = request.headers.get('host') || 'localhost';
    const currentSubdomain = extractSubdomain(host);

    // 並列でユーザー、テナント、ワークスペース情報を取得
    const [userResult, tenantResult, workspaceResult] = await Promise.all([
      // ユーザー情報取得
      supabase
        .from('users')
        .select('id, email, name, picture, system_role, created_at')
        .eq('id', sessionData.user_id)
        .single(),
      // テナント情報取得
      supabase
        .from('tenants')
        .select('id, name, subdomain')
        .eq('subdomain', currentSubdomain)
        .single(),
      // ワークスペース情報取得
      supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            tenant_id
          )
        `)
        .eq('user_id', sessionData.user_id),
    ]);

    const { data: userData, error: userError } = userResult;
    const { data: currentTenant } = tenantResult;
    const { data: allWorkspaceMembers, error: workspaceError } = workspaceResult;

    if (userError || !userData) {
      authLogger.error({ err: userError }, '[Session] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    authLogger.info({ email: userData.email }, '[Session] Success - User');

    if (workspaceError) {
      authLogger.debug({ message: workspaceError.message }, '[Session] No workspace membership found');
    }

    // 現在のテナントに属するワークスペースのみをフィルタリング
    const filteredWorkspaces = ((allWorkspaceMembers || []) as unknown as WorkspaceMemberRow[]).filter((wm) => {
      // テナントIDがない場合（レガシーデータ）またはテナントが一致する場合は含める
      if (!currentTenant) return true;
      const ws = Array.isArray(wm.workspaces) ? wm.workspaces[0] : wm.workspaces;
      return !ws?.tenant_id || ws.tenant_id === currentTenant.id;
    });

    // 最初のワークスペース（後方互換性のため）
    const workspaceMember = filteredWorkspaces[0] as WorkspaceMemberRow | undefined;

    // 試用期間の計算（TEST ユーザーの場合）
    // Phase 9.97: system_role を使用（SA/USER/TEST）
    const systemRole = userData.system_role || 'TEST';
    const createdAt = userData.created_at;
    let trialDaysRemaining: number | null = null;
    let isTrialExpired = false;

    if (systemRole === 'TEST' && createdAt) {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, 14 - diffDays);
      isTrialExpired = diffDays > 14;
    }

    // Phase 14.4: 全ワークスペース情報を整形
    const workspaces = filteredWorkspaces.map((wm) => {
      const ws = Array.isArray(wm.workspaces) ? wm.workspaces[0] : wm.workspaces;
      return {
        id: String(wm.workspace_id),
        name: ws?.name || null,
        role: wm.role,
      };
    });

    // Phase 9.97: accountType は system_role を使用（SA/USER/TEST）
    // Phase 14.4: テナント情報と全ワークスペース一覧を追加
    return NextResponse.json({
      user: {
        id: String(userData.id),
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        systemRole: systemRole,
        accountType: systemRole, // SA判定用（system_roleを使用）
        subscriptionStatus: systemRole, // SA/USER/TEST
        createdAt: createdAt,
        trialDaysRemaining: trialDaysRemaining,
        isTrialExpired: isTrialExpired,
        workspaceId: workspaceMember?.workspace_id ? String(workspaceMember.workspace_id) : null,
        workspaceRole: workspaceMember?.role || null,
        // Phase 14.4: テナント情報
        tenant: currentTenant ? {
          id: currentTenant.id,
          name: currentTenant.name,
          subdomain: currentTenant.subdomain,
        } : null,
        // Phase 14.4: 現在のテナント内で所属する全ワークスペース
        workspaces: workspaces,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, 'Session');
  }
}
