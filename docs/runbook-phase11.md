# Phase 11: OKR（戦略層）実装ランブック

## 目標

FDC 3層アーキテクチャの「戦略層」として、OKR（目標管理）を実装：
- Objective（目標）と Key Result（成果指標）
- Action Map との紐付け
- 全体進捗のボトムアップ計算

## 3層アーキテクチャ完成図

```
┌────────────────────────────────────────┐
│ OKR（戦略層）Phase 11                   │
│   Objective: 売上を2倍にする            │
│     └─ Key Result: MRR 100万円達成      │
└───────────────────┬────────────────────┘
                    │ 紐付け
┌───────────────────▼────────────────────┐
│ Action Map（戦術層）Phase 10            │
│   Action Map: 新機能開発                │
│     ├─ ActionItem: 設計                 │
│     └─ ActionItem: 実装                 │
└───────────────────┬────────────────────┘
                    │ 紐付け
┌───────────────────▼────────────────────┐
│ Task（実行層）Phase 9                   │
│   [♠] DB設計書作成                      │
│   [♥] コードレビュー                    │
│   [♦] バグ対応                          │
└────────────────────────────────────────┘
```

## 前提条件

- [ ] Phase 10 完了（Action Map 動作）
- [ ] action_maps テーブルにデータがある

---

## Step 1: データベーススキーマ作成

### 1.1 Supabase SQL Editor で実行

```sql
-- ========================================
-- Phase 11: OKR テーブル
-- ========================================

-- Objectives テーブル
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  period TEXT NOT NULL,  -- 'Q1 2025', '2025年度' など
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Key Results テーブル
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',  -- '%', '円', '件', '人' など
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- action_maps に key_result_id を追加
ALTER TABLE action_maps
ADD COLUMN IF NOT EXISTS key_result_id UUID REFERENCES key_results(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_objectives_workspace ON objectives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_key_results_objective ON key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_key_results_workspace ON key_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_action_maps_key_result ON action_maps(key_result_id);

-- RLS ポリシー
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

-- objectives: workspace メンバーのみ
CREATE POLICY "objectives_select" ON objectives FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "objectives_insert" ON objectives FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "objectives_update" ON objectives FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "objectives_delete" ON objectives FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- key_results: workspace メンバーのみ
CREATE POLICY "key_results_select" ON key_results FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "key_results_insert" ON key_results FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "key_results_update" ON key_results FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "key_results_delete" ON key_results FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
```

### 確認ポイント
- [ ] objectives テーブルが作成された
- [ ] key_results テーブルが作成された
- [ ] action_maps に key_result_id カラムが追加された
- [ ] RLS ポリシーが設定された

---

## Step 2: 型定義作成

### 2.1 `lib/types/okr.ts`

```typescript
/**
 * lib/types/okr.ts
 *
 * Phase 11: OKR（戦略層）型定義
 */

import { z } from 'zod';

// ========================================
// Objective（目標）
// ========================================

export interface Objective {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  period: string;  // 'Q1 2025', '2025年度' など
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progress?: number;  // KRから計算
  keyResultCount?: number;
  completedKeyResultCount?: number;
}

export const CreateObjectiveInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  period: z.string().min(1, '期間は必須です'),
});

export type CreateObjectiveInput = z.infer<typeof CreateObjectiveInputSchema>;

export const UpdateObjectiveInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  period: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateObjectiveInput = z.infer<typeof UpdateObjectiveInputSchema>;

// ========================================
// Key Result（成果指標）
// ========================================

export interface KeyResult {
  id: string;
  objectiveId: string;
  workspaceId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;  // '%', '円', '件', '人' など
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progress?: number;  // (currentValue / targetValue) × 100
  linkedActionMapCount?: number;
}

export const CreateKeyResultInputSchema = z.object({
  objectiveId: z.string().uuid(),
  title: z.string().min(1, 'タイトルは必須です'),
  targetValue: z.number().positive('目標値は正の数である必要があります'),
  currentValue: z.number().min(0).optional().default(0),
  unit: z.string().min(1, '単位は必須です'),
});

export type CreateKeyResultInput = z.infer<typeof CreateKeyResultInputSchema>;

export const UpdateKeyResultInputSchema = z.object({
  title: z.string().min(1).optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
});

export type UpdateKeyResultInput = z.infer<typeof UpdateKeyResultInputSchema>;

// ========================================
// 進捗計算ヘルパー
// ========================================

/**
 * Key Result の進捗率を計算
 */
export function calculateKeyResultProgress(
  currentValue: number,
  targetValue: number
): number {
  if (targetValue <= 0) return 0;
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.round(progress), 100);  // 100%を上限
}

/**
 * Objective の進捗率を計算（子KRの平均）
 */
export function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;

  const totalProgress = keyResults.reduce((sum, kr) => {
    const krProgress = calculateKeyResultProgress(kr.currentValue, kr.targetValue);
    return sum + krProgress;
  }, 0);

  return Math.round(totalProgress / keyResults.length);
}

// ========================================
// 期間プリセット
// ========================================

export const PERIOD_PRESETS = [
  { value: 'Q1 2025', label: 'Q1 2025（1-3月）' },
  { value: 'Q2 2025', label: 'Q2 2025（4-6月）' },
  { value: 'Q3 2025', label: 'Q3 2025（7-9月）' },
  { value: 'Q4 2025', label: 'Q4 2025（10-12月）' },
  { value: '2025年度', label: '2025年度（通年）' },
];

export const UNIT_PRESETS = [
  { value: '%', label: '%' },
  { value: '円', label: '円' },
  { value: '万円', label: '万円' },
  { value: '件', label: '件' },
  { value: '人', label: '人' },
  { value: '社', label: '社' },
  { value: 'h', label: '時間' },
];
```

### 確認ポイント
- [ ] `lib/types/okr.ts` が作成された
- [ ] Objective, KeyResult インターフェースが定義された
- [ ] 進捗計算ヘルパー関数が実装された

---

## Step 3: ActionMap 型に keyResultId 追加

### 3.1 `lib/types/action-map.ts` を更新

```typescript
// ActionMap インターフェースに追加
export interface ActionMap {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  targetPeriodStart?: string;
  targetPeriodEnd?: string;
  isArchived: boolean;
  version: number;
  keyResultId?: string;  // Phase 11: OKR連携
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progressRate?: number;
  itemCount?: number;
  completedItemCount?: number;
}

// UpdateActionMapInputSchema に追加
export const UpdateActionMapInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  targetPeriodStart: z.string().nullable().optional(),
  targetPeriodEnd: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
  version: z.number().optional(),
  keyResultId: z.string().uuid().nullable().optional(),  // Phase 11: OKR連携
});
```

### 確認ポイント
- [ ] ActionMap に keyResultId フィールドが追加された
- [ ] UpdateActionMapInputSchema に keyResultId が追加された

---

## Step 4: OKR API 実装

### 4.1 Objectives API - `app/api/workspaces/[workspaceId]/okr/objectives/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/okr/objectives/route.ts
 *
 * Phase 11: Objectives API
 * GET  - Objective一覧取得（KR進捗込み）
 * POST - Objective作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateObjectiveInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

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

  return { session, supabase };
}

// GET: Objective一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = supabase
      .from('objectives')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: objectivesData, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 各ObjectiveのKRを取得して進捗計算
    const objectives = await Promise.all(
      (objectivesData || []).map(async (obj) => {
        const { data: krs } = await supabase
          .from('key_results')
          .select('*')
          .eq('objective_id', obj.id);

        const keyResults = krs || [];
        const completedCount = keyResults.filter((kr) => {
          const progress = calculateKeyResultProgress(kr.current_value, kr.target_value);
          return progress >= 100;
        }).length;

        const totalProgress = keyResults.reduce((sum, kr) => {
          return sum + calculateKeyResultProgress(kr.current_value, kr.target_value);
        }, 0);

        const progress = keyResults.length > 0
          ? Math.round(totalProgress / keyResults.length)
          : 0;

        return {
          id: obj.id,
          workspaceId: obj.workspace_id,
          title: obj.title,
          description: obj.description,
          period: obj.period,
          isArchived: obj.is_archived,
          createdAt: obj.created_at,
          updatedAt: obj.updated_at,
          progress,
          keyResultCount: keyResults.length,
          completedKeyResultCount: completedCount,
        };
      })
    );

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('Error in GET /okr/objectives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Objective作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateObjectiveInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('objectives')
      .insert({
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        period: input.period,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const objective = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      period: data.period,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: 0,
      keyResultCount: 0,
      completedKeyResultCount: 0,
    };

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    console.error('Error in POST /okr/objectives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 Objective 個別 API - `app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/route.ts
 *
 * Phase 11: 個別Objective API
 * GET    - Objective取得（KR一覧付き）
 * PATCH  - Objective更新
 * DELETE - Objective削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateObjectiveInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string }>;
}

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

  return { session, supabase };
}

// GET: Objective取得（KR一覧付き）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data: obj, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // KR一覧取得
    const { data: krsData } = await supabase
      .from('key_results')
      .select('*')
      .eq('objective_id', objectiveId)
      .order('created_at', { ascending: true });

    const keyResults = (krsData || []).map((kr) => {
      const progress = calculateKeyResultProgress(kr.current_value, kr.target_value);
      return {
        id: kr.id,
        objectiveId: kr.objective_id,
        workspaceId: kr.workspace_id,
        title: kr.title,
        targetValue: Number(kr.target_value),
        currentValue: Number(kr.current_value),
        unit: kr.unit,
        createdAt: kr.created_at,
        updatedAt: kr.updated_at,
        progress,
      };
    });

    const completedCount = keyResults.filter((kr) => kr.progress >= 100).length;
    const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    const progress = keyResults.length > 0
      ? Math.round(totalProgress / keyResults.length)
      : 0;

    const objective = {
      id: obj.id,
      workspaceId: obj.workspace_id,
      title: obj.title,
      description: obj.description,
      period: obj.period,
      isArchived: obj.is_archived,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
      progress,
      keyResultCount: keyResults.length,
      completedKeyResultCount: completedCount,
      keyResults,
    };

    return NextResponse.json(objective);
  } catch (error) {
    console.error('Error in GET /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Objective更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateObjectiveInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.period !== undefined) updateData.period = input.period;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    const { data, error } = await supabase
      .from('objectives')
      .update(updateData)
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const objective = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      period: data.period,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(objective);
  } catch (error) {
    console.error('Error in PATCH /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Objective削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // 関連するActionMapのkey_result_idをnullに
    const { data: krs } = await supabase
      .from('key_results')
      .select('id')
      .eq('objective_id', objectiveId);

    if (krs && krs.length > 0) {
      const krIds = krs.map((kr) => kr.id);
      await supabase
        .from('action_maps')
        .update({ key_result_id: null })
        .in('key_result_id', krIds);
    }

    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objectiveId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /okr/objectives/[objectiveId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 Key Results API - `app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/route.ts
 *
 * Phase 11: Key Results API
 * GET  - KR一覧取得
 * POST - KR作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateKeyResultInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string }>;
}

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

  return { session, supabase };
}

// GET: KR一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('key_results')
      .select('*')
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keyResults = (data || []).map((kr) => {
      const progress = calculateKeyResultProgress(kr.current_value, kr.target_value);
      return {
        id: kr.id,
        objectiveId: kr.objective_id,
        workspaceId: kr.workspace_id,
        title: kr.title,
        targetValue: Number(kr.target_value),
        currentValue: Number(kr.current_value),
        unit: kr.unit,
        createdAt: kr.created_at,
        updatedAt: kr.updated_at,
        progress,
      };
    });

    return NextResponse.json(keyResults);
  } catch (error) {
    console.error('Error in GET /key-results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: KR作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateKeyResultInputSchema.safeParse({
      ...body,
      objectiveId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('key_results')
      .insert({
        objective_id: objectiveId,
        workspace_id: workspaceId,
        title: input.title,
        target_value: input.targetValue,
        current_value: input.currentValue ?? 0,
        unit: input.unit,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keyResult = {
      id: data.id,
      objectiveId: data.objective_id,
      workspaceId: data.workspace_id,
      title: data.title,
      targetValue: Number(data.target_value),
      currentValue: Number(data.current_value),
      unit: data.unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: calculateKeyResultProgress(data.current_value, data.target_value),
    };

    return NextResponse.json(keyResult, { status: 201 });
  } catch (error) {
    console.error('Error in POST /key-results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.4 Key Result 個別 API - `app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/[krId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/okr/objectives/[objectiveId]/key-results/[krId]/route.ts
 *
 * Phase 11: 個別Key Result API
 * GET    - KR取得
 * PATCH  - KR更新（現在値更新含む）
 * DELETE - KR削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateKeyResultInputSchema, calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; objectiveId: string; krId: string }>;
}

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

  return { session, supabase };
}

// GET: KR取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('key_results')
      .select('*')
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Key Result not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 紐付いたActionMap数を取得
    const { count } = await supabase
      .from('action_maps')
      .select('*', { count: 'exact', head: true })
      .eq('key_result_id', krId);

    const keyResult = {
      id: data.id,
      objectiveId: data.objective_id,
      workspaceId: data.workspace_id,
      title: data.title,
      targetValue: Number(data.target_value),
      currentValue: Number(data.current_value),
      unit: data.unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: calculateKeyResultProgress(data.current_value, data.target_value),
      linkedActionMapCount: count || 0,
    };

    return NextResponse.json(keyResult);
  } catch (error) {
    console.error('Error in GET /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: KR更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateKeyResultInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.targetValue !== undefined) updateData.target_value = input.targetValue;
    if (input.currentValue !== undefined) updateData.current_value = input.currentValue;
    if (input.unit !== undefined) updateData.unit = input.unit;

    const { data, error } = await supabase
      .from('key_results')
      .update(updateData)
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Key Result not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keyResult = {
      id: data.id,
      objectiveId: data.objective_id,
      workspaceId: data.workspace_id,
      title: data.title,
      targetValue: Number(data.target_value),
      currentValue: Number(data.current_value),
      unit: data.unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: calculateKeyResultProgress(data.current_value, data.target_value),
    };

    return NextResponse.json(keyResult);
  } catch (error) {
    console.error('Error in PATCH /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: KR削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, objectiveId, krId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // 紐付いたActionMapのkey_result_idをnullに
    await supabase
      .from('action_maps')
      .update({ key_result_id: null })
      .eq('key_result_id', krId);

    const { error } = await supabase
      .from('key_results')
      .delete()
      .eq('id', krId)
      .eq('objective_id', objectiveId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /key-results/[krId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント
- [ ] Objectives API（一覧・作成）が実装された
- [ ] Objective 個別API（取得・更新・削除）が実装された
- [ ] Key Results API（一覧・作成）が実装された
- [ ] Key Result 個別API（取得・更新・削除）が実装された

---

## Step 5: OKR Context 実装

### 5.1 `lib/contexts/OKRContext.tsx`

```typescript
/**
 * lib/contexts/OKRContext.tsx
 *
 * Phase 11: OKR コンテキスト
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
import { useWorkspace } from './WorkspaceContext';
import type {
  Objective,
  KeyResult,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  UpdateKeyResultInput,
} from '@/lib/types/okr';

interface OKRContextValue {
  // 状態
  objectives: Objective[];
  selectedObjective: (Objective & { keyResults: KeyResult[] }) | null;
  loading: boolean;
  error: string | null;

  // Objective アクション
  createObjective: (input: CreateObjectiveInput) => Promise<Objective | null>;
  updateObjective: (id: string, input: UpdateObjectiveInput) => Promise<Objective | null>;
  deleteObjective: (id: string) => Promise<void>;
  selectObjective: (id: string) => Promise<void>;
  clearSelectedObjective: () => void;
  archiveObjective: (id: string) => Promise<void>;

  // Key Result アクション
  createKeyResult: (objectiveId: string, input: { title: string; targetValue: number; unit: string }) => Promise<KeyResult | null>;
  updateKeyResult: (objectiveId: string, krId: string, input: UpdateKeyResultInput) => Promise<KeyResult | null>;
  deleteKeyResult: (objectiveId: string, krId: string) => Promise<void>;

  // リロード
  reloadObjectives: () => Promise<void>;
}

const OKRContext = createContext<OKRContextValue | null>(null);

export function OKRProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<(Objective & { keyResults: KeyResult[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // Objective一覧取得
  const fetchObjectives = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadObjectives = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchObjectives();
        setObjectives(data);
      } catch (err) {
        console.error('Error loading objectives:', err);
        setError('OKRの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadObjectives();
  }, [workspaceId, fetchObjectives]);

  // Objective選択（詳細取得）
  const selectObjective = useCallback(async (id: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSelectedObjective(data);
    } catch (err) {
      console.error('Error selecting objective:', err);
      setError('Objectiveの取得に失敗しました');
    }
  }, [workspaceId]);

  // 選択解除
  const clearSelectedObjective = useCallback(() => {
    setSelectedObjective(null);
  }, []);

  // Objective作成
  const createObjective = useCallback(async (input: CreateObjectiveInput): Promise<Objective | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newObjective = await res.json();
      setObjectives((prev) => [newObjective, ...prev]);
      return newObjective;
    } catch (err) {
      console.error('Error creating objective:', err);
      setError('Objectiveの作成に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // Objective更新
  const updateObjective = useCallback(async (id: string, input: UpdateObjectiveInput): Promise<Objective | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      return updated;
    } catch (err) {
      console.error('Error updating objective:', err);
      setError('Objectiveの更新に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // Objective削除
  const deleteObjective = useCallback(async (id: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setObjectives((prev) => prev.filter((o) => o.id !== id));
      if (selectedObjective?.id === id) {
        setSelectedObjective(null);
      }
    } catch (err) {
      console.error('Error deleting objective:', err);
      setError('Objectiveの削除に失敗しました');
    }
  }, [workspaceId, selectedObjective]);

  // Objectiveアーカイブ
  const archiveObjective = useCallback(async (id: string): Promise<void> => {
    await updateObjective(id, { isArchived: true });
  }, [updateObjective]);

  // Key Result作成
  const createKeyResult = useCallback(async (
    objectiveId: string,
    input: { title: string; targetValue: number; unit: string }
  ): Promise<KeyResult | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newKR = await res.json();

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: [...prev.keyResults, newKR],
          keyResultCount: (prev.keyResultCount || 0) + 1,
        } : null);
      }

      // Objectives一覧も更新
      setObjectives((prev) => prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResultCount: (o.keyResultCount || 0) + 1 } : o
      ));

      return newKR;
    } catch (err) {
      console.error('Error creating key result:', err);
      setError('Key Resultの作成に失敗しました');
      return null;
    }
  }, [workspaceId, selectedObjective]);

  // Key Result更新
  const updateKeyResult = useCallback(async (
    objectiveId: string,
    krId: string,
    input: UpdateKeyResultInput
  ): Promise<KeyResult | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results/${krId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: prev.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...updated } : kr)),
        } : null);
      }

      return updated;
    } catch (err) {
      console.error('Error updating key result:', err);
      setError('Key Resultの更新に失敗しました');
      return null;
    }
  }, [workspaceId, selectedObjective]);

  // Key Result削除
  const deleteKeyResult = useCallback(async (objectiveId: string, krId: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results/${krId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: prev.keyResults.filter((kr) => kr.id !== krId),
          keyResultCount: Math.max((prev.keyResultCount || 0) - 1, 0),
        } : null);
      }

      // Objectives一覧も更新
      setObjectives((prev) => prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResultCount: Math.max((o.keyResultCount || 0) - 1, 0) } : o
      ));
    } catch (err) {
      console.error('Error deleting key result:', err);
      setError('Key Resultの削除に失敗しました');
    }
  }, [workspaceId, selectedObjective]);

  // リロード
  const reloadObjectives = useCallback(async () => {
    const data = await fetchObjectives();
    setObjectives(data);
  }, [fetchObjectives]);

  return (
    <OKRContext.Provider
      value={{
        objectives,
        selectedObjective,
        loading,
        error,
        createObjective,
        updateObjective,
        deleteObjective,
        selectObjective,
        clearSelectedObjective,
        archiveObjective,
        createKeyResult,
        updateKeyResult,
        deleteKeyResult,
        reloadObjectives,
      }}
    >
      {children}
    </OKRContext.Provider>
  );
}

export function useOKR() {
  const context = useContext(OKRContext);
  if (!context) {
    throw new Error('useOKR must be used within OKRProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] `lib/contexts/OKRContext.tsx` が作成された
- [ ] Objective CRUD が実装された
- [ ] KeyResult CRUD が実装された

---

## Step 6: UI コンポーネント実装

### 6.1 コンポーネントディレクトリ作成

```bash
mkdir -p app/_components/okr
```

### 6.2 `app/_components/okr/ObjectiveCard.tsx`

```typescript
/**
 * app/_components/okr/ObjectiveCard.tsx
 *
 * Phase 11: Objectiveカードコンポーネント
 */

'use client';

import type { Objective } from '@/lib/types/okr';

interface ObjectiveCardProps {
  objective: Objective;
  onSelect: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function ObjectiveCard({ objective, onSelect, onArchive }: ObjectiveCardProps) {
  const progress = objective.progress ?? 0;
  const krCount = objective.keyResultCount ?? 0;
  const completedKRCount = objective.completedKeyResultCount ?? 0;

  return (
    <div
      onClick={() => onSelect(objective.id)}
      style={{
        padding: '16px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: 'var(--card-bg)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'inline-block',
            }}
          >
            {objective.period}
          </span>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 600 }}>
            {objective.title}
          </h3>
        </div>
        {objective.isArchived && (
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '4px',
              color: 'var(--text-light)',
            }}
          >
            アーカイブ
          </span>
        )}
      </div>

      {objective.description && (
        <p
          style={{
            margin: '8px 0',
            fontSize: '14px',
            color: 'var(--text-light)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {objective.description}
        </p>
      )}

      {/* 進捗バー */}
      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--text-light)' }}>
            KR: {completedKRCount} / {krCount} 達成
          </span>
          <span style={{ fontWeight: 600 }}>{progress}%</span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: progress >= 70 ? 'var(--success)' : progress >= 30 ? 'var(--warning)' : 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* アーカイブボタン */}
      {onArchive && !objective.isArchived && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(objective.id);
          }}
          style={{
            marginTop: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: 'var(--text-light)',
            cursor: 'pointer',
          }}
        >
          アーカイブ
        </button>
      )}
    </div>
  );
}
```

### 6.3 `app/_components/okr/KeyResultRow.tsx`

```typescript
/**
 * app/_components/okr/KeyResultRow.tsx
 *
 * Phase 11: Key Result行コンポーネント
 */

'use client';

import { useState } from 'react';
import type { KeyResult } from '@/lib/types/okr';

interface KeyResultRowProps {
  kr: KeyResult;
  onUpdate: (krId: string, updates: Partial<KeyResult>) => void;
  onDelete: (krId: string) => void;
}

export function KeyResultRow({ kr, onUpdate, onDelete }: KeyResultRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(kr.currentValue.toString());

  const progress = kr.progress ?? 0;

  const handleSave = () => {
    const newValue = parseFloat(currentValue);
    if (!isNaN(newValue) && newValue !== kr.currentValue) {
      onUpdate(kr.id, { currentValue: newValue });
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* 進捗インジケータ */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `conic-gradient(${progress >= 100 ? 'var(--success)' : 'var(--primary)'} ${progress * 3.6}deg, var(--bg-muted) 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          {progress}%
        </div>
      </div>

      {/* タイトル */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{kr.title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
          目標: {kr.targetValue.toLocaleString()} {kr.unit}
        </div>
      </div>

      {/* 現在値入力 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isEditing ? (
          <>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setCurrentValue(kr.currentValue.toString());
                  setIsEditing(false);
                }
              }}
              autoFocus
              style={{
                width: '80px',
                padding: '4px 8px',
                fontSize: '14px',
                border: '1px solid var(--primary)',
                borderRadius: '4px',
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: '14px' }}>{kr.unit}</span>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '4px 12px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 600 }}>{kr.currentValue.toLocaleString()}</span>
            <span style={{ color: 'var(--text-light)' }}>{kr.unit}</span>
          </button>
        )}
      </div>

      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(kr.id)}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          color: 'var(--danger)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        削除
      </button>
    </div>
  );
}
```

### 6.4 `app/_components/okr/ObjectiveDetail.tsx`

```typescript
/**
 * app/_components/okr/ObjectiveDetail.tsx
 *
 * Phase 11: Objective詳細ビューコンポーネント
 */

'use client';

import { useState } from 'react';
import { KeyResultRow } from './KeyResultRow';
import { UNIT_PRESETS } from '@/lib/types/okr';
import type { Objective, KeyResult } from '@/lib/types/okr';

interface ObjectiveDetailProps {
  objective: Objective & { keyResults: KeyResult[] };
  onBack: () => void;
  onUpdateKR: (krId: string, updates: Partial<KeyResult>) => Promise<void>;
  onDeleteKR: (krId: string) => Promise<void>;
  onCreateKR: (title: string, targetValue: number, unit: string) => Promise<void>;
  onUpdateObjective: (updates: Partial<Objective>) => Promise<void>;
  onDeleteObjective: () => Promise<void>;
}

export function ObjectiveDetail({
  objective,
  onBack,
  onUpdateKR,
  onDeleteKR,
  onCreateKR,
  onUpdateObjective,
  onDeleteObjective,
}: ObjectiveDetailProps) {
  const [isAddingKR, setIsAddingKR] = useState(false);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState('100');
  const [newKRUnit, setNewKRUnit] = useState('%');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(objective.title);

  const progress = objective.progress ?? 0;
  const keyResults = objective.keyResults || [];

  const handleAddKR = async () => {
    if (!newKRTitle.trim()) return;
    const target = parseFloat(newKRTarget);
    if (isNaN(target) || target <= 0) return;

    await onCreateKR(newKRTitle.trim(), target, newKRUnit);
    setNewKRTitle('');
    setNewKRTarget('100');
    setNewKRUnit('%');
    setIsAddingKR(false);
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== objective.title) {
      await onUpdateObjective({ title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← 一覧に戻る
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              {objective.period}
            </span>
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setEditTitle(objective.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  border: '1px solid var(--primary)',
                  borderRadius: '4px',
                  width: '100%',
                  maxWidth: '500px',
                  display: 'block',
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{ margin: 0, cursor: 'pointer' }}
              >
                {objective.title}
              </h1>
            )}
            {objective.description && (
              <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
                {objective.description}
              </p>
            )}
          </div>

          <button
            onClick={onDeleteObjective}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            削除
          </button>
        </div>

        {/* 全体進捗 */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            <span>Objective 進捗</span>
            <span style={{ fontWeight: 600, fontSize: '20px' }}>{progress}%</span>
          </div>
          <div
            style={{
              height: '12px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress >= 70 ? 'var(--success)' : progress >= 30 ? 'var(--warning)' : 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Key Results一覧 */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-muted)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px' }}>
            Key Results ({keyResults.length})
          </h2>
          <button
            onClick={() => setIsAddingKR(true)}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + KR追加
          </button>
        </div>

        {/* 新規追加フォーム */}
        {isAddingKR && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              value={newKRTitle}
              onChange={(e) => setNewKRTitle(e.target.value)}
              placeholder="Key Resultのタイトル"
              autoFocus
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKR();
                if (e.key === 'Escape') setIsAddingKR(false);
              }}
            />
            <input
              type="number"
              value={newKRTarget}
              onChange={(e) => setNewKRTarget(e.target.value)}
              placeholder="目標値"
              style={{
                width: '100px',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            />
            <select
              value={newKRUnit}
              onChange={(e) => setNewKRUnit(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              {UNIT_PRESETS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddKR}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              追加
            </button>
            <button
              onClick={() => setIsAddingKR(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* KR一覧 */}
        {keyResults.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-light)',
            }}
          >
            Key Resultsがありません。「+ KR追加」から追加してください。
          </div>
        ) : (
          keyResults.map((kr) => (
            <KeyResultRow
              key={kr.id}
              kr={kr}
              onUpdate={(krId, updates) => onUpdateKR(krId, updates)}
              onDelete={onDeleteKR}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

### 6.5 `app/_components/okr/ObjectiveList.tsx`

```typescript
/**
 * app/_components/okr/ObjectiveList.tsx
 *
 * Phase 11: Objective一覧コンポーネント
 */

'use client';

import { useState } from 'react';
import { ObjectiveCard } from './ObjectiveCard';
import { PERIOD_PRESETS } from '@/lib/types/okr';
import type { Objective } from '@/lib/types/okr';

interface ObjectiveListProps {
  objectives: Objective[];
  loading: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onCreate: (title: string, period: string, description?: string) => Promise<void>;
}

export function ObjectiveList({
  objectives,
  loading,
  onSelect,
  onArchive,
  onCreate,
}: ObjectiveListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState(PERIOD_PRESETS[0].value);
  const [newDescription, setNewDescription] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeObjectives = objectives.filter((o) => !o.isArchived);
  const archivedObjectives = objectives.filter((o) => o.isArchived);
  const displayObjectives = showArchived ? archivedObjectives : activeObjectives;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim(), newPeriod, newDescription.trim() || undefined);
    setNewTitle('');
    setNewPeriod(PERIOD_PRESETS[0].value);
    setNewDescription('');
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Objectives</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: !showArchived ? 'var(--primary)' : 'transparent',
                color: !showArchived ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              アクティブ ({activeObjectives.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: showArchived ? 'var(--primary)' : 'transparent',
                color: showArchived ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              アーカイブ ({archivedObjectives.length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          + 新規Objective
        </button>
      </div>

      {/* 新規作成フォーム */}
      {isCreating && (
        <div
          style={{
            padding: '16px',
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>新規Objective</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Objectiveのタイトル（必須）"
              autoFocus
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <select
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              {PERIOD_PRESETS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="説明（任意）"
              rows={2}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsCreating(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: newTitle.trim() ? 'var(--primary)' : 'var(--bg-muted)',
                  color: newTitle.trim() ? 'white' : 'var(--text-light)',
                  cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カード一覧 */}
      {displayObjectives.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-light)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
          }}
        >
          {showArchived
            ? 'アーカイブされたObjectiveはありません'
            : 'Objectiveがありません。「新規Objective」から作成してください。'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {displayObjectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onSelect={onSelect}
              onArchive={showArchived ? undefined : onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.6 `app/_components/okr/index.ts`

```typescript
/**
 * app/_components/okr/index.ts
 *
 * Phase 11: OKRコンポーネントエクスポート
 */

export { ObjectiveCard } from './ObjectiveCard';
export { KeyResultRow } from './KeyResultRow';
export { ObjectiveDetail } from './ObjectiveDetail';
export { ObjectiveList } from './ObjectiveList';
```

### 確認ポイント
- [ ] `app/_components/okr/` ディレクトリが作成された
- [ ] ObjectiveCard, KeyResultRow, ObjectiveDetail, ObjectiveList が実装された
- [ ] index.ts でエクスポートされた

---

## Step 7: OKR ページ実装

### 7.1 `app/(app)/okr/page.tsx`

```typescript
/**
 * app/(app)/okr/page.tsx
 *
 * Phase 11: OKRページ
 */

'use client';

import { OKRProvider, useOKR } from '@/lib/contexts/OKRContext';
import { ObjectiveList, ObjectiveDetail } from '@/app/_components/okr';
import type { Objective, KeyResult } from '@/lib/types/okr';

function OKRPageContent() {
  const {
    objectives,
    selectedObjective,
    loading,
    createObjective,
    updateObjective,
    deleteObjective,
    selectObjective,
    clearSelectedObjective,
    archiveObjective,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  } = useOKR();

  const handleCreateObjective = async (title: string, period: string, description?: string) => {
    await createObjective({ title, period, description });
  };

  const handleUpdateKR = async (krId: string, updates: Partial<KeyResult>) => {
    if (!selectedObjective) return;
    await updateKeyResult(selectedObjective.id, krId, updates);
  };

  const handleDeleteKR = async (krId: string) => {
    if (!selectedObjective) return;
    await deleteKeyResult(selectedObjective.id, krId);
  };

  const handleCreateKR = async (title: string, targetValue: number, unit: string) => {
    if (!selectedObjective) return;
    await createKeyResult(selectedObjective.id, { title, targetValue, unit });
  };

  const handleUpdateObjective = async (updates: Partial<Objective>) => {
    if (!selectedObjective) return;
    await updateObjective(selectedObjective.id, updates);
  };

  const handleDeleteObjective = async () => {
    if (!selectedObjective) return;
    if (!confirm('このObjectiveを削除しますか？関連するKey Resultsも削除されます。')) return;
    await deleteObjective(selectedObjective.id);
    clearSelectedObjective();
  };

  // 詳細ビュー
  if (selectedObjective) {
    return (
      <ObjectiveDetail
        objective={selectedObjective}
        onBack={clearSelectedObjective}
        onUpdateKR={handleUpdateKR}
        onDeleteKR={handleDeleteKR}
        onCreateKR={handleCreateKR}
        onUpdateObjective={handleUpdateObjective}
        onDeleteObjective={handleDeleteObjective}
      />
    );
  }

  // 一覧ビュー
  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>OKR</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
        Objectives and Key Results。目標（O）と成果指標（KR）を設定して進捗を管理します。
      </p>
      <ObjectiveList
        objectives={objectives}
        loading={loading}
        onSelect={selectObjective}
        onArchive={archiveObjective}
        onCreate={handleCreateObjective}
      />
    </div>
  );
}

export default function OKRPage() {
  return (
    <OKRProvider>
      <OKRPageContent />
    </OKRProvider>
  );
}
```

### 確認ポイント
- [ ] `app/(app)/okr/page.tsx` が作成された
- [ ] OKRProvider でラップされている

---

## Step 8: ナビゲーションに OKR 追加

### 8.1 `app/(app)/layout.tsx` を更新

```typescript
// import に追加
import {
  // ... 既存
  Target,  // OKR用アイコン
} from 'lucide-react';

// NAV_ITEMS に追加
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/okr', label: 'OKR', icon: Target },  // 追加
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/action-maps', label: 'ActionMap', icon: Map },
  { href: '/settings', label: '設定', icon: Settings },
];
```

### 確認ポイント
- [ ] ナビゲーションに「OKR」が追加された

---

## Step 9: ActionMap API に keyResultId 対応追加

### 9.1 `app/api/workspaces/[workspaceId]/action-maps/route.ts` を更新

GET レスポンスに `keyResultId` を追加:

```typescript
// マッピング部分に追加
keyResultId: m.key_result_id,
```

### 9.2 `app/api/workspaces/[workspaceId]/action-maps/[mapId]/route.ts` を更新

GET/PATCH レスポンスに `keyResultId` を追加:

```typescript
// GET マッピング部分に追加
keyResultId: data.key_result_id,

// PATCH updateData に追加
if (input.keyResultId !== undefined) updateData.key_result_id = input.keyResultId;
```

### 確認ポイント
- [ ] ActionMap API が keyResultId を返すようになった
- [ ] ActionMap 更新時に keyResultId を設定できるようになった

---

## Step 10: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] ビルドが成功する
- [ ] 型エラーがない

---

## 完了チェックリスト

### データベース
- [ ] objectives テーブルが作成された
- [ ] key_results テーブルが作成された
- [ ] action_maps に key_result_id カラムが追加された
- [ ] RLS ポリシーが設定された

### API
- [ ] Objectives API (GET/POST) が動作する
- [ ] Objective 個別 API (GET/PATCH/DELETE) が動作する
- [ ] Key Results API (GET/POST) が動作する
- [ ] Key Result 個別 API (GET/PATCH/DELETE) が動作する
- [ ] ActionMap API が keyResultId に対応した

### フロントエンド
- [ ] lib/types/okr.ts が作成された
- [ ] lib/contexts/OKRContext.tsx が作成された
- [ ] app/_components/okr/ コンポーネントが作成された
- [ ] app/(app)/okr/page.tsx が作成された
- [ ] ナビゲーションに OKR が追加された

### 動作確認
- [ ] Objective を作成できる
- [ ] Key Result を追加できる
- [ ] KR の現在値を更新すると進捗が計算される
- [ ] Objective の進捗が KR の平均で計算される
- [ ] Objective を削除すると関連 KR も削除される

### 3層アーキテクチャ
- [ ] OKR（戦略層）→ ActionMap（戦術層）→ Task（実行層）の構造が完成
- [ ] ActionMap を KR に紐付けできる（API経由）
