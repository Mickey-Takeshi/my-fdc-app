# Phase 5: Workspace & ロール管理

**前提条件:** Phase 4 完了（Google OAuth 動作確認済み）

---

## 1. 概要

Phase 5 では、マルチユーザー対応のためのワークスペース機能とロールベースアクセス制御（RBAC）を実装します。

### 1.1 ゴール

- workspaces / workspace_members テーブル作成
- OWNER / ADMIN / MEMBER ロール定義
- Workspace API 実装
- WorkspaceContext 実装
- ロール別権限チェック

### 1.2 用語定義

| 用語 | 説明 |
|------|------|
| Workspace | データを共有する単位（チーム・プロジェクト） |
| OWNER | ワークスペース作成者。全権限を持つ |
| ADMIN | メンバー管理・設定変更が可能 |
| MEMBER | データ閲覧・編集が可能。メンバー管理不可 |

---

## 2. データベース設計

### 2.1 workspaces テーブル

```sql
-- migrations/005-workspaces.sql

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at);

-- RLS 有効化
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: メンバーのみアクセス可能
CREATE POLICY workspaces_select_policy ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );
```

### 2.2 workspace_members テーブル

```sql
-- migrations/006-workspace-members.sql

-- ロール型定義
CREATE TYPE workspace_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- インデックス
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- RLS 有効化
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: 同じワークスペースのメンバーのみ閲覧可能
CREATE POLICY workspace_members_select_policy ON workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- OWNER/ADMIN のみメンバー追加可能
CREATE POLICY workspace_members_insert_policy ON workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- OWNER のみメンバー削除可能
CREATE POLICY workspace_members_delete_policy ON workspace_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'OWNER'
    )
  );
```

### 2.3 workspace_data テーブル（オプション）

```sql
-- migrations/007-workspace-data.sql

CREATE TABLE IF NOT EXISTS workspace_data (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 有効化
ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

-- メンバーのみデータアクセス可能
CREATE POLICY workspace_data_select_policy ON workspace_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_data.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- OWNER/ADMIN/MEMBER がデータ更新可能
CREATE POLICY workspace_data_update_policy ON workspace_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_data.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
```

---

## 3. 型定義

### 3.1 lib/types/workspace.ts

```typescript
/**
 * lib/types/workspace.ts
 *
 * ワークスペース関連の型定義
 * Phase 5: Workspace & ロール管理
 */

import { z } from 'zod';

// ========================================
// ロール定義
// ========================================

export const WorkspaceRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

// ========================================
// ワークスペース
// ========================================

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

// ========================================
// 権限チェック
// ========================================

/**
 * ロールの権限レベル
 * OWNER > ADMIN > MEMBER
 */
export const ROLE_LEVELS: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * 指定したロール以上の権限を持っているか
 */
export function hasRoleOrAbove(
  currentRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return ROLE_LEVELS[currentRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * OWNER かどうか
 */
export function isOwner(role: WorkspaceRole): boolean {
  return role === 'OWNER';
}

/**
 * ADMIN 以上かどうか
 */
export function isAdminOrAbove(role: WorkspaceRole): boolean {
  return hasRoleOrAbove(role, 'ADMIN');
}

// ========================================
// API リクエスト/レスポンス
// ========================================

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: WorkspaceRoleSchema.default('MEMBER'),
});

export type AddMemberRequest = z.infer<typeof AddMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: WorkspaceRoleSchema,
});

export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleSchema>;
```

---

## 4. API 実装

### 4.1 ディレクトリ構造

```
app/api/workspaces/
├── route.ts                    # GET（一覧）, POST（作成）
└── [workspaceId]/
    ├── route.ts                # GET（詳細）, PUT（更新）, DELETE
    ├── members/
    │   ├── route.ts            # GET（一覧）, POST（追加）
    │   └── [userId]/
    │       └── route.ts        # PUT（ロール変更）, DELETE（削除）
    └── data/
        └── route.ts            # GET, PUT（データ CRUD）
```

### 4.2 app/api/workspaces/route.ts

```typescript
/**
 * app/api/workspaces/route.ts
 *
 * ワークスペース一覧・作成 API
 * Phase 5: Workspace & ロール管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession, getUserById } from '@/lib/server/auth';
import { CreateWorkspaceSchema } from '@/lib/types/workspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspaces
 * ユーザーが所属するワークスペース一覧を取得
 */
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // ユーザーが所属するワークスペースを取得
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        joined_at,
        workspaces (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', session.userId);

    if (error) {
      console.error('[Workspaces API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workspaces' },
        { status: 500 }
      );
    }

    const workspaces = (data || []).map((item) => {
      const ws = Array.isArray(item.workspaces)
        ? item.workspaces[0]
        : item.workspaces;
      return {
        id: ws?.id,
        name: ws?.name,
        role: item.role,
        joinedAt: item.joined_at,
        createdAt: ws?.created_at,
        updatedAt: ws?.updated_at,
      };
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('[Workspaces API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * 新規ワークスペースを作成（作成者は OWNER）
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // ワークスペース作成
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: parsed.data.name })
      .select('id, name, created_at, updated_at')
      .single();

    if (wsError || !workspace) {
      console.error('[Workspaces API] Create error:', wsError);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // 作成者を OWNER として追加
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: session.userId,
        role: 'OWNER',
      });

    if (memberError) {
      console.error('[Workspaces API] Add owner error:', memberError);
      // ワークスペースをロールバック
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // workspace_data 初期化
    await supabase.from('workspace_data').insert({
      workspace_id: workspace.id,
      data: {},
      version: 1,
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: 'OWNER',
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Workspaces API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 app/api/workspaces/[workspaceId]/members/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/members/route.ts
 *
 * メンバー一覧・追加 API
 * Phase 5: Workspace & ロール管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { AddMemberSchema, isAdminOrAbove } from '@/lib/types/workspace';

export const dynamic = 'force-dynamic';

// 認証 + ロールチェック
async function checkAuth(
  request: NextRequest,
  workspaceId: string,
  requiredAdminOrAbove = false
) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { error: 'Database not configured', status: 500 };
  }

  // メンバーシップ確認
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  if (requiredAdminOrAbove && !isAdminOrAbove(membership.role)) {
    return { error: 'Admin permission required', status: 403 };
  }

  return { session, supabase, role: membership.role };
}

/**
 * GET /api/workspaces/[workspaceId]/members
 * メンバー一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      role,
      joined_at,
      users (
        id,
        email,
        name,
        picture
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('[Members API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }

  const members = (data || []).map((m: any) => {
    const user = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      userId: m.user_id,
      email: user?.email || '',
      name: user?.name || null,
      picture: user?.picture || null,
      role: m.role,
      joinedAt: m.joined_at,
    };
  });

  return NextResponse.json({ members });
}

/**
 * POST /api/workspaces/[workspaceId]/members
 * メンバーを追加（ADMIN 以上のみ）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId, true);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const body = await request.json();
  const parsed = AddMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ユーザーをメールで検索
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name, picture')
    .eq('email', parsed.data.email)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // 既にメンバーかチェック
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'User is already a member' },
      { status: 409 }
    );
  }

  // メンバー追加
  const { error: insertError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: parsed.data.role,
    });

  if (insertError) {
    console.error('[Members API] Insert error:', insertError);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    member: {
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: parsed.data.role,
      joinedAt: new Date().toISOString(),
    },
  }, { status: 201 });
}
```

---

## 5. Context 実装

### 5.1 lib/contexts/WorkspaceContext.tsx

```typescript
/**
 * lib/contexts/WorkspaceContext.tsx
 *
 * ワークスペースコンテキスト
 * Phase 5: Workspace & ロール管理
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/lib/types/workspace';

interface WorkspaceContextValue {
  // 現在のワークスペース
  workspace: Workspace | null;
  // ユーザーのロール
  role: WorkspaceRole | null;
  // 所属ワークスペース一覧
  workspaces: Array<Workspace & { role: WorkspaceRole }>;
  // メンバー一覧
  members: WorkspaceMember[];
  // ローディング状態
  loading: boolean;
  // エラー
  error: string | null;
  // ワークスペース切り替え
  switchWorkspace: (workspaceId: string) => Promise<void>;
  // メンバー一覧再読み込み
  reloadMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [workspaces, setWorkspaces] = useState<
    Array<Workspace & { role: WorkspaceRole }>
  >([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ワークスペース一覧取得
  const loadWorkspaces = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');

      const data = await res.json();
      setWorkspaces(data.workspaces || []);

      // 最初のワークスペースを選択
      if (data.workspaces?.length > 0) {
        const first = data.workspaces[0];
        setWorkspace({
          id: first.id,
          name: first.name,
          createdAt: first.createdAt,
          updatedAt: first.updatedAt,
        });
        setRole(first.role);
      }
    } catch (err) {
      console.error('[WorkspaceContext] Load error:', err);
      setError('ワークスペースの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // メンバー一覧取得
  const loadMembers = useCallback(async () => {
    if (!workspace) return;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');

      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('[WorkspaceContext] Load members error:', err);
    }
  }, [workspace]);

  // ワークスペース切り替え
  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setWorkspace({
          id: ws.id,
          name: ws.name,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        });
        setRole(ws.role);
      }
    },
    [workspaces]
  );

  // 初期読み込み
  useEffect(() => {
    if (!authLoading && user) {
      loadWorkspaces();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, loadWorkspaces]);

  // ワークスペース変更時にメンバー読み込み
  useEffect(() => {
    if (workspace) {
      loadMembers();
    }
  }, [workspace, loadMembers]);

  const value: WorkspaceContextValue = {
    workspace,
    role,
    workspaces,
    members,
    loading: loading || authLoading,
    error,
    switchWorkspace,
    reloadMembers: loadMembers,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
```

---

## 6. 権限チェックユーティリティ

### 6.1 lib/utils/permissions.ts

```typescript
/**
 * lib/utils/permissions.ts
 *
 * 権限チェックユーティリティ
 * Phase 5: Workspace & ロール管理
 */

import type { WorkspaceRole } from '@/lib/types/workspace';

// システムロール（SA = システム管理者）
export type SystemRole = 'SA' | 'USER' | 'TEST';

/**
 * システム管理者かどうか
 */
export function isSA(role: SystemRole | string | undefined): boolean {
  return role === 'SA';
}

/**
 * ワークスペースの OWNER かどうか
 */
export function isWorkspaceOwner(role: WorkspaceRole | null): boolean {
  return role === 'OWNER';
}

/**
 * ワークスペースの ADMIN 以上かどうか
 */
export function isWorkspaceAdmin(role: WorkspaceRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * メンバー管理が可能かどうか（ADMIN 以上）
 */
export function canManageMembers(role: WorkspaceRole | null): boolean {
  return isWorkspaceAdmin(role);
}

/**
 * 設定変更が可能かどうか（ADMIN 以上）
 */
export function canManageSettings(role: WorkspaceRole | null): boolean {
  return isWorkspaceAdmin(role);
}

/**
 * ワークスペース削除が可能かどうか（OWNER のみ）
 */
export function canDeleteWorkspace(role: WorkspaceRole | null): boolean {
  return isWorkspaceOwner(role);
}
```

---

## 7. 実装チェックリスト

### 7.1 データベース

- [ ] `workspaces` テーブル作成
- [ ] `workspace_members` テーブル作成
- [ ] `workspace_data` テーブル作成（オプション）
- [ ] RLS ポリシー設定
- [ ] インデックス作成

### 7.2 型定義

- [ ] `lib/types/workspace.ts` 作成
- [ ] Zod スキーマ定義
- [ ] 権限チェック関数

### 7.3 API

- [ ] `GET /api/workspaces` - 一覧取得
- [ ] `POST /api/workspaces` - 新規作成
- [ ] `GET /api/workspaces/[id]` - 詳細取得
- [ ] `PUT /api/workspaces/[id]` - 更新
- [ ] `DELETE /api/workspaces/[id]` - 削除
- [ ] `GET /api/workspaces/[id]/members` - メンバー一覧
- [ ] `POST /api/workspaces/[id]/members` - メンバー追加
- [ ] `PUT /api/workspaces/[id]/members/[userId]` - ロール変更
- [ ] `DELETE /api/workspaces/[id]/members/[userId]` - メンバー削除

### 7.4 Context

- [ ] `WorkspaceContext` 作成
- [ ] `useWorkspace` フック
- [ ] `WorkspaceProvider` 配置

### 7.5 権限チェック

- [ ] `lib/utils/permissions.ts` 作成
- [ ] API での権限チェック実装
- [ ] UI での権限チェック実装

### 7.6 検証

- [ ] 型チェック（`npm run type-check`）
- [ ] ビルド（`npm run build`）
- [ ] 動作確認

---

## 8. 実装順序

1. **DB マイグレーション実行**（Supabase SQL Editor）
2. **型定義作成**（`lib/types/workspace.ts`）
3. **権限ユーティリティ**（`lib/utils/permissions.ts`）
4. **API 実装**（`app/api/workspaces/`）
5. **Context 実装**（`lib/contexts/WorkspaceContext.tsx`）
6. **Provider 配置**（`app/(app)/layout.tsx`）
7. **型チェック・ビルド検証**

---

## 9. 次のフェーズ

Phase 5 完了後、以下のフェーズに進めます：

- **Phase 6**: Dashboard 実装
- **Phase 7**: Task 管理機能

---

**作成日**: 2025-12-07
**対象**: Phase 5 Workspace & ロール管理
