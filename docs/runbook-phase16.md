# Phase 16: Lean Canvas（リーンキャンバス）

## このPhaseの目標

Lean Canvas（リーンキャンバス）の9ブロックを実装：
- 9ブロックのグリッドレイアウト
- 各ブロックの編集機能
- ブランドとの連携
- カスタマージャーニー可視化

## 習得する新しい概念

- **Lean Canvas**: スタートアップ向けビジネスモデル設計ツール
- **9ブロック**: 課題、顧客セグメント、独自の価値提案など9項目
- **CSS Grid**: 複雑なグリッドレイアウトを効率的に実装
- **カスタマージャーニー**: 顧客体験の流れを可視化

## 9ブロックの構成

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ 課題    │ 解決策  │ 独自の  │ 圧倒的  │ 顧客    │
│         │         │ 価値    │ 優位性  │ セグ    │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ 主要    │         │         │         │ チャ    │
│ 指標    │         │         │         │ ネル    │
├─────────┴─────────┴─────────┴─────────┴─────────┤
│ コスト構造                │ 収益の流れ              │
└──────────────────────────┴────────────────────────┘
```

## 前提条件

- [ ] Phase 15 完了（Brand Strategy 動作）
- [ ] Supabase + 認証が動作
- [ ] ワークスペース機能が動作

---

## Step 1: Supabase テーブル作成

Supabase ダッシュボードの SQL Editor で実行：

```sql
-- ========================================
-- lean_canvas テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS lean_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Lean Canvas',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_lean_canvas_brand ON lean_canvas(brand_id);

-- ========================================
-- lean_canvas_blocks テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS lean_canvas_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES lean_canvas(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'problem', 'solution', 'unique_value',
    'unfair_advantage', 'customer_segments',
    'key_metrics', 'channels',
    'cost_structure', 'revenue_streams'
  )),
  content JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(canvas_id, block_type)
);

-- インデックス
CREATE INDEX idx_lean_canvas_blocks_canvas ON lean_canvas_blocks(canvas_id);

-- ========================================
-- RLS ポリシー
-- ========================================

-- lean_canvas テーブル
ALTER TABLE lean_canvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lean_canvas_select" ON lean_canvas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = lean_canvas.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_insert" ON lean_canvas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = lean_canvas.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_update" ON lean_canvas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = lean_canvas.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_delete" ON lean_canvas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = lean_canvas.brand_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- lean_canvas_blocks テーブル
ALTER TABLE lean_canvas_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lean_canvas_blocks_select" ON lean_canvas_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lean_canvas lc
      JOIN brands b ON b.id = lc.brand_id
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE lc.id = lean_canvas_blocks.canvas_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_blocks_insert" ON lean_canvas_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lean_canvas lc
      JOIN brands b ON b.id = lc.brand_id
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE lc.id = lean_canvas_blocks.canvas_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_blocks_update" ON lean_canvas_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lean_canvas lc
      JOIN brands b ON b.id = lc.brand_id
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE lc.id = lean_canvas_blocks.canvas_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "lean_canvas_blocks_delete" ON lean_canvas_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lean_canvas lc
      JOIN brands b ON b.id = lc.brand_id
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE lc.id = lean_canvas_blocks.canvas_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- ========================================
-- updated_at 自動更新トリガー
-- ========================================
CREATE TRIGGER update_lean_canvas_updated_at
  BEFORE UPDATE ON lean_canvas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lean_canvas_blocks_updated_at
  BEFORE UPDATE ON lean_canvas_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 確認ポイント
- [ ] lean_canvas テーブルが作成された
- [ ] lean_canvas_blocks テーブルが作成された
- [ ] RLS ポリシーが有効になった
- [ ] インデックスが作成された

---

## Step 2: 型定義

### ファイル: `lib/types/lean-canvas.ts`

```typescript
/**
 * lib/types/lean-canvas.ts
 *
 * Phase 16: Lean Canvas の型定義
 */

/**
 * 9ブロックの種類
 */
export type LeanCanvasBlockType =
  | 'problem'           // 課題
  | 'solution'          // 解決策
  | 'unique_value'      // 独自の価値提案
  | 'unfair_advantage'  // 圧倒的な優位性
  | 'customer_segments' // 顧客セグメント
  | 'key_metrics'       // 主要指標
  | 'channels'          // チャネル
  | 'cost_structure'    // コスト構造
  | 'revenue_streams';  // 収益の流れ

/**
 * ブロックのラベル定義
 */
export const LEAN_CANVAS_BLOCK_LABELS: Record<LeanCanvasBlockType, {
  label: string;
  description: string;
  color: string;
}> = {
  problem: {
    label: '課題',
    description: '顧客が抱える上位3つの課題',
    color: '#ef4444',
  },
  solution: {
    label: '解決策',
    description: '各課題に対する解決策',
    color: '#22c55e',
  },
  unique_value: {
    label: '独自の価値提案',
    description: '明確で説得力のある差別化メッセージ',
    color: '#3b82f6',
  },
  unfair_advantage: {
    label: '圧倒的な優位性',
    description: '簡単にコピーできない競争優位',
    color: '#8b5cf6',
  },
  customer_segments: {
    label: '顧客セグメント',
    description: 'ターゲット顧客',
    color: '#f59e0b',
  },
  key_metrics: {
    label: '主要指標',
    description: '測定すべき主要な活動指標',
    color: '#06b6d4',
  },
  channels: {
    label: 'チャネル',
    description: '顧客への到達経路',
    color: '#ec4899',
  },
  cost_structure: {
    label: 'コスト構造',
    description: '顧客獲得コスト、配信コスト等',
    color: '#64748b',
  },
  revenue_streams: {
    label: '収益の流れ',
    description: '収益モデル、生涯価値等',
    color: '#10b981',
  },
};

/**
 * ブロックの表示順序とグリッド配置
 */
export const LEAN_CANVAS_LAYOUT: {
  blockType: LeanCanvasBlockType;
  gridColumn: string;
  gridRow: string;
}[] = [
  { blockType: 'problem', gridColumn: '1', gridRow: '1 / 3' },
  { blockType: 'solution', gridColumn: '2', gridRow: '1' },
  { blockType: 'key_metrics', gridColumn: '2', gridRow: '2' },
  { blockType: 'unique_value', gridColumn: '3', gridRow: '1 / 3' },
  { blockType: 'unfair_advantage', gridColumn: '4', gridRow: '1' },
  { blockType: 'channels', gridColumn: '4', gridRow: '2' },
  { blockType: 'customer_segments', gridColumn: '5', gridRow: '1 / 3' },
  { blockType: 'cost_structure', gridColumn: '1 / 3', gridRow: '3' },
  { blockType: 'revenue_streams', gridColumn: '3 / 6', gridRow: '3' },
];

/**
 * Lean Canvas
 */
export interface LeanCanvas {
  id: string;
  brandId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lean Canvas ブロック
 */
export interface LeanCanvasBlock {
  id: string;
  canvasId: string;
  blockType: LeanCanvasBlockType;
  content: string[];  // 複数の箇条書き
  createdAt: string;
  updatedAt: string;
}

/**
 * Lean Canvas と全ブロックを含む
 */
export interface LeanCanvasWithBlocks extends LeanCanvas {
  blocks: LeanCanvasBlock[];
}

/**
 * ブロック更新リクエスト
 */
export interface UpdateLeanCanvasBlockRequest {
  blockType: LeanCanvasBlockType;
  content: string[];
}

/**
 * カスタマージャーニーステップ
 */
export interface CustomerJourneyStep {
  stage: string;
  touchpoint: string;
  emotion: 'positive' | 'neutral' | 'negative';
  action: string;
}
```

### 確認ポイント
- [ ] `lib/types/lean-canvas.ts` を作成した
- [ ] 9ブロックの型が定義された
- [ ] グリッドレイアウト設定が含まれている

---

## Step 3: Context 作成

### ファイル: `lib/contexts/LeanCanvasContext.tsx`

```typescript
/**
 * lib/contexts/LeanCanvasContext.tsx
 *
 * Phase 16: Lean Canvas の状態管理
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
import {
  LeanCanvas,
  LeanCanvasBlock,
  LeanCanvasWithBlocks,
  LeanCanvasBlockType,
} from '@/lib/types/lean-canvas';

interface LeanCanvasContextType {
  canvasList: LeanCanvas[];
  currentCanvas: LeanCanvasWithBlocks | null;
  loading: boolean;
  error: string | null;

  // キャンバス操作
  fetchCanvasList: (brandId: string) => Promise<void>;
  selectCanvas: (canvasId: string) => Promise<void>;
  createCanvas: (brandId: string, name?: string) => Promise<LeanCanvas | null>;
  deleteCanvas: (canvasId: string) => Promise<boolean>;

  // ブロック操作
  updateBlock: (blockType: LeanCanvasBlockType, content: string[]) => Promise<boolean>;
  getBlockContent: (blockType: LeanCanvasBlockType) => string[];
}

const LeanCanvasContext = createContext<LeanCanvasContextType | undefined>(undefined);

export function LeanCanvasProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [canvasList, setCanvasList] = useState<LeanCanvas[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<LeanCanvasWithBlocks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // キャンバスを選択（ブロック含む）
  const selectCanvas = useCallback(async (canvasId: string) => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas/${canvasId}`);
      if (!res.ok) throw new Error('Failed to fetch canvas');

      const data = await res.json();
      setCurrentCanvas(data.canvas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ブランドのキャンバス一覧を取得
  const fetchCanvasList = useCallback(async (brandId: string) => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas?brandId=${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch canvas list');

      const data = await res.json();
      setCanvasList(data.canvasList || []);

      // 最初のキャンバスを自動選択
      if (data.canvasList?.length > 0) {
        await selectCanvas(data.canvasList[0].id);
      } else {
        setCurrentCanvas(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace, selectCanvas]);

  // キャンバスを作成
  const createCanvas = useCallback(async (
    brandId: string,
    name?: string
  ): Promise<LeanCanvas | null> => {
    if (!workspace) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, name }),
      });

      if (!res.ok) throw new Error('Failed to create canvas');

      const data = await res.json();
      setCanvasList(prev => [...prev, data.canvas]);
      await selectCanvas(data.canvas.id);

      return data.canvas;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspace, selectCanvas]);

  // キャンバスを削除
  const deleteCanvas = useCallback(async (canvasId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas/${canvasId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete canvas');

      setCanvasList(prev => prev.filter(c => c.id !== canvasId));

      if (currentCanvas?.id === canvasId) {
        setCurrentCanvas(null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentCanvas]);

  // ブロックを更新
  const updateBlock = useCallback(async (
    blockType: LeanCanvasBlockType,
    content: string[]
  ): Promise<boolean> => {
    if (!workspace || !currentCanvas) return false;

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/lean-canvas/${currentCanvas.id}/blocks`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockType, content }),
        }
      );

      if (!res.ok) throw new Error('Failed to update block');

      const data = await res.json();

      // 現在のキャンバスのブロックを更新
      setCurrentCanvas(prev => {
        if (!prev) return null;

        const existingIndex = prev.blocks.findIndex(b => b.blockType === blockType);
        const newBlocks = [...prev.blocks];

        if (existingIndex >= 0) {
          newBlocks[existingIndex] = data.block;
        } else {
          newBlocks.push(data.block);
        }

        return { ...prev, blocks: newBlocks };
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentCanvas]);

  // ブロックの内容を取得
  const getBlockContent = useCallback((blockType: LeanCanvasBlockType): string[] => {
    if (!currentCanvas) return [];
    const block = currentCanvas.blocks.find(b => b.blockType === blockType);
    return block?.content || [];
  }, [currentCanvas]);

  return (
    <LeanCanvasContext.Provider
      value={{
        canvasList,
        currentCanvas,
        loading,
        error,
        fetchCanvasList,
        selectCanvas,
        createCanvas,
        deleteCanvas,
        updateBlock,
        getBlockContent,
      }}
    >
      {children}
    </LeanCanvasContext.Provider>
  );
}

export function useLeanCanvas() {
  const context = useContext(LeanCanvasContext);
  if (context === undefined) {
    throw new Error('useLeanCanvas must be used within a LeanCanvasProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] `lib/contexts/LeanCanvasContext.tsx` を作成した
- [ ] CRUD 操作が実装されている
- [ ] ブロック更新機能がある

---

## Step 4: API エンドポイント作成

### ファイル: `app/api/workspaces/[workspaceId]/lean-canvas/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/lean-canvas/route.ts
 *
 * Phase 16: Lean Canvas 一覧・作成 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string }> };

// キャンバス一覧取得（brandIdでフィルタ）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lean_canvas')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch canvas list:', error);
      return NextResponse.json({ error: 'Failed to fetch canvas list' }, { status: 500 });
    }

    const canvasList = (data || []).map((item: any) => ({
      id: item.id,
      brandId: item.brand_id,
      name: item.name,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ canvasList });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/lean-canvas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// キャンバス作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, name } = body;

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    // キャンバスを作成
    const { data: canvas, error: canvasError } = await supabase
      .from('lean_canvas')
      .insert({
        brand_id: brandId,
        name: name || 'Lean Canvas',
        created_by: session.userId,
      })
      .select()
      .single();

    if (canvasError) {
      console.error('Failed to create canvas:', canvasError);
      return NextResponse.json({ error: 'Failed to create canvas' }, { status: 500 });
    }

    // 9ブロックの初期データを作成
    const blockTypes = [
      'problem', 'solution', 'unique_value', 'unfair_advantage',
      'customer_segments', 'key_metrics', 'channels',
      'cost_structure', 'revenue_streams'
    ];

    const blocksToInsert = blockTypes.map(blockType => ({
      canvas_id: canvas.id,
      block_type: blockType,
      content: [],
    }));

    const { error: blocksError } = await supabase
      .from('lean_canvas_blocks')
      .insert(blocksToInsert);

    if (blocksError) {
      console.error('Failed to create initial blocks:', blocksError);
    }

    return NextResponse.json({
      canvas: {
        id: canvas.id,
        brandId: canvas.brand_id,
        name: canvas.name,
        createdBy: canvas.created_by,
        createdAt: canvas.created_at,
        updatedAt: canvas.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workspaces/[workspaceId]/lean-canvas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### ファイル: `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/route.ts
 *
 * Phase 16: Lean Canvas 詳細・削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; canvasId: string }> };

// キャンバス詳細取得（ブロック含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // キャンバスを取得
    const { data: canvas, error: canvasError } = await supabase
      .from('lean_canvas')
      .select('*')
      .eq('id', canvasId)
      .single();

    if (canvasError || !canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // ブロックを取得
    const { data: blocks, error: blocksError } = await supabase
      .from('lean_canvas_blocks')
      .select('*')
      .eq('canvas_id', canvasId);

    if (blocksError) {
      console.error('Failed to fetch blocks:', blocksError);
    }

    return NextResponse.json({
      canvas: {
        id: canvas.id,
        brandId: canvas.brand_id,
        name: canvas.name,
        createdBy: canvas.created_by,
        createdAt: canvas.created_at,
        updatedAt: canvas.updated_at,
        blocks: (blocks || []).map((b: any) => ({
          id: b.id,
          canvasId: b.canvas_id,
          blockType: b.block_type,
          content: b.content || [],
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/lean-canvas/[canvasId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// キャンバス削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { error } = await supabase
      .from('lean_canvas')
      .delete()
      .eq('id', canvasId);

    if (error) {
      console.error('Failed to delete canvas:', error);
      return NextResponse.json({ error: 'Failed to delete canvas' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/lean-canvas/[canvasId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### ファイル: `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks/route.ts
 *
 * Phase 16: Lean Canvas ブロック更新 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_BLOCK_TYPES = [
  'problem', 'solution', 'unique_value', 'unfair_advantage',
  'customer_segments', 'key_metrics', 'channels',
  'cost_structure', 'revenue_streams'
];

type RouteParams = { params: Promise<{ workspaceId: string; canvasId: string }> };

// ブロック更新（upsert）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, canvasId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { blockType, content } = body;

    // バリデーション
    if (!blockType || !VALID_BLOCK_TYPES.includes(blockType)) {
      return NextResponse.json({ error: 'Invalid blockType' }, { status: 400 });
    }

    if (!Array.isArray(content)) {
      return NextResponse.json({ error: 'content must be an array' }, { status: 400 });
    }

    // キャンバスの存在確認
    const { data: canvas, error: canvasError } = await supabase
      .from('lean_canvas')
      .select('id')
      .eq('id', canvasId)
      .single();

    if (canvasError || !canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Upsert（存在すれば更新、なければ作成）
    const { data, error } = await supabase
      .from('lean_canvas_blocks')
      .upsert(
        {
          canvas_id: canvasId,
          block_type: blockType,
          content,
        },
        {
          onConflict: 'canvas_id,block_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert block:', error);
      return NextResponse.json({ error: 'Failed to update block' }, { status: 500 });
    }

    return NextResponse.json({
      block: {
        id: data.id,
        canvasId: data.canvas_id,
        blockType: data.block_type,
        content: data.content || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 確認ポイント
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks/route.ts` を作成した

---

## Step 5: UI コンポーネント作成

### ファイル: `app/_components/lean-canvas/index.ts`

```typescript
/**
 * app/_components/lean-canvas/index.ts
 *
 * Phase 16: Lean Canvas コンポーネントのエクスポート
 */

export { CanvasSelector } from './CanvasSelector';
export { CanvasGrid } from './CanvasGrid';
export { BlockCard } from './BlockCard';
export { BlockEditor } from './BlockEditor';
export { CustomerJourney } from './CustomerJourney';
```

### ファイル: `app/_components/lean-canvas/CanvasSelector.tsx`

```typescript
/**
 * app/_components/lean-canvas/CanvasSelector.tsx
 *
 * Phase 16: キャンバス選択・作成コンポーネント
 */

'use client';

import { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';

interface CanvasSelectorProps {
  brandId: string;
}

export function CanvasSelector({ brandId }: CanvasSelectorProps) {
  const { canvasList, currentCanvas, selectCanvas, createCanvas, deleteCanvas, loading } = useLeanCanvas();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await createCanvas(brandId);
    setCreating(false);
  };

  const handleDelete = async (e: React.MouseEvent, canvasId: string) => {
    e.stopPropagation();
    if (confirm('このキャンバスを削除しますか？')) {
      await deleteCanvas(canvasId);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {canvasList.map((canvas) => (
          <div
            key={canvas.id}
            onClick={() => selectCanvas(canvas.id)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: currentCanvas?.id === canvas.id
                ? '2px solid var(--primary)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              background: currentCanvas?.id === canvas.id
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={16} />
            <span>{canvas.name}</span>
            <button
              onClick={(e) => handleDelete(e, canvas.id)}
              style={{
                padding: '4px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* 新規作成ボタン */}
        <button
          onClick={handleCreate}
          disabled={creating || loading}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.3)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: creating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: creating ? 0.5 : 1,
          }}
        >
          <Plus size={16} />
          {creating ? '作成中...' : '新規キャンバス'}
        </button>
      </div>
    </div>
  );
}
```

### ファイル: `app/_components/lean-canvas/BlockCard.tsx`

```typescript
/**
 * app/_components/lean-canvas/BlockCard.tsx
 *
 * Phase 16: 個別ブロックカード
 */

'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { LeanCanvasBlockType, LEAN_CANVAS_BLOCK_LABELS } from '@/lib/types/lean-canvas';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { BlockEditor } from './BlockEditor';

interface BlockCardProps {
  blockType: LeanCanvasBlockType;
  gridColumn: string;
  gridRow: string;
}

export function BlockCard({ blockType, gridColumn, gridRow }: BlockCardProps) {
  const { getBlockContent, currentCanvas } = useLeanCanvas();
  const [editing, setEditing] = useState(false);

  const label = LEAN_CANVAS_BLOCK_LABELS[blockType];
  const content = getBlockContent(blockType);

  if (!currentCanvas) return null;

  return (
    <>
      <div
        style={{
          gridColumn,
          gridRow,
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${label.color}40`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '150px',
          transition: 'all 0.2s ease',
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                background: `${label.color}20`,
                color: label.color,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {label.label}
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
              {label.description}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
            }}
          >
            <Edit2 size={14} />
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {content.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>
              {content.map((item, index) => (
                <li key={index} style={{ fontSize: '13px', marginBottom: '6px', lineHeight: 1.4 }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', fontStyle: 'italic' }}>
              クリックして追加...
            </p>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {editing && (
        <BlockEditor
          blockType={blockType}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
```

### ファイル: `app/_components/lean-canvas/BlockEditor.tsx`

```typescript
/**
 * app/_components/lean-canvas/BlockEditor.tsx
 *
 * Phase 16: ブロック編集モーダル
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { LeanCanvasBlockType, LEAN_CANVAS_BLOCK_LABELS } from '@/lib/types/lean-canvas';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';

interface BlockEditorProps {
  blockType: LeanCanvasBlockType;
  onClose: () => void;
}

export function BlockEditor({ blockType, onClose }: BlockEditorProps) {
  const { getBlockContent, updateBlock } = useLeanCanvas();
  const [items, setItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const label = LEAN_CANVAS_BLOCK_LABELS[blockType];

  useEffect(() => {
    const content = getBlockContent(blockType);
    setItems(content.length > 0 ? content : ['']);
  }, [blockType, getBlockContent]);

  const handleAddItem = () => {
    setItems([...items, '']);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    const filteredItems = items.filter(item => item.trim() !== '');
    await updateBlock(blockType, filteredItems);
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          border: `1px solid ${label.color}40`,
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', color: 'white', fontSize: '18px' }}>{label.label}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              {label.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* アイテム一覧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={item}
                onChange={(e) => handleChangeItem(index, e.target.value)}
                placeholder={`項目 ${index + 1}`}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              {items.length > 1 && (
                <button
                  onClick={() => handleRemoveItem(index)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* アクション */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleAddItem}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.3)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} />
            項目を追加
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: label.color,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ファイル: `app/_components/lean-canvas/CanvasGrid.tsx`

```typescript
/**
 * app/_components/lean-canvas/CanvasGrid.tsx
 *
 * Phase 16: 9ブロックグリッドレイアウト
 */

'use client';

import { LEAN_CANVAS_LAYOUT } from '@/lib/types/lean-canvas';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { BlockCard } from './BlockCard';

export function CanvasGrid() {
  const { currentCanvas, loading } = useLeanCanvas();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  if (!currentCanvas) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.6)' }}>
        キャンバスを選択または作成してください
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(3, minmax(150px, auto))',
        gap: '16px',
      }}
    >
      {LEAN_CANVAS_LAYOUT.map(({ blockType, gridColumn, gridRow }) => (
        <BlockCard
          key={blockType}
          blockType={blockType}
          gridColumn={gridColumn}
          gridRow={gridRow}
        />
      ))}
    </div>
  );
}
```

### ファイル: `app/_components/lean-canvas/CustomerJourney.tsx`

```typescript
/**
 * app/_components/lean-canvas/CustomerJourney.tsx
 *
 * Phase 16: カスタマージャーニー可視化
 */

'use client';

import { ArrowRight, Smile, Meh, Frown } from 'lucide-react';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';

export function CustomerJourney() {
  const { currentCanvas, getBlockContent } = useLeanCanvas();

  if (!currentCanvas) return null;

  // ジャーニーのステージを生成
  const problem = getBlockContent('problem');
  const channels = getBlockContent('channels');
  const uniqueValue = getBlockContent('unique_value');
  const solution = getBlockContent('solution');

  const stages = [
    {
      name: '認知',
      description: channels[0] || 'チャネル未設定',
      emotion: 'neutral' as const,
    },
    {
      name: '課題認識',
      description: problem[0] || '課題未設定',
      emotion: 'negative' as const,
    },
    {
      name: '検討',
      description: uniqueValue[0] || '価値提案未設定',
      emotion: 'neutral' as const,
    },
    {
      name: '解決',
      description: solution[0] || '解決策未設定',
      emotion: 'positive' as const,
    },
  ];

  const EmotionIcon = ({ emotion }: { emotion: 'positive' | 'neutral' | 'negative' }) => {
    switch (emotion) {
      case 'positive':
        return <Smile size={20} color="#22c55e" />;
      case 'negative':
        return <Frown size={20} color="#ef4444" />;
      default:
        return <Meh size={20} color="#f59e0b" />;
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '32px',
      }}
    >
      <h3 style={{ margin: '0 0 20px', color: 'white', fontSize: '18px' }}>
        カスタマージャーニー
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {stages.map((stage, index) => (
          <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                minWidth: '180px',
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <EmotionIcon emotion={stage.emotion} />
                <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                  {stage.name}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.4 }}>
                {stage.description}
              </p>
            </div>
            {index < stages.length - 1 && (
              <ArrowRight size={20} color="rgba(255, 255, 255, 0.3)" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 確認ポイント
- [ ] `app/_components/lean-canvas/index.ts` を作成した
- [ ] `app/_components/lean-canvas/CanvasSelector.tsx` を作成した
- [ ] `app/_components/lean-canvas/BlockCard.tsx` を作成した
- [ ] `app/_components/lean-canvas/BlockEditor.tsx` を作成した
- [ ] `app/_components/lean-canvas/CanvasGrid.tsx` を作成した
- [ ] `app/_components/lean-canvas/CustomerJourney.tsx` を作成した

---

## Step 6: Lean Canvas ページ作成

### ファイル: `app/(app)/lean-canvas/page.tsx`

```typescript
/**
 * app/(app)/lean-canvas/page.tsx
 *
 * Phase 16: Lean Canvas ページ
 */

'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { LeanCanvasProvider, useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { Brand } from '@/lib/types/brand';
import {
  CanvasSelector,
  CanvasGrid,
  CustomerJourney,
} from '@/app/_components/lean-canvas';
import { Sparkles } from 'lucide-react';

function BrandSelector({
  brands,
  selectedBrandId,
  onSelect,
}: {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelect: (brandId: string) => void;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
        ブランドを選択
      </label>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => onSelect(brand.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: selectedBrandId === brand.id
                ? '2px solid var(--primary)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              background: selectedBrandId === brand.id
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={14} />
            {brand.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeanCanvasContent({ brandId }: { brandId: string }) {
  const { fetchCanvasList } = useLeanCanvas();

  useEffect(() => {
    if (brandId) {
      fetchCanvasList(brandId);
    }
  }, [brandId, fetchCanvasList]);

  return (
    <>
      <CanvasSelector brandId={brandId} />
      <CanvasGrid />
      <CustomerJourney />
    </>
  );
}

function LeanCanvasPageContent() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // ブランド一覧を取得
  useEffect(() => {
    if (!workspace) return;

    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/brands`);
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
          if (data.brands?.length > 0 && !selectedBrandId) {
            setSelectedBrandId(data.brands[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [workspace]);

  if (workspaceLoading || loadingBrands) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        ワークスペースを選択してください
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        まずブランドを作成してください。
        <br />
        <a href="/brand" style={{ color: 'var(--primary)', marginTop: '8px', display: 'inline-block' }}>
          ブランドページへ →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '24px',
        margin: '-24px',
      }}
    >
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: 'white' }}>
            Lean Canvas
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            ビジネスモデルを9つのブロックで設計
          </p>
        </div>

        {/* ブランド選択 */}
        <BrandSelector
          brands={brands}
          selectedBrandId={selectedBrandId}
          onSelect={setSelectedBrandId}
        />

        {/* キャンバス */}
        {selectedBrandId && (
          <LeanCanvasProvider>
            <LeanCanvasContent brandId={selectedBrandId} />
          </LeanCanvasProvider>
        )}
      </div>
    </div>
  );
}

export default function LeanCanvasPage() {
  return <LeanCanvasPageContent />;
}
```

### 確認ポイント
- [ ] `app/(app)/lean-canvas/page.tsx` を作成した
- [ ] ブランド選択機能がある
- [ ] Glass morphism デザインが適用されている

---

## Step 7: ナビゲーション更新

### ファイル: `app/(app)/layout.tsx`

NAV_ITEMS に Lean Canvas ページを追加：

```typescript
import {
  LayoutDashboard,
  LogOut,
  CheckSquare,
  Settings,
  Database,
  HardDrive,
  Users,
  Briefcase,
  Map,
  Target,
  Shield,
  Sparkles,
  LayoutGrid,  // 追加
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: NavItemWithRole[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/okr', label: 'OKR', icon: Target },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/action-maps', label: 'ActionMap', icon: Map },
  { href: '/brand', label: 'ブランド', icon: Sparkles },
  { href: '/lean-canvas', label: 'Lean Canvas', icon: LayoutGrid },  // 追加
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/admin', label: '管理', icon: Shield, requireRole: ['OWNER', 'ADMIN'] },
];
```

### 確認ポイント
- [ ] ナビゲーションに「Lean Canvas」が追加された
- [ ] LayoutGrid アイコンがインポートされた

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] ビルドが成功した
- [ ] TypeScript エラーがない
- [ ] `/lean-canvas` ページにアクセスできる

---

## 完了チェックリスト

### データベース
- [ ] lean_canvas テーブルが作成された
- [ ] lean_canvas_blocks テーブルが作成された
- [ ] RLS ポリシーが設定された
- [ ] updated_at トリガーが動作する

### バックエンド
- [ ] `lib/types/lean-canvas.ts` - 型定義
- [ ] `lib/contexts/LeanCanvasContext.tsx` - 状態管理
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/route.ts` - 一覧・作成
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/route.ts` - 詳細・削除
- [ ] `app/api/workspaces/[workspaceId]/lean-canvas/[canvasId]/blocks/route.ts` - ブロック更新

### フロントエンド
- [ ] `app/_components/lean-canvas/CanvasSelector.tsx` - キャンバス選択
- [ ] `app/_components/lean-canvas/BlockCard.tsx` - ブロックカード
- [ ] `app/_components/lean-canvas/BlockEditor.tsx` - ブロック編集モーダル
- [ ] `app/_components/lean-canvas/CanvasGrid.tsx` - 9ブロックグリッド
- [ ] `app/_components/lean-canvas/CustomerJourney.tsx` - ジャーニー可視化
- [ ] `app/(app)/lean-canvas/page.tsx` - Lean Canvas ページ

### 機能確認
- [ ] ブランド選択ができる
- [ ] キャンバスの作成ができる
- [ ] キャンバスの削除ができる
- [ ] 9ブロックの編集ができる
- [ ] カスタマージャーニーが表示される
- [ ] Glass morphism デザインが表示される

### ナビゲーション
- [ ] ナビに「Lean Canvas」が表示される
- [ ] `/lean-canvas` へ遷移できる

---

## 次のステップ

Phase 16 完了後、以下の拡張が可能：

1. **PDF エクスポート**: キャンバスの PDF 出力
2. **テンプレート**: 業種別 Lean Canvas テンプレート
3. **バージョン管理**: キャンバスの履歴管理
4. **コラボレーション**: チームメンバーとの同時編集
5. **AI アシスト**: 各ブロックの自動提案
