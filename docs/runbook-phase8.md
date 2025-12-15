# Phase 8: アプローチ履歴管理 ランブック

**作成日**: 2025-12-11
**前提**: Phase 6-7 完了（リード・クライアント管理が動作）

---

## 0. 概要

リードへのアプローチ（接触）履歴を記録・分析する機能を実装する。1対多リレーション、タイムライン表示、統計分析を学ぶ。

### 習得する概念

- **1対多リレーション**: 1つのリードに複数のアプローチ記録が紐付く
- **タイムライン**: 時系列でデータを表示するUI
- **集計クエリ**: COUNT, GROUP BY などでデータを統計化
- **PDCA**: Plan→Do→Check→Actのサイクルで改善

### 完了チェック

- [ ] approaches テーブルを作成した
- [ ] Approach 型定義を作成した
- [ ] アプローチ API を実装した
- [ ] ApproachesContext を作成した
- [ ] タイムライン表示ができる
- [ ] アプローチ統計が表示される
- [ ] リード詳細からアプローチ追加できる

---

## 1. 型定義

### Step 1.1: ファイル作成

**ファイル**: `lib/types/approach.ts`

```typescript
/**
 * lib/types/approach.ts
 *
 * Phase 8: アプローチ（接触履歴）型定義
 */

import { z } from 'zod';

// ========================================
// アプローチタイプ
// ========================================

export const ApproachTypeSchema = z.enum([
  'call',     // 電話
  'email',    // メール
  'meeting',  // ミーティング
  'visit',    // 訪問
  'other',    // その他
]);

export type ApproachType = z.infer<typeof ApproachTypeSchema>;

export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  call: '電話',
  email: 'メール',
  meeting: 'ミーティング',
  visit: '訪問',
  other: 'その他',
};

export const APPROACH_TYPE_ICONS: Record<ApproachType, string> = {
  call: 'Phone',
  email: 'Mail',
  meeting: 'Users',
  visit: 'MapPin',
  other: 'MessageSquare',
};

export const APPROACH_TYPE_COLORS: Record<ApproachType, string> = {
  call: '#4CAF50',
  email: '#2196F3',
  meeting: '#FF9800',
  visit: '#9C27B0',
  other: '#607D8B',
};

// ========================================
// アプローチ結果
// ========================================

export const ApproachResultSchema = z.enum([
  'success',    // 成功（次のステップへ進んだ）
  'pending',    // 保留（継続フォロー必要）
  'no_answer',  // 不在・無応答
  'rejected',   // 断られた
  'other',      // その他
]);

export type ApproachResult = z.infer<typeof ApproachResultSchema>;

export const APPROACH_RESULT_LABELS: Record<ApproachResult, string> = {
  success: '成功',
  pending: '保留',
  no_answer: '不在',
  rejected: '断られた',
  other: 'その他',
};

export const APPROACH_RESULT_COLORS: Record<ApproachResult, string> = {
  success: '#4CAF50',
  pending: '#FF9800',
  no_answer: '#9E9E9E',
  rejected: '#F44336',
  other: '#607D8B',
};

// ========================================
// Approach（アプローチ）型
// ========================================

export const ApproachSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  leadId: z.string().uuid(),
  userId: z.string().uuid(),
  type: ApproachTypeSchema,
  content: z.string().min(1, '内容は必須です'),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Approach = z.infer<typeof ApproachSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateApproachSchema = z.object({
  leadId: z.string().uuid(),
  type: ApproachTypeSchema,
  content: z.string().min(1, '内容は必須です'),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string().optional(), // 省略時は現在時刻
});

export type CreateApproachInput = z.infer<typeof CreateApproachSchema>;

export const UpdateApproachSchema = z.object({
  id: z.string().uuid(),
  type: ApproachTypeSchema.optional(),
  content: z.string().optional(),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string().optional(),
});

export type UpdateApproachInput = z.infer<typeof UpdateApproachSchema>;

// ========================================
// 統計用型
// ========================================

export interface ApproachStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<ApproachType, number>;
  byResult: Record<ApproachResult, number>;
  successRate: number; // 成功率 (%)
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 今週のアプローチかどうか
 */
export function isThisWeek(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

/**
 * 今月のアプローチかどうか
 */
export function isThisMonth(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * アプローチ統計を計算
 */
export function calculateApproachStats(approaches: Approach[]): ApproachStats {
  const byType: Record<ApproachType, number> = {
    call: 0,
    email: 0,
    meeting: 0,
    visit: 0,
    other: 0,
  };

  const byResult: Record<ApproachResult, number> = {
    success: 0,
    pending: 0,
    no_answer: 0,
    rejected: 0,
    other: 0,
  };

  let thisWeek = 0;
  let thisMonth = 0;

  approaches.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    if (a.result) {
      byResult[a.result] = (byResult[a.result] || 0) + 1;
    }
    if (isThisWeek(a.approachedAt)) thisWeek++;
    if (isThisMonth(a.approachedAt)) thisMonth++;
  });

  const withResult = approaches.filter((a) => a.result).length;
  const successRate = withResult > 0
    ? Math.round((byResult.success / withResult) * 100)
    : 0;

  return {
    total: approaches.length,
    thisWeek,
    thisMonth,
    byType,
    byResult,
    successRate,
  };
}
```

### 確認ポイント

- [ ] `lib/types/approach.ts` が作成された
- [ ] ApproachType, ApproachResult の enum が定義された
- [ ] 統計計算用のヘルパー関数が含まれている

---

## 2. データベース

### Step 2.1: テーブル作成 SQL

Supabase SQL エディタで実行：

```sql
-- approaches テーブル（アプローチ履歴）
CREATE TABLE IF NOT EXISTS approaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'visit', 'other')),
  content TEXT NOT NULL,
  result TEXT CHECK (result IS NULL OR result IN ('success', 'pending', 'no_answer', 'rejected', 'other')),
  result_note TEXT,
  approached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_approaches_workspace_id ON approaches(workspace_id);
CREATE INDEX idx_approaches_lead_id ON approaches(lead_id);
CREATE INDEX idx_approaches_user_id ON approaches(user_id);
CREATE INDEX idx_approaches_approached_at ON approaches(approached_at DESC);
CREATE INDEX idx_approaches_type ON approaches(type);

-- RLS ポリシー
ALTER TABLE approaches ENABLE ROW LEVEL SECURITY;

-- ワークスペースメンバーのみアクセス可能
CREATE POLICY "approaches_workspace_member_access" ON approaches
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_approaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approaches_updated_at_trigger
  BEFORE UPDATE ON approaches
  FOR EACH ROW
  EXECUTE FUNCTION update_approaches_updated_at();
```

### 確認ポイント

- [ ] Supabase で SQL を実行した
- [ ] approaches テーブルが作成された
- [ ] インデックスとRLSポリシーが設定された

---

## 3. API 実装

### Step 3.1: アプローチ一覧・作成 API

**ファイル**: `app/api/workspaces/[workspaceId]/approaches/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/approaches/route.ts
 *
 * Phase 8: Approaches API
 *
 * GET  - アプローチ一覧取得
 * POST - アプローチ作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateApproachSchema } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

/**
 * 認証 + ワークスペースアクセスチェック
 */
async function checkAuth(request: NextRequest, workspaceId: string) {
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

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return { session, supabase, role: membership.role };
}

/**
 * GET /api/workspaces/[workspaceId]/approaches
 * クエリパラメータ: leadId, type, from, to
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('approaches')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('approached_at', { ascending: false });

    // リードIDフィルター
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    // タイプフィルター
    if (type) {
      query = query.eq('type', type);
    }

    // 日付範囲フィルター
    if (from) {
      query = query.gte('approached_at', from);
    }
    if (to) {
      query = query.lte('approached_at', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Approaches API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch approaches' },
        { status: 500 }
      );
    }

    // snake_case → camelCase
    const approaches = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      leadId: row.lead_id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      result: row.result,
      resultNote: row.result_note,
      approachedAt: row.approached_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ approaches });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/approaches
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { session, supabase } = auth;

  try {
    const body = await request.json();
    const parsed = CreateApproachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // リードの存在確認
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', input.leadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('approaches')
      .insert({
        workspace_id: workspaceId,
        lead_id: input.leadId,
        user_id: session.userId,
        type: input.type,
        content: input.content,
        result: input.result,
        result_note: input.resultNote,
        approached_at: input.approachedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Approaches API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create approach' },
        { status: 500 }
      );
    }

    const approach = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      result: data.result,
      resultNote: data.result_note,
      approachedAt: data.approached_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Approaches API] Created approach:', approach.id);
    return NextResponse.json({ approach }, { status: 201 });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 3.2: 個別アプローチ API

**ファイル**: `app/api/workspaces/[workspaceId]/approaches/[approachId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/approaches/[approachId]/route.ts
 *
 * Phase 8: Approach 個別操作 API
 *
 * GET    - アプローチ詳細取得
 * PATCH  - アプローチ更新
 * DELETE - アプローチ削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateApproachSchema } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; approachId: string }>;
}

/**
 * 認証チェック
 */
async function checkAuth(request: NextRequest, workspaceId: string) {
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

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return { session, supabase, role: membership.role };
}

/**
 * GET /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('approaches')
    .select('*')
    .eq('id', approachId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Approach not found' }, { status: 404 });
  }

  const approach = {
    id: data.id,
    workspaceId: data.workspace_id,
    leadId: data.lead_id,
    userId: data.user_id,
    type: data.type,
    content: data.content,
    result: data.result,
    resultNote: data.result_note,
    approachedAt: data.approached_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ approach });
}

/**
 * PATCH /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateApproachSchema.safeParse({ ...body, id: approachId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.result !== undefined) updateData.result = input.result;
    if (input.resultNote !== undefined) updateData.result_note = input.resultNote;
    if (input.approachedAt !== undefined) updateData.approached_at = input.approachedAt;

    const { data, error } = await supabase
      .from('approaches')
      .update(updateData)
      .eq('id', approachId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Approaches API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update approach' },
        { status: 500 }
      );
    }

    const approach = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      result: data.result,
      resultNote: data.result_note,
      approachedAt: data.approached_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Approaches API] Updated approach:', approach.id);
    return NextResponse.json({ approach });
  } catch (error) {
    console.error('[Approaches API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/approaches/[approachId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, approachId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('approaches')
    .delete()
    .eq('id', approachId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Approaches API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete approach' },
      { status: 500 }
    );
  }

  console.log('[Approaches API] Deleted approach:', approachId);
  return NextResponse.json({ success: true });
}
```

### Step 3.3: 統計 API

**ファイル**: `app/api/workspaces/[workspaceId]/approaches/stats/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/approaches/stats/route.ts
 *
 * Phase 8: アプローチ統計 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { calculateApproachStats } from '@/lib/types/approach';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // ワークスペースアクセス確認
  const { data: membership, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // 全アプローチ取得
    const { data, error } = await supabase
      .from('approaches')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[Approaches Stats API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch approaches' },
        { status: 500 }
      );
    }

    // snake_case → camelCase
    const approaches = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      leadId: row.lead_id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      result: row.result,
      resultNote: row.result_note,
      approachedAt: row.approached_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const stats = calculateApproachStats(approaches);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Approaches Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] `app/api/workspaces/[workspaceId]/approaches/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/approaches/[approachId]/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/approaches/stats/route.ts` を作成した

---

## 4. Context 実装

### Step 4.1: ApproachesContext

**ファイル**: `lib/contexts/ApproachesContext.tsx`

```typescript
/**
 * lib/contexts/ApproachesContext.tsx
 *
 * Phase 8: Approaches Context
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type {
  Approach,
  CreateApproachInput,
  ApproachStats,
} from '@/lib/types/approach';
import { calculateApproachStats } from '@/lib/types/approach';

interface ApproachesContextValue {
  approaches: Approach[];
  stats: ApproachStats | null;
  loading: boolean;
  error: string | null;
  // CRUD
  addApproach: (input: CreateApproachInput) => Promise<Approach | null>;
  updateApproach: (id: string, updates: Partial<Approach>) => Promise<Approach | null>;
  deleteApproach: (id: string) => Promise<void>;
  // フィルター
  getApproachesByLead: (leadId: string) => Approach[];
  // 再読み込み
  reloadApproaches: () => Promise<void>;
  reloadStats: () => Promise<void>;
}

const ApproachesContext = createContext<ApproachesContextValue | null>(null);

export function ApproachesProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [stats, setStats] = useState<ApproachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アプローチ一覧取得
  const loadApproaches = useCallback(async () => {
    if (!workspace) {
      setApproaches([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspace.id}/approaches`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch approaches');
      }

      const data = await res.json();
      setApproaches(data.approaches || []);
    } catch (err) {
      console.error('[ApproachesContext] Load error:', err);
      setError('アプローチの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // 統計取得
  const loadStats = useCallback(async () => {
    if (!workspace) {
      setStats(null);
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/approaches/stats`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('[ApproachesContext] Stats error:', err);
    }
  }, [workspace]);

  // ワークスペース変更時に読み込み
  useEffect(() => {
    loadApproaches();
    loadStats();
  }, [loadApproaches, loadStats]);

  // アプローチ追加
  const addApproach = useCallback(
    async (input: CreateApproachInput): Promise<Approach | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/approaches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create approach');
        }

        const data = await res.json();
        setApproaches((prev) => [data.approach, ...prev]);

        // 統計を更新
        setStats(calculateApproachStats([data.approach, ...approaches]));

        return data.approach;
      } catch (err) {
        console.error('[ApproachesContext] Add error:', err);
        setError('アプローチの追加に失敗しました');
        return null;
      }
    },
    [workspace, approaches]
  );

  // アプローチ更新
  const updateApproach = useCallback(
    async (id: string, updates: Partial<Approach>): Promise<Approach | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/approaches/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
          }
        );

        if (!res.ok) {
          throw new Error('Failed to update approach');
        }

        const data = await res.json();
        const newApproaches = approaches.map((a) =>
          a.id === id ? data.approach : a
        );
        setApproaches(newApproaches);
        setStats(calculateApproachStats(newApproaches));

        return data.approach;
      } catch (err) {
        console.error('[ApproachesContext] Update error:', err);
        setError('アプローチの更新に失敗しました');
        return null;
      }
    },
    [workspace, approaches]
  );

  // アプローチ削除
  const deleteApproach = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/approaches/${id}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!res.ok) {
          throw new Error('Failed to delete approach');
        }

        const newApproaches = approaches.filter((a) => a.id !== id);
        setApproaches(newApproaches);
        setStats(calculateApproachStats(newApproaches));
      } catch (err) {
        console.error('[ApproachesContext] Delete error:', err);
        setError('アプローチの削除に失敗しました');
      }
    },
    [workspace, approaches]
  );

  // リード別アプローチ取得
  const getApproachesByLead = useCallback(
    (leadId: string): Approach[] => {
      return approaches.filter((a) => a.leadId === leadId);
    },
    [approaches]
  );

  const value: ApproachesContextValue = useMemo(
    () => ({
      approaches,
      stats,
      loading,
      error,
      addApproach,
      updateApproach,
      deleteApproach,
      getApproachesByLead,
      reloadApproaches: loadApproaches,
      reloadStats: loadStats,
    }),
    [
      approaches,
      stats,
      loading,
      error,
      addApproach,
      updateApproach,
      deleteApproach,
      getApproachesByLead,
      loadApproaches,
      loadStats,
    ]
  );

  return (
    <ApproachesContext.Provider value={value}>
      {children}
    </ApproachesContext.Provider>
  );
}

export function useApproaches(): ApproachesContextValue {
  const context = useContext(ApproachesContext);
  if (!context) {
    throw new Error('useApproaches must be used within ApproachesProvider');
  }
  return context;
}
```

### 確認ポイント

- [ ] `lib/contexts/ApproachesContext.tsx` を作成した
- [ ] useApproaches フックが使用できる

---

## 5. UI コンポーネント

### Step 5.1: ディレクトリ作成

```bash
mkdir -p app/_components/approaches
```

### Step 5.2: index.ts

**ファイル**: `app/_components/approaches/index.ts`

```typescript
/**
 * app/_components/approaches/index.ts
 *
 * Phase 8: Approaches コンポーネント re-export
 */

export { ApproachTimeline } from './ApproachTimeline';
export { AddApproachForm } from './AddApproachForm';
export { ApproachStatsCard } from './ApproachStatsCard';
```

### Step 5.3: タイムライン表示

**ファイル**: `app/_components/approaches/ApproachTimeline.tsx`

```typescript
/**
 * app/_components/approaches/ApproachTimeline.tsx
 *
 * Phase 8: アプローチタイムライン
 */

'use client';

import { Phone, Mail, Users, MapPin, MessageSquare } from 'lucide-react';
import type { Approach } from '@/lib/types/approach';
import {
  APPROACH_TYPE_LABELS,
  APPROACH_TYPE_COLORS,
  APPROACH_RESULT_LABELS,
  APPROACH_RESULT_COLORS,
} from '@/lib/types/approach';

interface ApproachTimelineProps {
  approaches: Approach[];
  onDelete?: (id: string) => void;
}

const IconMap = {
  call: Phone,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  other: MessageSquare,
};

export function ApproachTimeline({ approaches, onDelete }: ApproachTimelineProps) {
  if (approaches.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-light)',
        }}
      >
        アプローチ履歴がありません
      </div>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* タイムラインの線 */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'var(--border)',
        }}
      />

      {approaches.map((approach, index) => {
        const Icon = IconMap[approach.type];
        const color = APPROACH_TYPE_COLORS[approach.type];

        return (
          <div
            key={approach.id}
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: index < approaches.length - 1 ? '20px' : 0,
              position: 'relative',
            }}
          >
            {/* アイコン */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: color + '20',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              <Icon size={18} color={color} />
            </div>

            {/* コンテンツ */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, marginRight: '8px' }}>
                    {APPROACH_TYPE_LABELS[approach.type]}
                  </span>
                  {approach.result && (
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: APPROACH_RESULT_COLORS[approach.result] + '20',
                        color: APPROACH_RESULT_COLORS[approach.result],
                      }}
                    >
                      {APPROACH_RESULT_LABELS[approach.result]}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  {formatDate(approach.approachedAt)}
                </span>
              </div>

              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text)',
                  background: 'var(--bg-gray)',
                  padding: '10px',
                  borderRadius: '8px',
                }}
              >
                {approach.content}
                {approach.resultNote && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text-light)',
                    }}
                  >
                    結果メモ: {approach.resultNote}
                  </div>
                )}
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(approach.id)}
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-light)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Step 5.4: アプローチ追加フォーム

**ファイル**: `app/_components/approaches/AddApproachForm.tsx`

```typescript
/**
 * app/_components/approaches/AddApproachForm.tsx
 *
 * Phase 8: アプローチ追加フォーム
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ApproachType, ApproachResult, CreateApproachInput } from '@/lib/types/approach';
import { APPROACH_TYPE_LABELS, APPROACH_RESULT_LABELS } from '@/lib/types/approach';

interface AddApproachFormProps {
  leadId: string;
  onAdd: (input: CreateApproachInput) => Promise<void>;
  onClose: () => void;
}

export function AddApproachForm({ leadId, onAdd, onClose }: AddApproachFormProps) {
  const [type, setType] = useState<ApproachType>('call');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ApproachResult | ''>('');
  const [resultNote, setResultNote] = useState('');
  const [approachedAt, setApproachedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('内容は必須です');
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        leadId,
        type,
        content: content.trim(),
        result: result || undefined,
        resultNote: resultNote.trim() || undefined,
        approachedAt: new Date(approachedAt).toISOString(),
      });
      onClose();
    } catch {
      setError('追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h4 style={{ margin: 0 }}>アプローチ記録</h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: '#FFEBEE',
            color: '#C62828',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-light)',
                marginBottom: '4px',
              }}
            >
              タイプ *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ApproachType)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {Object.entries(APPROACH_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-light)',
                marginBottom: '4px',
              }}
            >
              日時
            </label>
            <input
              type="datetime-local"
              value={approachedAt}
              onChange={(e) => setApproachedAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-light)',
                marginBottom: '4px',
              }}
            >
              結果
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as ApproachResult | '')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">未選択</option>
              {Object.entries(APPROACH_RESULT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--text-light)',
              marginBottom: '4px',
            }}
          >
            内容 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="アプローチの内容を記録..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
            required
          />
        </div>

        {result && (
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-light)',
                marginBottom: '4px',
              }}
            >
              結果メモ
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              rows={2}
              placeholder="結果の詳細..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={onClose}
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={saving}
          >
            {saving ? '記録中...' : '記録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 5.5: 統計カード

**ファイル**: `app/_components/approaches/ApproachStatsCard.tsx`

```typescript
/**
 * app/_components/approaches/ApproachStatsCard.tsx
 *
 * Phase 8: アプローチ統計カード
 */

'use client';

import { Phone, Mail, Users, MapPin, TrendingUp, Calendar, Target } from 'lucide-react';
import type { ApproachStats } from '@/lib/types/approach';
import { APPROACH_TYPE_LABELS, APPROACH_TYPE_COLORS } from '@/lib/types/approach';

interface ApproachStatsCardProps {
  stats: ApproachStats;
}

export function ApproachStatsCard({ stats }: ApproachStatsCardProps) {
  const IconMap = {
    call: Phone,
    email: Mail,
    meeting: Users,
    visit: MapPin,
    other: Target,
  };

  return (
    <div className="card">
      <h3
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <TrendingUp size={20} />
        アプローチ統計
      </h3>

      {/* サマリー */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-gray)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>総件数</div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#E3F2FD',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1976D2' }}>
            {stats.thisWeek}
          </div>
          <div style={{ fontSize: '12px', color: '#1976D2' }}>今週</div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#E8F5E9',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#388E3C' }}>
            {stats.thisMonth}
          </div>
          <div style={{ fontSize: '12px', color: '#388E3C' }}>今月</div>
        </div>
        <div
          style={{
            padding: '12px',
            background: '#FFF3E0',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F57C00' }}>
            {stats.successRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#F57C00' }}>成功率</div>
        </div>
      </div>

      {/* タイプ別 */}
      <div style={{ marginBottom: '16px' }}>
        <h4
          style={{
            fontSize: '14px',
            color: 'var(--text-light)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Calendar size={14} />
          タイプ別件数
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(stats.byType).map(([type, count]) => {
            const Icon = IconMap[type as keyof typeof IconMap];
            const color = APPROACH_TYPE_COLORS[type as keyof typeof APPROACH_TYPE_COLORS];
            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: color + '15',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}
              >
                <Icon size={14} color={color} />
                <span>{APPROACH_TYPE_LABELS[type as keyof typeof APPROACH_TYPE_LABELS]}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 結果別バー */}
      {stats.total > 0 && (
        <div>
          <h4
            style={{
              fontSize: '14px',
              color: 'var(--text-light)',
              marginBottom: '8px',
            }}
          >
            結果内訳
          </h4>
          <div
            style={{
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {stats.byResult.success > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.success / stats.total) * 100}%`,
                  background: '#4CAF50',
                }}
                title={`成功: ${stats.byResult.success}`}
              />
            )}
            {stats.byResult.pending > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.pending / stats.total) * 100}%`,
                  background: '#FF9800',
                }}
                title={`保留: ${stats.byResult.pending}`}
              />
            )}
            {stats.byResult.no_answer > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.no_answer / stats.total) * 100}%`,
                  background: '#9E9E9E',
                }}
                title={`不在: ${stats.byResult.no_answer}`}
              />
            )}
            {stats.byResult.rejected > 0 && (
              <div
                style={{
                  width: `${(stats.byResult.rejected / stats.total) * 100}%`,
                  background: '#F44336',
                }}
                title={`断り: ${stats.byResult.rejected}`}
              />
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#4CAF50' }}>成功 {stats.byResult.success}</span>
            <span style={{ color: '#FF9800' }}>保留 {stats.byResult.pending}</span>
            <span style={{ color: '#9E9E9E' }}>不在 {stats.byResult.no_answer}</span>
            <span style={{ color: '#F44336' }}>断り {stats.byResult.rejected}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 確認ポイント

- [ ] `app/_components/approaches/` ディレクトリを作成した
- [ ] `index.ts`, `ApproachTimeline.tsx`, `AddApproachForm.tsx`, `ApproachStatsCard.tsx` を作成した

---

## 6. ダッシュボード統合

### Step 6.1: ダッシュボードに統計表示

**ファイル**: `app/(app)/dashboard/page.tsx` を更新

リード統計セクションの下にアプローチ統計を追加:

```typescript
// ApproachesProvider と useApproaches をインポート
import { ApproachesProvider, useApproaches } from '@/lib/contexts/ApproachesContext';
import { ApproachStatsCard } from '@/app/_components/approaches';

// ダッシュボードコンテンツ内で使用
function DashboardContent() {
  const { stats } = useApproaches();

  return (
    <div>
      {/* 既存のコンテンツ */}

      {/* アプローチ統計 */}
      {stats && <ApproachStatsCard stats={stats} />}
    </div>
  );
}
```

### 確認ポイント

- [ ] ダッシュボードにアプローチ統計が表示される

---

## 7. リード詳細にアプローチ機能追加

### Step 7.1: リードカードにアプローチボタン追加

リードの `ListView` または `KanbanColumn` にアプローチ追加ボタンとタイムライン表示を追加する。

**方針**: リードカード展開時にアプローチ履歴とアプローチ追加ボタンを表示

```typescript
// app/_components/leads/LeadCard.tsx または ListView.tsx 内

import { useState } from 'react';
import { useApproaches } from '@/lib/contexts/ApproachesContext';
import { ApproachTimeline, AddApproachForm } from '@/app/_components/approaches';

function LeadCard({ lead }) {
  const [showApproachForm, setShowApproachForm] = useState(false);
  const { getApproachesByLead, addApproach, deleteApproach } = useApproaches();

  const leadApproaches = getApproachesByLead(lead.id);

  return (
    <div>
      {/* 既存のリードカード内容 */}

      {/* アプローチセクション */}
      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ margin: 0 }}>アプローチ履歴 ({leadApproaches.length})</h4>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowApproachForm(true)}
          >
            アプローチ記録
          </button>
        </div>

        {showApproachForm && (
          <AddApproachForm
            leadId={lead.id}
            onAdd={async (input) => {
              await addApproach(input);
            }}
            onClose={() => setShowApproachForm(false)}
          />
        )}

        <ApproachTimeline
          approaches={leadApproaches}
          onDelete={deleteApproach}
        />
      </div>
    </div>
  );
}
```

### 確認ポイント

- [ ] リードカードからアプローチを追加できる
- [ ] リード別のアプローチ履歴が表示される

---

## 8. ビルド・テスト

### Step 8.1: ビルド確認

```bash
npm run build
```

### Step 8.2: 開発サーバー起動

```bash
npm run dev
```

### Step 8.3: API テスト（ブラウザコンソール）

```javascript
// ワークスペースID取得
const wsRes = await fetch('/api/workspaces');
const wsData = await wsRes.json();
const workspaceId = wsData.workspaces[0].id;

// リードID取得
const leadsRes = await fetch(`/api/workspaces/${workspaceId}/leads`);
const leadsData = await leadsRes.json();
const leadId = leadsData.leads[0].id;

// アプローチ追加
const addRes = await fetch(`/api/workspaces/${workspaceId}/approaches`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: leadId,
    type: 'call',
    content: '初回電話連絡',
    result: 'success',
    resultNote: '好感触、来週MTG予定'
  })
});
const addData = await addRes.json();
console.log('Created:', addData);

// アプローチ一覧
const listRes = await fetch(`/api/workspaces/${workspaceId}/approaches`);
const listData = await listRes.json();
console.log('Approaches:', listData);

// 統計取得
const statsRes = await fetch(`/api/workspaces/${workspaceId}/approaches/stats`);
const statsData = await statsRes.json();
console.log('Stats:', statsData);
```

---

## 9. 実装手順まとめ

| Step | 内容 | ファイル |
|------|------|----------|
| 1 | 型定義 | `lib/types/approach.ts` |
| 2 | DB テーブル | Supabase SQL |
| 3 | API 実装 | `app/api/workspaces/[workspaceId]/approaches/` |
| 4 | Context | `lib/contexts/ApproachesContext.tsx` |
| 5 | UI コンポーネント | `app/_components/approaches/` |
| 6 | ダッシュボード統合 | `app/(app)/dashboard/page.tsx` |
| 7 | リード詳細統合 | リードカードの更新 |
| 8 | ビルド・テスト | `npm run build` |

---

## 10. 完了チェックリスト

- [ ] `lib/types/approach.ts` を作成した
- [ ] Supabase で approaches テーブルを作成した
- [ ] アプローチ API（CRUD + 統計）を実装した
- [ ] `ApproachesContext` を作成した
- [ ] `ApproachTimeline` コンポーネントを作成した
- [ ] `AddApproachForm` コンポーネントを作成した
- [ ] `ApproachStatsCard` コンポーネントを作成した
- [ ] リードからアプローチを追加できる
- [ ] タイムライン表示ができる
- [ ] 統計（今週・今月・タイプ別・成功率）が表示される
- [ ] ビルドが成功する

---

## 11. 参照ファイル

- `lib/types/lead.ts` - リード型定義（参考）
- `lib/contexts/LeadsContext.tsx` - Context 実装パターン
- `app/_components/leads/` - UI コンポーネントパターン

---

## 12. 次のステップ（オプション）

1. **リマインダー連携** - アプローチ後のフォローアップリマインダー
2. **グラフ表示** - Chart.js 等で統計をグラフ化
3. **CSVエクスポート** - アプローチ履歴のエクスポート
4. **アプローチテンプレート** - よく使う内容のテンプレート化
