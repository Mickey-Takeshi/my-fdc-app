# Phase 15: 10ポイントブランド戦略

## このPhaseの目標

ビジネスツールの第一弾として、10ポイントブランド戦略を実装：
- ブランドの基本情報（名前、タグライン、ストーリー）
- 10ポイント要素の編集
- ガイドライン表示
- トーン&マナーチェック

## 習得する新しい概念

- **ブランド戦略**: 企業・製品のイメージを計画的に構築する戦略
- **10ポイント**: ミッション、ビジョン、ターゲット、差別化など10項目で整理
- **トーン&マナー**: ブランドの「声」と「振る舞い」のルール
- **Glass morphism**: すりガラス効果を使ったモダンUIデザイン

## 前提条件

- [ ] Phase 1-14 完了
- [ ] Supabase + 認証が動作
- [ ] ワークスペース機能が動作

---

## Step 1: Supabase テーブル作成

Supabase ダッシュボードの SQL Editor で実行：

```sql
-- ========================================
-- brands テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT,
  story TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_brands_workspace ON brands(workspace_id);

-- ========================================
-- brand_points テーブル（10ポイント用）
-- ========================================
CREATE TABLE IF NOT EXISTS brand_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  point_type TEXT NOT NULL CHECK (point_type IN (
    'mission', 'vision', 'target_audience', 'unique_value',
    'brand_personality', 'tone_voice', 'visual_identity',
    'key_messages', 'competitors', 'differentiators'
  )),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, point_type)
);

-- インデックス
CREATE INDEX idx_brand_points_brand ON brand_points(brand_id);

-- ========================================
-- RLS ポリシー
-- ========================================

-- brands テーブル
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_select" ON brands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = brands.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brands_insert" ON brands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = brands.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brands_update" ON brands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = brands.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brands_delete" ON brands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = brands.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- brand_points テーブル
ALTER TABLE brand_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_points_select" ON brand_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = brand_points.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brand_points_insert" ON brand_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = brand_points.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brand_points_update" ON brand_points FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = brand_points.brand_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "brand_points_delete" ON brand_points FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = brand_points.brand_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- ========================================
-- updated_at 自動更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_points_updated_at
  BEFORE UPDATE ON brand_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 確認ポイント
- [ ] brands テーブルが作成された
- [ ] brand_points テーブルが作成された
- [ ] RLS ポリシーが有効になった
- [ ] インデックスが作成された

---

## Step 2: 型定義

### ファイル: `lib/types/brand.ts`

```typescript
/**
 * lib/types/brand.ts
 *
 * Phase 15: ブランド戦略の型定義
 */

/**
 * 10ポイントの種類
 */
export type BrandPointType =
  | 'mission'           // ミッション（存在意義）
  | 'vision'            // ビジョン（将来像）
  | 'target_audience'   // ターゲット顧客
  | 'unique_value'      // 独自の価値提案
  | 'brand_personality' // ブランドパーソナリティ
  | 'tone_voice'        // トーン&ボイス
  | 'visual_identity'   // ビジュアルアイデンティティ
  | 'key_messages'      // キーメッセージ
  | 'competitors'       // 競合分析
  | 'differentiators';  // 差別化要因

/**
 * 10ポイントのラベル定義
 */
export const BRAND_POINT_LABELS: Record<BrandPointType, { label: string; description: string }> = {
  mission: {
    label: 'ミッション',
    description: '企業・ブランドの存在意義。なぜ存在するのか？',
  },
  vision: {
    label: 'ビジョン',
    description: '目指す将来像。どんな世界を実現したいか？',
  },
  target_audience: {
    label: 'ターゲット顧客',
    description: '理想的な顧客像。誰に届けたいか？',
  },
  unique_value: {
    label: '独自の価値提案',
    description: '顧客に提供する独自の価値。なぜ選ばれるか？',
  },
  brand_personality: {
    label: 'ブランドパーソナリティ',
    description: 'ブランドを人に例えたときの性格・特徴',
  },
  tone_voice: {
    label: 'トーン&ボイス',
    description: 'コミュニケーションの声のトーンと話し方',
  },
  visual_identity: {
    label: 'ビジュアルアイデンティティ',
    description: 'ロゴ、色、フォント、画像スタイルなど',
  },
  key_messages: {
    label: 'キーメッセージ',
    description: '一貫して伝えたい主要なメッセージ',
  },
  competitors: {
    label: '競合分析',
    description: '主要な競合と市場でのポジション',
  },
  differentiators: {
    label: '差別化要因',
    description: '競合と比べたときの明確な違い',
  },
};

/**
 * 10ポイントの順序
 */
export const BRAND_POINT_ORDER: BrandPointType[] = [
  'mission',
  'vision',
  'target_audience',
  'unique_value',
  'brand_personality',
  'tone_voice',
  'visual_identity',
  'key_messages',
  'competitors',
  'differentiators',
];

/**
 * ブランド
 */
export interface Brand {
  id: string;
  workspaceId: string;
  name: string;
  tagline: string | null;
  story: string | null;
  logoUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ブランドポイント
 */
export interface BrandPoint {
  id: string;
  brandId: string;
  pointType: BrandPointType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ブランドと全ポイントを含む
 */
export interface BrandWithPoints extends Brand {
  points: BrandPoint[];
}

/**
 * ブランド作成リクエスト
 */
export interface CreateBrandRequest {
  name: string;
  tagline?: string;
  story?: string;
}

/**
 * ブランド更新リクエスト
 */
export interface UpdateBrandRequest {
  name?: string;
  tagline?: string;
  story?: string;
  logoUrl?: string;
}

/**
 * ポイント更新リクエスト
 */
export interface UpdateBrandPointRequest {
  pointType: BrandPointType;
  content: string;
}

/**
 * トーン&マナーチェック結果
 */
export interface TonmanaCheckResult {
  isConsistent: boolean;
  score: number; // 0-100
  suggestions: string[];
  checkedAt: string;
}
```

### 確認ポイント
- [ ] `lib/types/brand.ts` を作成した
- [ ] 10ポイントの型が定義された
- [ ] ラベル定義が含まれている

---

## Step 3: Context 作成

### ファイル: `lib/contexts/BrandContext.tsx`

```typescript
/**
 * lib/contexts/BrandContext.tsx
 *
 * Phase 15: ブランド戦略の状態管理
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
  Brand,
  BrandPoint,
  BrandWithPoints,
  BrandPointType,
  BRAND_POINT_ORDER,
} from '@/lib/types/brand';

interface BrandContextType {
  brands: Brand[];
  currentBrand: BrandWithPoints | null;
  loading: boolean;
  error: string | null;

  // ブランド操作
  fetchBrands: () => Promise<void>;
  selectBrand: (brandId: string) => Promise<void>;
  createBrand: (name: string, tagline?: string, story?: string) => Promise<Brand | null>;
  updateBrand: (brandId: string, data: Partial<Brand>) => Promise<boolean>;
  deleteBrand: (brandId: string) => Promise<boolean>;

  // ポイント操作
  updatePoint: (pointType: BrandPointType, content: string) => Promise<boolean>;
  getPointContent: (pointType: BrandPointType) => string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<BrandWithPoints | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブランド一覧を取得
  const fetchBrands = useCallback(async () => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands`);
      if (!res.ok) throw new Error('Failed to fetch brands');

      const data = await res.json();
      setBrands(data.brands || []);

      // 最初のブランドを自動選択
      if (data.brands?.length > 0 && !currentBrand) {
        await selectBrand(data.brands[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ブランドを選択（ポイント含む）
  const selectBrand = useCallback(async (brandId: string) => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch brand');

      const data = await res.json();
      setCurrentBrand(data.brand);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ブランドを作成
  const createBrand = useCallback(async (
    name: string,
    tagline?: string,
    story?: string
  ): Promise<Brand | null> => {
    if (!workspace) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tagline, story }),
      });

      if (!res.ok) throw new Error('Failed to create brand');

      const data = await res.json();
      setBrands(prev => [...prev, data.brand]);
      await selectBrand(data.brand.id);

      return data.brand;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspace, selectBrand]);

  // ブランドを更新
  const updateBrand = useCallback(async (
    brandId: string,
    data: Partial<Brand>
  ): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update brand');

      const result = await res.json();

      // 一覧を更新
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ...result.brand } : b));

      // 現在のブランドを更新
      if (currentBrand?.id === brandId) {
        setCurrentBrand(prev => prev ? { ...prev, ...result.brand } : null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ブランドを削除
  const deleteBrand = useCallback(async (brandId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete brand');

      setBrands(prev => prev.filter(b => b.id !== brandId));

      if (currentBrand?.id === brandId) {
        setCurrentBrand(null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ポイントを更新
  const updatePoint = useCallback(async (
    pointType: BrandPointType,
    content: string
  ): Promise<boolean> => {
    if (!workspace || !currentBrand) return false;

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/points`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointType, content }),
        }
      );

      if (!res.ok) throw new Error('Failed to update point');

      const data = await res.json();

      // 現在のブランドのポイントを更新
      setCurrentBrand(prev => {
        if (!prev) return null;

        const existingIndex = prev.points.findIndex(p => p.pointType === pointType);
        const newPoints = [...prev.points];

        if (existingIndex >= 0) {
          newPoints[existingIndex] = data.point;
        } else {
          newPoints.push(data.point);
        }

        return { ...prev, points: newPoints };
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ポイントの内容を取得
  const getPointContent = useCallback((pointType: BrandPointType): string => {
    if (!currentBrand) return '';
    const point = currentBrand.points.find(p => p.pointType === pointType);
    return point?.content || '';
  }, [currentBrand]);

  // ワークスペース変更時にブランドを取得
  useEffect(() => {
    if (workspace) {
      fetchBrands();
    } else {
      setBrands([]);
      setCurrentBrand(null);
    }
  }, [workspace]);

  return (
    <BrandContext.Provider
      value={{
        brands,
        currentBrand,
        loading,
        error,
        fetchBrands,
        selectBrand,
        createBrand,
        updateBrand,
        deleteBrand,
        updatePoint,
        getPointContent,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] `lib/contexts/BrandContext.tsx` を作成した
- [ ] CRUD 操作が実装されている
- [ ] ポイント更新機能がある

---

## Step 4: API エンドポイント作成

### ファイル: `app/api/workspaces/[workspaceId]/brands/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/brands/route.ts
 *
 * Phase 15: ブランド一覧・作成 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { BRAND_POINT_ORDER } from '@/lib/types/brand';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string }> };

// ブランド一覧取得
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

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    const brands = data.map((item: any) => ({
      id: item.id,
      workspaceId: item.workspace_id,
      name: item.name,
      tagline: item.tagline,
      story: item.story,
      logoUrl: item.logo_url,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド作成
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
    const { name, tagline, story } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // ブランドを作成
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        workspace_id: workspaceId,
        name,
        tagline: tagline || null,
        story: story || null,
        created_by: session.userId,
      })
      .select()
      .single();

    if (brandError) {
      console.error('Failed to create brand:', brandError);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    // 10ポイントの初期データを作成
    const pointsToInsert = BRAND_POINT_ORDER.map(pointType => ({
      brand_id: brand.id,
      point_type: pointType,
      content: '',
    }));

    const { error: pointsError } = await supabase
      .from('brand_points')
      .insert(pointsToInsert);

    if (pointsError) {
      console.error('Failed to create initial points:', pointsError);
      // ブランドは作成済みなので続行
    }

    return NextResponse.json({
      brand: {
        id: brand.id,
        workspaceId: brand.workspace_id,
        name: brand.name,
        tagline: brand.tagline,
        story: brand.story,
        logoUrl: brand.logo_url,
        createdBy: brand.created_by,
        createdAt: brand.created_at,
        updatedAt: brand.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workspaces/[workspaceId]/brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### ファイル: `app/api/workspaces/[workspaceId]/brands/[brandId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/route.ts
 *
 * Phase 15: ブランド詳細・更新・削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; brandId: string }> };

// ブランド詳細取得（ポイント含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // ブランドを取得
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // ポイントを取得
    const { data: points, error: pointsError } = await supabase
      .from('brand_points')
      .select('*')
      .eq('brand_id', brandId);

    if (pointsError) {
      console.error('Failed to fetch points:', pointsError);
    }

    return NextResponse.json({
      brand: {
        id: brand.id,
        workspaceId: brand.workspace_id,
        name: brand.name,
        tagline: brand.tagline,
        story: brand.story,
        logoUrl: brand.logo_url,
        createdBy: brand.created_by,
        createdAt: brand.created_at,
        updatedAt: brand.updated_at,
        points: (points || []).map((p: any) => ({
          id: p.id,
          brandId: p.brand_id,
          pointType: p.point_type,
          content: p.content,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { name, tagline, story, logoUrl } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (story !== undefined) updateData.story = story;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;

    const { data, error } = await supabase
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update brand:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json({
      brand: {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        tagline: data.tagline,
        story: data.story,
        logoUrl: data.logo_url,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Failed to delete brand:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### ファイル: `app/api/workspaces/[workspaceId]/brands/[brandId]/points/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/points/route.ts
 *
 * Phase 15: ブランドポイント更新 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { BrandPointType, BRAND_POINT_ORDER } from '@/lib/types/brand';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; brandId: string }> };

// ポイント更新（upsert）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { pointType, content } = body;

    // バリデーション
    if (!pointType || !BRAND_POINT_ORDER.includes(pointType as BrandPointType)) {
      return NextResponse.json({ error: 'Invalid pointType' }, { status: 400 });
    }

    if (content === undefined) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // ブランドの存在確認
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Upsert（存在すれば更新、なければ作成）
    const { data, error } = await supabase
      .from('brand_points')
      .upsert(
        {
          brand_id: brandId,
          point_type: pointType,
          content,
        },
        {
          onConflict: 'brand_id,point_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert point:', error);
      return NextResponse.json({ error: 'Failed to update point' }, { status: 500 });
    }

    return NextResponse.json({
      point: {
        id: data.id,
        brandId: data.brand_id,
        pointType: data.point_type,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[workspaceId]/brands/[brandId]/points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 確認ポイント
- [ ] `app/api/workspaces/[workspaceId]/brands/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/brands/[brandId]/route.ts` を作成した
- [ ] `app/api/workspaces/[workspaceId]/brands/[brandId]/points/route.ts` を作成した

---

## Step 5: UI コンポーネント作成

### ファイル: `app/_components/brand/index.ts`

```typescript
/**
 * app/_components/brand/index.ts
 *
 * Phase 15: ブランドコンポーネントのエクスポート
 */

export { BrandSelector } from './BrandSelector';
export { BrandProfile } from './BrandProfile';
export { BrandPoints } from './BrandPoints';
export { BrandPointCard } from './BrandPointCard';
export { TonmanaCheck } from './TonmanaCheck';
export { GlassCard } from './GlassCard';
```

### ファイル: `app/_components/brand/GlassCard.tsx`

```typescript
/**
 * app/_components/brand/GlassCard.tsx
 *
 * Phase 15: Glass morphism カードコンポーネント
 */

'use client';

import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, style, className, onClick }: GlassCardProps) {
  const baseStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={baseStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}
```

### ファイル: `app/_components/brand/BrandSelector.tsx`

```typescript
/**
 * app/_components/brand/BrandSelector.tsx
 *
 * Phase 15: ブランド選択・作成コンポーネント
 */

'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function BrandSelector() {
  const { brands, currentBrand, selectBrand, createBrand, loading } = useBrand();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    await createBrand(newName, newTagline || undefined);
    setNewName('');
    setNewTagline('');
    setShowCreate(false);
    setCreating(false);
  };

  if (loading && brands.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* ブランド選択 */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => selectBrand(brand.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: currentBrand?.id === brand.id
                ? '2px solid var(--primary)'
                : '1px solid var(--border)',
              background: currentBrand?.id === brand.id
                ? 'rgba(59, 130, 246, 0.1)'
                : 'var(--bg-secondary)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={16} />
            {brand.name}
          </button>
        ))}

        {/* 新規作成ボタン */}
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px dashed var(--border)',
            background: 'transparent',
            color: 'var(--text-light)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          新規ブランド
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreate && (
        <GlassCard style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>新規ブランド作成</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="ブランド名 *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="タグライン（任意）"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: newName.trim() && !creating ? 'pointer' : 'not-allowed',
                  opacity: newName.trim() && !creating ? 1 : 0.5,
                }}
              >
                {creating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
```

### ファイル: `app/_components/brand/BrandProfile.tsx`

```typescript
/**
 * app/_components/brand/BrandProfile.tsx
 *
 * Phase 15: ブランド基本情報コンポーネント
 */

'use client';

import { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function BrandProfile() {
  const { currentBrand, updateBrand, deleteBrand } = useBrand();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentBrand) {
    return (
      <GlassCard>
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>
          ブランドを選択または作成してください
        </p>
      </GlassCard>
    );
  }

  const startEdit = () => {
    setName(currentBrand.name);
    setTagline(currentBrand.tagline || '');
    setStory(currentBrand.story || '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateBrand(currentBrand.id, { name, tagline, story });
    setEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm(`「${currentBrand.name}」を削除しますか？この操作は取り消せません。`)) {
      await deleteBrand(currentBrand.id);
    }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ブランド名"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="タグライン"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  fontSize: '14px',
                }}
              />
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="ブランドストーリー"
                rows={4}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>{currentBrand.name}</h2>
              {currentBrand.tagline && (
                <p style={{ margin: '0 0 16px', color: 'var(--primary)', fontSize: '16px' }}>
                  {currentBrand.tagline}
                </p>
              )}
              {currentBrand.story && (
                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                  {currentBrand.story}
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <Save size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--error)',
                  background: 'transparent',
                  color: 'var(--error)',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
```

### ファイル: `app/_components/brand/BrandPointCard.tsx`

```typescript
/**
 * app/_components/brand/BrandPointCard.tsx
 *
 * Phase 15: 個別ポイント編集カード
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Edit2, X } from 'lucide-react';
import { BrandPointType, BRAND_POINT_LABELS } from '@/lib/types/brand';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

interface BrandPointCardProps {
  pointType: BrandPointType;
  index: number;
}

export function BrandPointCard({ pointType, index }: BrandPointCardProps) {
  const { getPointContent, updatePoint, currentBrand } = useBrand();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const label = BRAND_POINT_LABELS[pointType];
  const currentContent = getPointContent(pointType);

  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = async () => {
    setSaving(true);
    await updatePoint(pointType, content);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setContent(currentContent);
    setEditing(false);
  };

  if (!currentBrand) return null;

  return (
    <GlassCard
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 番号バッジ */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        {index + 1}
      </div>

      <div style={{ marginLeft: '20px' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{label.label}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>
              {label.description}
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-light)',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>

        {/* コンテンツ */}
        {editing ? (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${label.label}を入力...`}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={14} />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Save size={14} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              minHeight: '60px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: currentContent ? 'var(--text)' : 'var(--text-light)',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {currentContent || `${label.label}を入力してください...`}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
```

### ファイル: `app/_components/brand/BrandPoints.tsx`

```typescript
/**
 * app/_components/brand/BrandPoints.tsx
 *
 * Phase 15: 10ポイント一覧コンポーネント
 */

'use client';

import { BRAND_POINT_ORDER } from '@/lib/types/brand';
import { useBrand } from '@/lib/contexts/BrandContext';
import { BrandPointCard } from './BrandPointCard';

export function BrandPoints() {
  const { currentBrand, loading } = useBrand();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!currentBrand) {
    return null;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: '20px' }}>10ポイントブランド戦略</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
        }}
      >
        {BRAND_POINT_ORDER.map((pointType, index) => (
          <BrandPointCard key={pointType} pointType={pointType} index={index} />
        ))}
      </div>
    </div>
  );
}
```

### ファイル: `app/_components/brand/TonmanaCheck.tsx`

```typescript
/**
 * app/_components/brand/TonmanaCheck.tsx
 *
 * Phase 15: トーン&マナーチェックコンポーネント
 */

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function TonmanaCheck() {
  const { currentBrand, getPointContent } = useBrand();
  const [inputText, setInputText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    feedback: string[];
  } | null>(null);

  if (!currentBrand) return null;

  const toneVoice = getPointContent('tone_voice');
  const brandPersonality = getPointContent('brand_personality');
  const keyMessages = getPointContent('key_messages');

  const handleCheck = async () => {
    if (!inputText.trim()) return;

    setChecking(true);

    // シンプルなローカルチェック（実際のプロジェクトではAI APIを使用可能）
    await new Promise(resolve => setTimeout(resolve, 1000));

    const feedback: string[] = [];
    let score = 100;

    // トーン&ボイスが設定されているか
    if (!toneVoice) {
      feedback.push('トーン&ボイスが未設定です。設定することで一貫性チェックが可能になります。');
      score -= 20;
    }

    // ブランドパーソナリティが設定されているか
    if (!brandPersonality) {
      feedback.push('ブランドパーソナリティが未設定です。');
      score -= 10;
    }

    // キーメッセージが設定されているか
    if (!keyMessages) {
      feedback.push('キーメッセージが未設定です。');
      score -= 10;
    }

    // 入力テキストの長さチェック
    if (inputText.length < 20) {
      feedback.push('テキストが短すぎます。より詳細な文章でチェックすることをお勧めします。');
      score -= 15;
    }

    // トーンキーワードチェック（簡易版）
    if (toneVoice) {
      const toneKeywords = toneVoice.toLowerCase().split(/[、,\s]+/);
      const hasMatchingTone = toneKeywords.some(keyword =>
        inputText.toLowerCase().includes(keyword)
      );
      if (!hasMatchingTone && toneKeywords.length > 0) {
        feedback.push('設定されたトーン&ボイスのキーワードが含まれていません。');
        score -= 15;
      }
    }

    if (feedback.length === 0) {
      feedback.push('ブランドガイドラインに沿った良い文章です！');
    }

    setResult({ score: Math.max(0, score), feedback });
    setChecking(false);
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '18px' }}>トーン&マナーチェック</h3>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-light)' }}>
        作成したコピーやメッセージがブランドガイドラインに沿っているかチェックします。
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="チェックしたいテキストを入力..."
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text)',
          fontSize: '14px',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: '12px',
        }}
      />

      <button
        onClick={handleCheck}
        disabled={!inputText.trim() || checking}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
          color: 'white',
          cursor: inputText.trim() && !checking ? 'pointer' : 'not-allowed',
          opacity: inputText.trim() && !checking ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <CheckCircle size={16} />
        {checking ? 'チェック中...' : 'チェック'}
      </button>

      {/* 結果表示 */}
      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: result.score >= 70
              ? 'rgba(34, 197, 94, 0.1)'
              : result.score >= 40
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              result.score >= 70
                ? 'rgba(34, 197, 94, 0.3)'
                : result.score >= 40
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {result.score >= 70 ? (
              <CheckCircle size={24} color="var(--success)" />
            ) : (
              <AlertCircle size={24} color={result.score >= 40 ? 'var(--warning)' : 'var(--error)'} />
            )}
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>一貫性スコア</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.score}点</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>フィードバック:</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {result.feedback.map((item, index) => (
                <li key={index} style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
```

### 確認ポイント
- [ ] `app/_components/brand/index.ts` を作成した
- [ ] `app/_components/brand/GlassCard.tsx` を作成した
- [ ] `app/_components/brand/BrandSelector.tsx` を作成した
- [ ] `app/_components/brand/BrandProfile.tsx` を作成した
- [ ] `app/_components/brand/BrandPointCard.tsx` を作成した
- [ ] `app/_components/brand/BrandPoints.tsx` を作成した
- [ ] `app/_components/brand/TonmanaCheck.tsx` を作成した

---

## Step 6: ブランドページ作成

### ファイル: `app/(app)/brand/page.tsx`

```typescript
/**
 * app/(app)/brand/page.tsx
 *
 * Phase 15: ブランド戦略ページ
 */

'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { BrandProvider } from '@/lib/contexts/BrandContext';
import {
  BrandSelector,
  BrandProfile,
  BrandPoints,
  TonmanaCheck,
} from '@/app/_components/brand';

function BrandPageContent() {
  const { workspace, loading } = useWorkspace();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        ワークスペースを選択してください
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: 'white' }}>
            ブランド戦略
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            10ポイントフレームワークでブランドを定義・管理
          </p>
        </div>

        {/* ブランド選択 */}
        <BrandSelector />

        {/* ブランド基本情報 */}
        <div style={{ marginBottom: '32px' }}>
          <BrandProfile />
        </div>

        {/* 10ポイント */}
        <div style={{ marginBottom: '32px' }}>
          <BrandPoints />
        </div>

        {/* トーン&マナーチェック */}
        <div style={{ maxWidth: '600px' }}>
          <TonmanaCheck />
        </div>
      </div>
    </div>
  );
}

export default function BrandPage() {
  return (
    <BrandProvider>
      <BrandPageContent />
    </BrandProvider>
  );
}
```

### 確認ポイント
- [ ] `app/(app)/brand/page.tsx` を作成した
- [ ] Glass morphism デザインが適用されている

---

## Step 7: ナビゲーション更新

### ファイル: `app/(app)/layout.tsx`

NAV_ITEMS にブランドページを追加：

```typescript
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  Users,
  Briefcase,
  Map,
  Target,
  Shield,
  Sparkles,  // 追加
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: NavItemWithRole[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/okr', label: 'OKR', icon: Target },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/action-maps', label: 'ActionMap', icon: Map },
  { href: '/brand', label: 'ブランド', icon: Sparkles },  // 追加
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/admin', label: '管理', icon: Shield, requireRole: ['OWNER', 'ADMIN'] },
];
```

### 確認ポイント
- [ ] ナビゲーションに「ブランド」が追加された
- [ ] Sparkles アイコンがインポートされた

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] ビルドが成功した
- [ ] TypeScript エラーがない
- [ ] `/brand` ページにアクセスできる

---

## 完了チェックリスト

### データベース
- [ ] brands テーブルが作成された
- [ ] brand_points テーブルが作成された
- [ ] RLS ポリシーが設定された
- [ ] updated_at トリガーが動作する

### バックエンド
- [ ] `lib/types/brand.ts` - 型定義
- [ ] `lib/contexts/BrandContext.tsx` - 状態管理
- [ ] `app/api/workspaces/[workspaceId]/brands/route.ts` - 一覧・作成
- [ ] `app/api/workspaces/[workspaceId]/brands/[brandId]/route.ts` - 詳細・更新・削除
- [ ] `app/api/workspaces/[workspaceId]/brands/[brandId]/points/route.ts` - ポイント更新

### フロントエンド
- [ ] `app/_components/brand/GlassCard.tsx` - Glass morphism カード
- [ ] `app/_components/brand/BrandSelector.tsx` - ブランド選択
- [ ] `app/_components/brand/BrandProfile.tsx` - 基本情報
- [ ] `app/_components/brand/BrandPointCard.tsx` - ポイントカード
- [ ] `app/_components/brand/BrandPoints.tsx` - 10ポイント一覧
- [ ] `app/_components/brand/TonmanaCheck.tsx` - トーン&マナーチェック
- [ ] `app/(app)/brand/page.tsx` - ブランドページ

### 機能確認
- [ ] ブランドの作成ができる
- [ ] ブランドの編集ができる
- [ ] ブランドの削除ができる
- [ ] 10ポイントの編集ができる
- [ ] トーン&マナーチェックが動作する
- [ ] Glass morphism デザインが表示される

### ナビゲーション
- [ ] ナビに「ブランド」が表示される
- [ ] `/brand` へ遷移できる

---

## 次のステップ

Phase 15 完了後、以下の拡張が可能：

1. **AI 連携**: トーン&マナーチェックを OpenAI API で高度化
2. **画像アップロード**: ロゴ画像の Supabase Storage 連携
3. **エクスポート**: ブランドガイドラインの PDF 出力
4. **テンプレート**: 業種別ブランド戦略テンプレート
