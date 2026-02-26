# Phase 19: Super Admin（SA）機能

## 目標

システム全体を管理するSuper Admin（SA）機能を実装：
- 全テナント・ワークスペースの管理
- ユーザー管理（停止・削除）
- システムメトリクス表示
- セキュリティ監視

## 習得する新しい概念

| 概念 | 説明 |
|------|------|
| Super Admin (SA) | システム全体を管理する最上位権限 |
| マルチテナント | 複数の組織を1つのシステムで管理 |
| システムメトリクス | ユーザー数、API呼び出し数などの指標 |
| セキュリティ監視 | 不正アクセスの検知 |

## 権限階層

```
Super Admin (SA)
  │ ← システム全体を管理
  ├─ Workspace 1
  │    ├─ OWNER ← ワークスペースを所有
  │    ├─ ADMIN ← メンバー管理可能
  │    └─ MEMBER ← 一般ユーザー
  └─ Workspace 2
       ├─ OWNER
       └─ ...
```

## 前提条件

- [ ] Phase 18 完了（ワークスペース管理動作）
- [ ] users テーブルに account_type カラムが存在

---

## Step 1: Supabase テーブル作成・更新

### 1.1 users テーブルの account_type 確認

既存の users テーブルに `account_type` カラムがあることを確認：

```sql
-- account_type が未設定の場合は追加
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'USER';

-- 既存ユーザーを USER に設定
UPDATE users SET account_type = 'USER' WHERE account_type IS NULL;

-- 自分を SA に設定（メールアドレスを変更）
UPDATE users SET account_type = 'SA' WHERE email = 'your-email@example.com';
```

### 1.2 system_metrics テーブル作成

```sql
-- システムメトリクス
CREATE TABLE system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded ON system_metrics(recorded_at DESC);

-- RLS 有効化
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- ポリシー: SA のみ閲覧可能
CREATE POLICY "system_metrics_select_sa" ON system_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.account_type = 'SA'
  ));

-- ポリシー: SA のみ作成可能
CREATE POLICY "system_metrics_insert_sa" ON system_metrics FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.account_type = 'SA'
  ));
```

### 1.3 security_logs テーブル作成

```sql
-- セキュリティログ
CREATE TABLE security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_security_logs_event ON security_logs(event_type);
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- RLS 有効化
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー: SA のみ閲覧可能
CREATE POLICY "security_logs_select_sa" ON security_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.account_type = 'SA'
  ));

-- ポリシー: システムからの挿入のみ（RLSバイパス用）
CREATE POLICY "security_logs_insert" ON security_logs FOR INSERT
  WITH CHECK (true);
```

### 確認ポイント
- [ ] users.account_type カラムが存在する
- [ ] 自分のアカウントが SA に設定された
- [ ] system_metrics テーブルが作成された
- [ ] security_logs テーブルが作成された
- [ ] RLS ポリシーが設定された

---

## Step 2: 型定義作成

### 2.1 lib/types/super-admin.ts

```typescript
/**
 * lib/types/super-admin.ts
 *
 * Phase 19: Super Admin 型定義
 */

// テナント（ワークスペース）サマリー
export interface TenantSummary {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  ownerName: string | null;
  memberCount: number;
  createdAt: string;
  lastActivityAt: string | null;
}

// ユーザー管理用
export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  accountType: 'SA' | 'USER' | 'TEST';
  status: 'active' | 'suspended';
  workspaceCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

// システムメトリクス
export type MetricType =
  | 'active_users'
  | 'total_users'
  | 'total_workspaces'
  | 'api_calls'
  | 'storage_used'
  | 'login_count';

export interface SystemMetric {
  id: string;
  metricType: MetricType;
  value: number;
  metadata: Record<string, unknown>;
  recordedAt: string;
}

// セキュリティログ
export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'suspicious_activity'
  | 'permission_denied'
  | 'data_export'
  | 'account_locked';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface SecurityLog {
  id: string;
  eventType: SecurityEventType;
  userId: string | null;
  userEmail?: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
  severity: SecuritySeverity;
  createdAt: string;
}

// ダッシュボード統計
export interface SADashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  suspendedUsers: number;
  recentLogins: number;
  criticalAlerts: number;
}

// SA チェック結果
export interface SACheckResult {
  isSA: boolean;
  userId: string | null;
}
```

### 確認ポイント
- [ ] lib/types/super-admin.ts が作成された
- [ ] 必要な型がすべて定義された

---

## Step 3: SA チェック用サーバーヘルパー

### 3.1 lib/server/super-admin.ts

```typescript
/**
 * lib/server/super-admin.ts
 *
 * Phase 19: Super Admin ヘルパー
 */

import { createAdminClient } from '@/lib/supabase/client';

/**
 * ユーザーが Super Admin かどうかをチェック
 */
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.account_type === 'SA';
}

/**
 * セキュリティログを記録
 */
export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  details: Record<string, unknown> = {},
  severity: 'info' | 'warning' | 'critical' = 'info',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase.from('security_logs').insert({
    event_type: eventType,
    user_id: userId,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    details,
    severity,
  });
}

/**
 * システムメトリクスを記録
 */
export async function recordMetric(
  metricType: string,
  value: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase.from('system_metrics').insert({
    metric_type: metricType,
    value,
    metadata,
  });
}
```

### 確認ポイント
- [ ] lib/server/super-admin.ts が作成された

---

## Step 4: SA API エンドポイント作成

### 4.1 app/api/admin/sa/check/route.ts

```typescript
/**
 * app/api/admin/sa/check/route.ts
 *
 * Phase 19: SA 権限チェック API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ isSA: false, userId: null });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ isSA: false, userId: null });
    }

    const { data: user } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', session.userId)
      .single();

    return NextResponse.json({
      isSA: user?.account_type === 'SA',
      userId: session.userId,
    });
  } catch (error) {
    console.error('[SA Check API] Error:', error);
    return NextResponse.json({ isSA: false, userId: null });
  }
}
```

### 4.2 app/api/admin/sa/tenants/route.ts

```typescript
/**
 * app/api/admin/sa/tenants/route.ts
 *
 * Phase 19: テナント一覧 API（SA専用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { checkIsSuperAdmin } from '@/lib/server/super-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // SA チェック
    const isSA = await checkIsSuperAdmin(session.userId);
    if (!isSA) {
      return NextResponse.json({ error: 'Forbidden: SA only' }, { status: 403 });
    }

    // 全ワークスペース取得
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select(`
        id,
        name,
        created_at,
        workspace_members (
          user_id,
          role,
          users (
            email,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tenants = (workspaces || []).map((ws) => {
      const members = ws.workspace_members || [];
      const owner = members.find((m: { role: string }) => m.role === 'OWNER');
      return {
        workspaceId: ws.id,
        workspaceName: ws.name,
        ownerEmail: owner?.users?.email || 'Unknown',
        ownerName: owner?.users?.name || null,
        memberCount: members.length,
        createdAt: ws.created_at,
        lastActivityAt: null, // 将来的に実装
      };
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[SA Tenants API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.3 app/api/admin/sa/users/route.ts

```typescript
/**
 * app/api/admin/sa/users/route.ts
 *
 * Phase 19: ユーザー一覧 API（SA専用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { checkIsSuperAdmin } from '@/lib/server/super-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // SA チェック
    const isSA = await checkIsSuperAdmin(session.userId);
    if (!isSA) {
      return NextResponse.json({ error: 'Forbidden: SA only' }, { status: 403 });
    }

    // 全ユーザー取得
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        account_type,
        status,
        created_at,
        workspace_members (
          workspace_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      accountType: u.account_type || 'USER',
      status: u.status || 'active',
      workspaceCount: u.workspace_members?.length || 0,
      createdAt: u.created_at,
      lastLoginAt: null, // セッションから取得可能
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('[SA Users API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.4 app/api/admin/sa/users/[userId]/route.ts

```typescript
/**
 * app/api/admin/sa/users/[userId]/route.ts
 *
 * Phase 19: ユーザー操作 API（SA専用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { checkIsSuperAdmin, logSecurityEvent } from '@/lib/server/super-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ userId: string }> };

// ユーザー更新（停止/有効化）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // SA チェック
    const isSA = await checkIsSuperAdmin(session.userId);
    if (!isSA) {
      return NextResponse.json({ error: 'Forbidden: SA only' }, { status: 403 });
    }

    const body = await request.json();
    const { status, accountType } = body;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (accountType !== undefined) updates.account_type = accountType;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // セキュリティログ
    await logSecurityEvent(
      status === 'suspended' ? 'account_locked' : 'suspicious_activity',
      userId,
      { action: 'user_status_change', newStatus: status, byAdmin: session.userId },
      status === 'suspended' ? 'warning' : 'info'
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.account_type,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('[SA User Update API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.5 app/api/admin/sa/stats/route.ts

```typescript
/**
 * app/api/admin/sa/stats/route.ts
 *
 * Phase 19: システム統計 API（SA専用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { checkIsSuperAdmin } from '@/lib/server/super-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // SA チェック
    const isSA = await checkIsSuperAdmin(session.userId);
    if (!isSA) {
      return NextResponse.json({ error: 'Forbidden: SA only' }, { status: 403 });
    }

    // 統計を並列取得
    const [usersResult, workspacesResult, securityResult] = await Promise.all([
      supabase.from('users').select('id, status', { count: 'exact' }),
      supabase.from('workspaces').select('id', { count: 'exact' }),
      supabase
        .from('security_logs')
        .select('id', { count: 'exact' })
        .eq('severity', 'critical')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const users = usersResult.data || [];
    const totalUsers = usersResult.count || 0;
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
    const activeUsers = totalUsers - suspendedUsers;

    const stats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalWorkspaces: workspacesResult.count || 0,
      recentLogins: 0, // セッションから計算可能
      criticalAlerts: securityResult.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[SA Stats API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.6 app/api/admin/sa/security-logs/route.ts

```typescript
/**
 * app/api/admin/sa/security-logs/route.ts
 *
 * Phase 19: セキュリティログ API（SA専用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { checkIsSuperAdmin } from '@/lib/server/super-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // SA チェック
    const isSA = await checkIsSuperAdmin(session.userId);
    if (!isSA) {
      return NextResponse.json({ error: 'Forbidden: SA only' }, { status: 403 });
    }

    // クエリパラメータ
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('security_logs')
      .select(`
        id,
        event_type,
        user_id,
        ip_address,
        user_agent,
        details,
        severity,
        created_at,
        users (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (logs || []).map((log) => ({
      id: log.id,
      eventType: log.event_type,
      userId: log.user_id,
      userEmail: log.users?.email || null,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      details: log.details,
      severity: log.severity,
      createdAt: log.created_at,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error('[SA Security Logs API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 確認ポイント
- [ ] 6つの API エンドポイントが作成された
- [ ] すべてのエンドポイントで SA チェックが実装された

---

## Step 5: Context 作成

### 5.1 lib/contexts/SuperAdminContext.tsx

```typescript
/**
 * lib/contexts/SuperAdminContext.tsx
 *
 * Phase 19: Super Admin Context
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  TenantSummary,
  UserSummary,
  SADashboardStats,
  SecurityLog,
} from '@/lib/types/super-admin';

interface SuperAdminContextValue {
  isSA: boolean;
  loading: boolean;
  stats: SADashboardStats | null;
  tenants: TenantSummary[];
  users: UserSummary[];
  securityLogs: SecurityLog[];
  checkSAStatus: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchSecurityLogs: (severity?: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextValue | undefined>(undefined);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [isSA, setIsSA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SADashboardStats | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // SA ステータスチェック
  const checkSAStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sa/check');
      const data = await res.json();
      setIsSA(data.isSA);
    } catch {
      setIsSA(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 統計取得
  const fetchStats = useCallback(async () => {
    if (!isSA) return;
    try {
      const res = await fetch('/api/admin/sa/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [isSA]);

  // テナント一覧取得
  const fetchTenants = useCallback(async () => {
    if (!isSA) return;
    try {
      const res = await fetch('/api/admin/sa/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    }
  }, [isSA]);

  // ユーザー一覧取得
  const fetchUsers = useCallback(async () => {
    if (!isSA) return;
    try {
      const res = await fetch('/api/admin/sa/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [isSA]);

  // セキュリティログ取得
  const fetchSecurityLogs = useCallback(async (severity?: string) => {
    if (!isSA) return;
    try {
      const url = severity
        ? `/api/admin/sa/security-logs?severity=${severity}`
        : '/api/admin/sa/security-logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSecurityLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch security logs:', err);
    }
  }, [isSA]);

  // ユーザーステータス更新
  const updateUserStatus = useCallback(async (userId: string, status: 'active' | 'suspended') => {
    if (!isSA) return;
    try {
      const res = await fetch(`/api/admin/sa/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  }, [isSA]);

  // 初期チェック
  useEffect(() => {
    checkSAStatus();
  }, [checkSAStatus]);

  return (
    <SuperAdminContext.Provider
      value={{
        isSA,
        loading,
        stats,
        tenants,
        users,
        securityLogs,
        checkSAStatus,
        fetchStats,
        fetchTenants,
        fetchUsers,
        fetchSecurityLogs,
        updateUserStatus,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] SuperAdminContext が作成された
- [ ] useSuperAdmin フックがエクスポートされた

---

## Step 6: UI コンポーネント作成

### 6.1 app/_components/admin/sa/index.ts

```typescript
/**
 * app/_components/admin/sa/index.ts
 *
 * Phase 19: SA コンポーネントエクスポート
 */

export { SADashboard } from './SADashboard';
export { TenantList } from './TenantList';
export { UserManagement } from './UserManagement';
export { SecurityMonitor } from './SecurityMonitor';
```

### 6.2 app/_components/admin/sa/SADashboard.tsx

```typescript
/**
 * app/_components/admin/sa/SADashboard.tsx
 *
 * Phase 19: SA ダッシュボード
 */

'use client';

import { useEffect } from 'react';
import { Users, Building2, AlertTriangle, Activity } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { GlassCard } from '@/app/_components/brand/GlassCard';

export function SADashboard() {
  const { isSA, stats, fetchStats } = useSuperAdmin();

  useEffect(() => {
    if (isSA) {
      fetchStats();
    }
  }, [isSA, fetchStats]);

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  const cards = [
    {
      label: '総ユーザー数',
      value: stats.totalUsers,
      icon: Users,
      color: '#3b82f6',
    },
    {
      label: 'アクティブユーザー',
      value: stats.activeUsers,
      icon: Activity,
      color: '#22c55e',
    },
    {
      label: 'ワークスペース数',
      value: stats.totalWorkspaces,
      icon: Building2,
      color: '#8b5cf6',
    },
    {
      label: '停止中ユーザー',
      value: stats.suspendedUsers,
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      label: '重大アラート（24h）',
      value: stats.criticalAlerts,
      icon: AlertTriangle,
      color: stats.criticalAlerts > 0 ? '#ef4444' : '#6b7280',
    },
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: 'white' }}>
        システム概要
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {cards.map((card) => (
          <GlassCard key={card.label} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${card.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <card.icon size={24} color={card.color} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {card.label}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

### 6.3 app/_components/admin/sa/TenantList.tsx

```typescript
/**
 * app/_components/admin/sa/TenantList.tsx
 *
 * Phase 19: テナント一覧
 */

'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Calendar, Search } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { GlassCard } from '@/app/_components/brand/GlassCard';

export function TenantList() {
  const { isSA, tenants, fetchTenants } = useSuperAdmin();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isSA) {
      fetchTenants();
    }
  }, [isSA, fetchTenants]);

  const filtered = tenants.filter(
    (t) =>
      t.workspaceName.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
          テナント一覧
        </h3>
        <div style={{ flex: 1, maxWidth: '300px', position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            テナントが見つかりません
          </div>
        ) : (
          filtered.map((tenant) => (
            <GlassCard key={tenant.workspaceId} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={20} color="#8b5cf6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                    {tenant.workspaceName}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Owner: {tenant.ownerEmail}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <Users size={14} />
                    <span style={{ fontSize: '14px' }}>{tenant.memberCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <Calendar size={14} />
                    <span style={{ fontSize: '12px' }}>
                      {new Date(tenant.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
```

### 6.4 app/_components/admin/sa/UserManagement.tsx

```typescript
/**
 * app/_components/admin/sa/UserManagement.tsx
 *
 * Phase 19: ユーザー管理
 */

'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Ban, CheckCircle, Search } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { GlassCard } from '@/app/_components/brand/GlassCard';

export function UserManagement() {
  const { isSA, users, fetchUsers, updateUserStatus } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isSA) {
      fetchUsers();
    }
  }, [isSA, fetchUsers]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (newStatus === 'suspended' && !confirm('このユーザーを停止しますか？')) return;

    setUpdating(userId);
    await updateUserStatus(userId, newStatus);
    setUpdating(null);
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  const getAccountTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      SA: '#ef4444',
      USER: '#3b82f6',
      TEST: '#6b7280',
    };
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: `${colors[type] || colors.USER}20`,
          color: colors[type] || colors.USER,
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
          ユーザー管理
        </h3>
        <div style={{ flex: 1, maxWidth: '300px', position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メール or 名前で検索..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            ユーザーが見つかりません
          </div>
        ) : (
          filtered.map((user) => (
            <GlassCard key={user.id} style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: user.status === 'suspended' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.accountType === 'SA' ? (
                    <Shield size={18} color="#ef4444" />
                  ) : (
                    <User size={18} color={user.status === 'suspended' ? '#ef4444' : '#3b82f6'} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                      {user.name || user.email}
                    </span>
                    {getAccountTypeBadge(user.accountType)}
                    {user.status === 'suspended' && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: '11px',
                        }}
                      >
                        停止中
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {user.email} • {user.workspaceCount} workspace(s)
                  </div>
                </div>
                {user.accountType !== 'SA' && (
                  <button
                    onClick={() => handleStatusToggle(user.id, user.status)}
                    disabled={updating === user.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: user.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                      color: user.status === 'active' ? '#ef4444' : '#22c55e',
                      cursor: updating === user.id ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {user.status === 'active' ? (
                      <>
                        <Ban size={14} />
                        停止
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        有効化
                      </>
                    )}
                  </button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
```

### 6.5 app/_components/admin/sa/SecurityMonitor.tsx

```typescript
/**
 * app/_components/admin/sa/SecurityMonitor.tsx
 *
 * Phase 19: セキュリティ監視
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Info, RefreshCw } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { GlassCard } from '@/app/_components/brand/GlassCard';
import { SecuritySeverity } from '@/lib/types/super-admin';

export function SecurityMonitor() {
  const { isSA, securityLogs, fetchSecurityLogs } = useSuperAdmin();
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isSA) {
      fetchSecurityLogs(filter === 'all' ? undefined : filter);
    }
  }, [isSA, filter, fetchSecurityLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityLogs(filter === 'all' ? undefined : filter);
    setRefreshing(false);
  };

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={16} color="#ef4444" />;
      case 'warning':
        return <Shield size={16} color="#f59e0b" />;
      default:
        return <Info size={16} color="#3b82f6" />;
    }
  };

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
          セキュリティ監視
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: filter === sev ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                background: filter === sev ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {sev === 'all' ? 'すべて' : sev}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
        {securityLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            ログがありません
          </div>
        ) : (
          securityLogs.map((log) => {
            const colors = getSeverityColor(log.severity);
            return (
              <GlassCard
                key={log.id}
                style={{
                  padding: '12px 16px',
                  background: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {getSeverityIcon(log.severity)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                        {log.eventType}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {new Date(log.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    {log.userEmail && (
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        User: {log.userEmail}
                      </div>
                    )}
                    {log.ipAddress && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
```

### 確認ポイント
- [ ] 4つの SA コンポーネントが作成された
- [ ] index.ts でエクスポートされた

---

## Step 7: 管理ページ更新

### 7.1 app/(app)/admin/page.tsx を更新

既存の admin/page.tsx に SA タブを追加：

```typescript
/**
 * app/(app)/admin/page.tsx
 *
 * Phase 18 + 19: ワークスペース管理 + Super Admin
 */

'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { SuperAdminProvider, useSuperAdmin } from '@/lib/contexts/SuperAdminContext';
import { Shield, Users, Building2, Activity, AlertTriangle } from 'lucide-react';
// 既存コンポーネント
import { MemberList, InvitationManager, AuditLog } from '@/app/_components/admin';
// SA コンポーネント
import { SADashboard, TenantList, UserManagement, SecurityMonitor } from '@/app/_components/admin/sa';

type TabId = 'members' | 'invitations' | 'audit' | 'sa-dashboard' | 'sa-tenants' | 'sa-users' | 'sa-security';

function AdminPageContent() {
  const { workspace, loading, role } = useWorkspace();
  const { isSA, loading: saLoading } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState<TabId>('members');

  // SA用タブリスト
  const saTabs = [
    { id: 'sa-dashboard' as TabId, label: 'SA ダッシュボード', icon: Activity },
    { id: 'sa-tenants' as TabId, label: 'テナント', icon: Building2 },
    { id: 'sa-users' as TabId, label: 'ユーザー管理', icon: Users },
    { id: 'sa-security' as TabId, label: 'セキュリティ', icon: AlertTriangle },
  ];

  // ワークスペース管理タブ
  const workspaceTabs = [
    { id: 'members' as TabId, label: 'メンバー', icon: Users },
    { id: 'invitations' as TabId, label: '招待', icon: Shield },
    { id: 'audit' as TabId, label: '監査ログ', icon: Activity },
  ];

  if (loading || saLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  // 権限チェック
  const canAccessWorkspaceAdmin = workspace && (role === 'OWNER' || role === 'ADMIN');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '24px',
        margin: '-24px',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: 'white' }}>
            管理
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            {isSA ? 'システム全体とワークスペースの管理' : 'ワークスペースの管理'}
          </p>
        </div>

        {/* タブナビゲーション */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* SA タブ（SAのみ表示） */}
          {isSA && (
            <>
              {saTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: activeTab === tab.id ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                    background: activeTab === tab.id ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(239, 68, 68, 0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
              <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 8px' }} />
            </>
          )}

          {/* ワークスペース管理タブ */}
          {canAccessWorkspaceAdmin &&
            workspaceTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'sa-dashboard' && isSA && <SADashboard />}
        {activeTab === 'sa-tenants' && isSA && <TenantList />}
        {activeTab === 'sa-users' && isSA && <UserManagement />}
        {activeTab === 'sa-security' && isSA && <SecurityMonitor />}
        {activeTab === 'members' && canAccessWorkspaceAdmin && <MemberList />}
        {activeTab === 'invitations' && canAccessWorkspaceAdmin && <InvitationManager />}
        {activeTab === 'audit' && canAccessWorkspaceAdmin && <AuditLog />}

        {/* アクセス権限がない場合 */}
        {!isSA && !canAccessWorkspaceAdmin && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            <Shield size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>管理機能へのアクセス権限がありません</p>
            <p style={{ fontSize: '14px' }}>ワークスペースの OWNER または ADMIN 権限が必要です</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <SuperAdminProvider>
      <AdminPageContent />
    </SuperAdminProvider>
  );
}
```

### 確認ポイント
- [ ] admin/page.tsx が更新された
- [ ] SA タブと通常の管理タブが分離された
- [ ] SuperAdminProvider がラップされた

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] ビルドがエラーなく完了
- [ ] `/admin` ページが出力に含まれている
- [ ] SA 用 API エンドポイントが含まれている

---

## 完了チェックリスト

### Supabase
- [ ] users.account_type が存在し、自分が SA に設定された
- [ ] system_metrics テーブルが作成された
- [ ] security_logs テーブルが作成された
- [ ] RLS ポリシーが設定された

### コード
- [ ] lib/types/super-admin.ts が作成された
- [ ] lib/server/super-admin.ts が作成された
- [ ] lib/contexts/SuperAdminContext.tsx が作成された
- [ ] 6つの SA 用 API エンドポイントが作成された
- [ ] 4つの SA UI コンポーネントが作成された
- [ ] admin/page.tsx が SA 対応に更新された

### 動作確認
- [ ] SA ユーザーでログインすると SA タブが表示される
- [ ] SA ダッシュボードに統計が表示される
- [ ] テナント一覧が表示・検索できる
- [ ] ユーザーの停止/有効化ができる
- [ ] セキュリティログが表示される
- [ ] 非 SA ユーザーには SA タブが表示されない
- [ ] ビルドが成功する

---

## トラブルシューティング

### SA タブが表示されない
- users.account_type が 'SA' に設定されているか確認
- /api/admin/sa/check が正しく動作しているか確認

### API が 403 を返す
- checkIsSuperAdmin 関数の実装を確認
- セッションが有効か確認

### セキュリティログが空
- security_logs テーブルの RLS を確認
- logSecurityEvent 関数が呼び出されているか確認

### 統計が表示されない
- /api/admin/sa/stats API のレスポンスを確認
- Promise.all 内のクエリがエラーを返していないか確認
