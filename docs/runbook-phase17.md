# Phase 17: MVV（Mission/Vision/Value）統合ビュー

## 目標

MVV（Mission/Vision/Value）を管理する統合ビューを実装：
- Mission、Vision、Value の編集
- Brand + Lean Canvas + MVV の統合表示
- 折り畳み式レイアウト（アコーディオン）

## 習得する新しい概念

| 概念 | 説明 |
|------|------|
| MVV | Mission/Vision/Value。企業理念の3要素 |
| 統合ビュー | 複数の情報を1画面にまとめて表示 |
| アコーディオン | クリックで開閉できる折り畳みUI |

## MVVとは

| 要素 | 意味 | 例 |
|------|------|-----|
| Mission | 存在意義・使命 | 「テクノロジーで人々を豊かに」 |
| Vision | 将来像 | 「すべての人がクリエイターに」 |
| Value | 価値観・行動指針 | 「失敗を恐れずチャレンジ」 |

## 前提条件

- [ ] Phase 15 完了（Brand 動作確認済み）
- [ ] Phase 16 完了（Lean Canvas 動作確認済み）

---

## Step 1: Supabase テーブル作成

### 1.1 MVV テーブル

Supabase SQL Editor で実行：

```sql
-- MVV テーブル
CREATE TABLE mvv (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  mission TEXT DEFAULT '',
  vision TEXT DEFAULT '',
  values JSONB DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id)
);

-- インデックス
CREATE INDEX idx_mvv_brand ON mvv(brand_id);

-- RLS 有効化
ALTER TABLE mvv ENABLE ROW LEVEL SECURITY;

-- ポリシー: SELECT（ワークスペースメンバーのみ）
CREATE POLICY "mvv_select" ON mvv FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM brands b
    JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
    WHERE b.id = mvv.brand_id AND wm.user_id = auth.uid()
  ));

-- ポリシー: INSERT
CREATE POLICY "mvv_insert" ON mvv FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM brands b
    JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
    WHERE b.id = mvv.brand_id AND wm.user_id = auth.uid()
  ));

-- ポリシー: UPDATE
CREATE POLICY "mvv_update" ON mvv FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM brands b
    JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
    WHERE b.id = mvv.brand_id AND wm.user_id = auth.uid()
  ));

-- ポリシー: DELETE（OWNER/ADMINのみ）
CREATE POLICY "mvv_delete" ON mvv FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM brands b
    JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
    WHERE b.id = mvv.brand_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('OWNER', 'ADMIN')
  ));
```

### 確認ポイント
- [ ] mvv テーブルが作成された
- [ ] brand_id に UNIQUE 制約が設定された
- [ ] RLS ポリシーが4つ作成された

---

## Step 2: 型定義作成

### 2.1 lib/types/mvv.ts

```typescript
/**
 * lib/types/mvv.ts
 *
 * Phase 17: MVV 型定義
 */

// MVV エンティティ
export interface MVV {
  id: string;
  brandId: string;
  mission: string;
  vision: string;
  values: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 作成・更新用入力
export interface MVVInput {
  mission?: string;
  vision?: string;
  values?: string[];
}

// MVV セクション定義
export interface MVVSectionDefinition {
  key: 'mission' | 'vision' | 'values';
  label: string;
  description: string;
  placeholder: string;
  color: string;
  icon: string;
}

// セクション設定
export const MVV_SECTIONS: MVVSectionDefinition[] = [
  {
    key: 'mission',
    label: 'Mission（使命）',
    description: '企業・ブランドの存在意義。なぜ存在するのか？',
    placeholder: '例：テクノロジーで人々の生活を豊かにする',
    color: '#ef4444',
    icon: '🎯',
  },
  {
    key: 'vision',
    label: 'Vision（将来像）',
    description: '目指す未来の姿。どこに向かうのか？',
    placeholder: '例：すべての人がクリエイターになれる世界',
    color: '#8b5cf6',
    icon: '🔭',
  },
  {
    key: 'values',
    label: 'Values（価値観）',
    description: '大切にする価値観・行動指針',
    placeholder: '例：失敗を恐れずチャレンジする',
    color: '#22c55e',
    icon: '💎',
  },
];
```

### 確認ポイント
- [ ] MVV インターフェースが定義された
- [ ] MVV_SECTIONS 定数が定義された

---

## Step 3: Context 作成

### 3.1 lib/contexts/MVVContext.tsx

```typescript
/**
 * lib/contexts/MVVContext.tsx
 *
 * Phase 17: MVV Context
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useBrand } from './BrandContext';
import { MVV, MVVInput } from '@/lib/types/mvv';

interface MVVContextValue {
  mvv: MVV | null;
  loading: boolean;
  error: string | null;
  fetchMVV: () => Promise<void>;
  updateMVV: (input: MVVInput) => Promise<void>;
}

const MVVContext = createContext<MVVContextValue | undefined>(undefined);

export function MVVProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const { currentBrand } = useBrand();
  const [mvv, setMVV] = useState<MVV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MVV取得
  const fetchMVV = useCallback(async () => {
    if (!workspace || !currentBrand) {
      setMVV(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/mvv`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setMVV(null);
          return;
        }
        throw new Error('Failed to fetch MVV');
      }
      const data = await res.json();
      setMVV(data.mvv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspace, currentBrand]);

  // MVV更新（upsert）
  const updateMVV = useCallback(async (input: MVVInput) => {
    if (!workspace || !currentBrand) return;

    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/mvv`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) throw new Error('Failed to update MVV');
      const data = await res.json();
      setMVV(data.mvv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspace, currentBrand]);

  // ブランド変更時にリセット
  useEffect(() => {
    setMVV(null);
    if (workspace && currentBrand) {
      fetchMVV();
    }
  }, [workspace, currentBrand, fetchMVV]);

  return (
    <MVVContext.Provider
      value={{
        mvv,
        loading,
        error,
        fetchMVV,
        updateMVV,
      }}
    >
      {children}
    </MVVContext.Provider>
  );
}

export function useMVV() {
  const context = useContext(MVVContext);
  if (!context) {
    throw new Error('useMVV must be used within a MVVProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] MVVContext が作成された
- [ ] useMVV フックがエクスポートされた

---

## Step 4: API エンドポイント作成

### 4.1 app/api/workspaces/[workspaceId]/brands/[brandId]/mvv/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/mvv/route.ts
 *
 * Phase 17: MVV API
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

// MVV取得
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

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // MVV取得
    const { data: mvv, error } = await supabase
      .from('mvv')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error || !mvv) {
      return NextResponse.json({ error: 'MVV not found' }, { status: 404 });
    }

    const formatted = {
      id: mvv.id,
      brandId: mvv.brand_id,
      mission: mvv.mission || '',
      vision: mvv.vision || '',
      values: mvv.values || [],
      createdBy: mvv.created_by,
      createdAt: mvv.created_at,
      updatedAt: mvv.updated_at,
    };

    return NextResponse.json({ mvv: formatted });
  } catch (error) {
    console.error('[MVV API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// MVV更新（upsert）
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

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ブランド存在確認
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const { mission, vision, values } = body;

    // Upsert
    const { data: mvv, error } = await supabase
      .from('mvv')
      .upsert(
        {
          brand_id: brandId,
          mission: mission ?? '',
          vision: vision ?? '',
          values: values ?? [],
          created_by: session.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'brand_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[MVV API] Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      id: mvv.id,
      brandId: mvv.brand_id,
      mission: mvv.mission || '',
      vision: mvv.vision || '',
      values: mvv.values || [],
      createdBy: mvv.created_by,
      createdAt: mvv.created_at,
      updatedAt: mvv.updated_at,
    };

    return NextResponse.json({ mvv: formatted });
  } catch (error) {
    console.error('[MVV API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 確認ポイント
- [ ] GET /api/workspaces/[workspaceId]/brands/[brandId]/mvv が作成された
- [ ] PUT でupsert処理が実装された

---

## Step 5: UI コンポーネント作成

### 5.1 app/_components/mvv/index.ts

```typescript
/**
 * app/_components/mvv/index.ts
 *
 * Phase 17: MVV コンポーネントエクスポート
 */

export { Collapsible } from './Collapsible';
export { MVVSection } from './MVVSection';
export { MVVEditor } from './MVVEditor';
export { UnifiedView } from './UnifiedView';
```

### 5.2 app/_components/mvv/Collapsible.tsx

```typescript
/**
 * app/_components/mvv/Collapsible.tsx
 *
 * Phase 17: 折り畳みコンポーネント
 */

'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  headerColor?: string;
}

export function Collapsible({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  headerColor = 'rgba(255, 255, 255, 0.1)',
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: headerColor,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        {isOpen ? (
          <ChevronDown size={20} color="rgba(255, 255, 255, 0.7)" />
        ) : (
          <ChevronRight size={20} color="rgba(255, 255, 255, 0.7)" />
        )}
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </button>

      {/* コンテンツ */}
      {isOpen && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
```

### 5.3 app/_components/mvv/MVVSection.tsx

```typescript
/**
 * app/_components/mvv/MVVSection.tsx
 *
 * Phase 17: Mission/Vision/Value 個別セクション
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { MVVSectionDefinition } from '@/lib/types/mvv';

interface MVVSectionProps {
  definition: MVVSectionDefinition;
  value: string | string[];
  onSave: (value: string | string[]) => Promise<void>;
}

export function MVVSection({ definition, value, onSave }: MVVSectionProps) {
  const isArray = definition.key === 'values';
  const [editValue, setEditValue] = useState<string>(isArray ? '' : (value as string) || '');
  const [items, setItems] = useState<string[]>(isArray ? (value as string[]) || [] : []);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (isArray) {
      setItems((value as string[]) || []);
    } else {
      setEditValue((value as string) || '');
    }
  }, [value, isArray]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isArray) {
        await onSave(items);
      } else {
        await onSave(editValue);
      }
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        padding: '20px',
        background: `${definition.color}10`,
        border: `1px solid ${definition.color}30`,
        borderRadius: '12px',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>{definition.icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>{definition.label}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {definition.description}
          </p>
        </div>
      </div>

      {/* 入力エリア */}
      {isArray ? (
        <div>
          {/* 追加フォーム */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={definition.placeholder}
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
            <button
              onClick={addItem}
              disabled={!newItem.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: definition.color,
                color: 'white',
                cursor: newItem.trim() ? 'pointer' : 'not-allowed',
                opacity: newItem.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={16} />
              追加
            </button>
          </div>

          {/* アイテムリスト */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: definition.color, fontWeight: 600 }}>
                  {index + 1}.
                </span>
                <span style={{ flex: 1, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                  {item}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    padding: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                価値観を追加してください
              </div>
            )}
          </div>
        </div>
      ) : (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={definition.placeholder}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* 保存ボタン */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: `linear-gradient(135deg, ${definition.color}, ${definition.color}cc)`,
            color: 'white',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
          }}
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
```

### 5.4 app/_components/mvv/MVVEditor.tsx

```typescript
/**
 * app/_components/mvv/MVVEditor.tsx
 *
 * Phase 17: MVV 編集コンポーネント
 */

'use client';

import { useMVV } from '@/lib/contexts/MVVContext';
import { useBrand } from '@/lib/contexts/BrandContext';
import { MVV_SECTIONS } from '@/lib/types/mvv';
import { MVVSection } from './MVVSection';

export function MVVEditor() {
  const { currentBrand } = useBrand();
  const { mvv, loading, updateMVV } = useMVV();

  if (!currentBrand) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        ブランドを選択してください
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  const handleSave = async (key: 'mission' | 'vision' | 'values', value: string | string[]) => {
    const updates = {
      mission: mvv?.mission || '',
      vision: mvv?.vision || '',
      values: mvv?.values || [],
      [key]: value,
    };
    await updateMVV(updates);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {MVV_SECTIONS.map((section) => (
        <MVVSection
          key={section.key}
          definition={section}
          value={
            section.key === 'values'
              ? mvv?.values || []
              : mvv?.[section.key] || ''
          }
          onSave={(value) => handleSave(section.key, value)}
        />
      ))}
    </div>
  );
}
```

### 5.5 app/_components/mvv/UnifiedView.tsx

```typescript
/**
 * app/_components/mvv/UnifiedView.tsx
 *
 * Phase 17: Brand + Lean Canvas + MVV 統合ビュー
 */

'use client';

import { useBrand } from '@/lib/contexts/BrandContext';
import { useMVV } from '@/lib/contexts/MVVContext';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { Collapsible } from './Collapsible';
import { BRAND_POINT_LABELS, BRAND_POINT_ORDER } from '@/lib/types/brand';
import { LEAN_CANVAS_BLOCKS } from '@/lib/types/lean-canvas';

export function UnifiedView() {
  const { currentBrand, getPointContent } = useBrand();
  const { mvv } = useMVV();
  const { currentCanvas, getBlockContent } = useLeanCanvas();

  if (!currentBrand) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        ブランドを選択すると、統合ビューが表示されます
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* MVV セクション */}
      <Collapsible
        title="MVV（Mission/Vision/Value）"
        subtitle="企業理念・ビジョン"
        icon="🎯"
        defaultOpen={true}
        headerColor="rgba(239, 68, 68, 0.15)"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Mission */}
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>🎯</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>Mission</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
              {mvv?.mission || '未設定'}
            </p>
          </div>

          {/* Vision */}
          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>🔭</span>
              <span style={{ fontWeight: 600, color: '#8b5cf6' }}>Vision</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
              {mvv?.vision || '未設定'}
            </p>
          </div>

          {/* Values */}
          <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>💎</span>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>Values</span>
            </div>
            {mvv?.values && mvv.values.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {mvv.values.map((v, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '4px' }}>
                    {v}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>未設定</p>
            )}
          </div>
        </div>
      </Collapsible>

      {/* Brand セクション */}
      <Collapsible
        title="ブランド戦略（10ポイント）"
        subtitle={currentBrand.name}
        icon="✨"
        headerColor="rgba(139, 92, 246, 0.15)"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {BRAND_POINT_ORDER.map((pointType) => {
            const label = BRAND_POINT_LABELS[pointType];
            const content = getPointContent(pointType);
            return (
              <div
                key={pointType}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginBottom: '6px' }}>
                  {label.label}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: content ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                  lineHeight: 1.5,
                }}>
                  {content || '未設定'}
                </p>
              </div>
            );
          })}
        </div>
      </Collapsible>

      {/* Lean Canvas セクション */}
      <Collapsible
        title="Lean Canvas"
        subtitle={currentCanvas?.title || 'キャンバスを選択'}
        icon="📋"
        headerColor="rgba(6, 182, 212, 0.15)"
      >
        {currentCanvas ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {LEAN_CANVAS_BLOCKS.map((block) => {
              const blockData = getBlockContent(block.type);
              return (
                <div
                  key={block.type}
                  style={{
                    padding: '12px',
                    background: `${block.color}15`,
                    border: `1px solid ${block.color}30`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: block.color, marginBottom: '6px' }}>
                    {block.label}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: blockData?.content ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                    lineHeight: 1.4,
                  }}>
                    {blockData?.content || '未設定'}
                  </p>
                  {blockData?.items && blockData.items.length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: '16px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {blockData.items.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                      {blockData.items.length > 3 && (
                        <li style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          他 {blockData.items.length - 3} 件
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            Lean Canvas を選択してください
          </div>
        )}
      </Collapsible>
    </div>
  );
}
```

### 確認ポイント
- [ ] Collapsible コンポーネントが作成された
- [ ] MVVSection コンポーネントが作成された
- [ ] MVVEditor コンポーネントが作成された
- [ ] UnifiedView コンポーネントが作成された

---

## Step 6: MVV ページ作成

### 6.1 app/(app)/mvv/page.tsx

```typescript
/**
 * app/(app)/mvv/page.tsx
 *
 * Phase 17: MVV 統合ページ
 */

'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { BrandProvider, useBrand } from '@/lib/contexts/BrandContext';
import { LeanCanvasProvider } from '@/lib/contexts/LeanCanvasContext';
import { MVVProvider } from '@/lib/contexts/MVVContext';
import { BrandSelector } from '@/app/_components/brand';
import { CanvasSelector } from '@/app/_components/lean-canvas';
import { MVVEditor, UnifiedView, Collapsible } from '@/app/_components/mvv';

type ViewMode = 'edit' | 'unified';

function MVVPageContent() {
  const { workspace, loading } = useWorkspace();
  const { currentBrand } = useBrand();
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  if (loading) {
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
            MVV（Mission/Vision/Value）
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
            企業理念を定義し、ブランド戦略と統合表示
          </p>
        </div>

        {/* ビューモード切り替え */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setViewMode('edit')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: viewMode === 'edit' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              background: viewMode === 'edit' ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            MVV 編集
          </button>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: viewMode === 'unified' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              background: viewMode === 'unified' ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            統合ビュー
          </button>
        </div>

        {/* ブランド選択 */}
        <div style={{ marginBottom: '24px' }}>
          <BrandSelector />
        </div>

        {/* メインコンテンツ */}
        {viewMode === 'edit' ? (
          <MVVEditor />
        ) : (
          <>
            {/* Lean Canvas 選択（統合ビューのみ） */}
            {currentBrand && (
              <div style={{ marginBottom: '24px' }}>
                <CanvasSelector />
              </div>
            )}
            <UnifiedView />
          </>
        )}
      </div>
    </div>
  );
}

export default function MVVPage() {
  return (
    <BrandProvider>
      <LeanCanvasProvider>
        <MVVProvider>
          <MVVPageContent />
        </MVVProvider>
      </LeanCanvasProvider>
    </BrandProvider>
  );
}
```

### 確認ポイント
- [ ] MVV ページが作成された
- [ ] 編集モードと統合ビューの切り替えができる

---

## Step 7: ナビゲーション更新

### 7.1 app/(app)/layout.tsx

lucide-react のインポートに `Compass` を追加し、NAV_ITEMS に MVV を追加：

```typescript
import {
  // ... 既存のインポート
  Compass,
} from 'lucide-react';

const NAV_ITEMS: NavItemWithRole[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/okr', label: 'OKR', icon: Target },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/action-maps', label: 'ActionMap', icon: Map },
  { href: '/brand', label: 'ブランド', icon: Sparkles },
  { href: '/lean-canvas', label: 'Lean Canvas', icon: LayoutGrid },
  { href: '/mvv', label: 'MVV', icon: Compass },  // 追加
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/admin', label: '管理', icon: Shield, requireRole: ['OWNER', 'ADMIN'] },
];
```

### 確認ポイント
- [ ] Compass アイコンがインポートされた
- [ ] NAV_ITEMS に `/mvv` が追加された

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] ビルドがエラーなく完了
- [ ] `/mvv` ページが出力に含まれている

---

## 完了チェックリスト

### Supabase
- [ ] mvv テーブルが作成された
- [ ] RLS ポリシーが設定された

### コード
- [ ] lib/types/mvv.ts が作成された
- [ ] lib/contexts/MVVContext.tsx が作成された
- [ ] API エンドポイントが作成された
- [ ] app/_components/mvv/ に4つのコンポーネントが作成された
- [ ] app/(app)/mvv/page.tsx が作成された
- [ ] ナビゲーションに MVV が追加された

### 動作確認
- [ ] ブランド選択後、MVV が編集できる
- [ ] Mission、Vision、Values が保存される
- [ ] 統合ビューで Brand + Lean Canvas + MVV が表示される
- [ ] 折り畳み（アコーディオン）が動作する
- [ ] ビルドが成功する

---

## トラブルシューティング

### MVV が保存されない
- brand_id の UNIQUE 制約を確認
- RLS ポリシーのメンバーシップ確認を確認

### 統合ビューが表示されない
- BrandProvider が正しくラップされているか確認
- LeanCanvasProvider、MVVProvider の順序を確認

### 折り畳みが動作しない
- useState の初期値を確認
- onClick イベントが正しくバインドされているか確認
