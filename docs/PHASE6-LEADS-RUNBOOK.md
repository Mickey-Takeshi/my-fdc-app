# Phase 6: Leads（見込み客）管理 ランブック

**作成日**: 2025-12-07
**前提**: Phase 3-5 完了（Supabase 統合済み、Google OAuth 動作、ワークスペース作成済み）

---

## 0. 概要

見込み客（Leads / Prospects）管理機能を実装する。ファネル管理（未接触→反応あり→商談中→成約/失注）とカンバン/リスト表示、次アクション提案を実現。

### 完了チェック

- [ ] Prospect 型定義を作成した
- [ ] ファネルステータス（FunnelStatus）を定義した
- [ ] /leads ページを作成した
- [ ] カンバン表示ができる
- [ ] リスト表示ができる
- [ ] リード追加フォームが動作する
- [ ] ステータス変更ができる
- [ ] 検索・フィルター機能がある
- [ ] 次アクション提案UIがある（オプション）

---

## 1. 型定義

### 1.1 ファイル: `lib/types/lead.ts`

```typescript
/**
 * lib/types/lead.ts
 *
 * Phase 6: Leads（見込み客）型定義
 */

import { z } from 'zod';

// ========================================
// ファネルステータス
// ========================================

export const LeadStatusSchema = z.enum([
  'UNCONTACTED',  // 未接触
  'RESPONDED',    // 反応あり
  'NEGOTIATION',  // 商談中
  'WON',          // 成約
  'LOST',         // 失注
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  UNCONTACTED: '未接触',
  RESPONDED: '反応あり',
  NEGOTIATION: '商談中',
  WON: '成約',
  LOST: '失注',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  UNCONTACTED: '#E0E0E0',
  RESPONDED: '#2196F3',
  NEGOTIATION: '#FFD700',
  WON: '#FF9800',
  LOST: '#9E9E9E',
};

// ========================================
// 集客チャネル
// ========================================

export const LeadChannelSchema = z.enum([
  'REAL',         // リアル（対面）
  'HP',           // ホームページ
  'MAIL_MAGAZINE', // メルマガ
  'MESSENGER',    // メッセンジャー
  'X',            // X (Twitter)
  'PHONE_SMS',    // 電話・SMS
  'WEB_APP',      // WEBアプリ
]);

export type LeadChannel = z.infer<typeof LeadChannelSchema>;

export const LEAD_CHANNEL_LABELS: Record<LeadChannel, string> = {
  REAL: 'リアル',
  HP: 'HP',
  MAIL_MAGAZINE: 'メルマガ',
  MESSENGER: 'メッセンジャー',
  X: 'X',
  PHONE_SMS: '電話・SMS',
  WEB_APP: 'WEBアプリ',
};

// ========================================
// Lead（見込み客）型
// ========================================

export const LeadSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  status: LeadStatusSchema,
  channel: LeadChannelSchema.optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // 失注情報
  lostReason: z.string().optional(),
  lostFeedback: z.string().optional(),
  // 日付
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // リマインダー
  reminder: z.string().datetime().nullable().optional(),
  reminderNote: z.string().optional(),
  // 次ミーティング
  nextMeeting: z.string().datetime().nullable().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateLeadSchema = LeadSchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  contactPerson: z.string().min(1, '担当者名は必須です'),
  status: LeadStatusSchema.default('UNCONTACTED'),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = LeadSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

// ========================================
// 失注アンケート
// ========================================

export const LostSurveySchema = z.object({
  reason: z.enum([
    'PRICE',           // 価格が合わない
    'TIMING',          // タイミングが合わない
    'COMPETITOR',      // 競合に決定
    'NO_NEED',         // ニーズがなくなった
    'NO_RESPONSE',     // 連絡が取れない
    'OTHER',           // その他
  ]),
  reasonOther: z.string().optional(),
  feedback: z.string().optional(),
});

export type LostSurvey = z.infer<typeof LostSurveySchema>;

export const LOST_REASON_LABELS: Record<string, string> = {
  PRICE: '価格が合わない',
  TIMING: 'タイミングが合わない',
  COMPETITOR: '競合に決定',
  NO_NEED: 'ニーズがなくなった',
  NO_RESPONSE: '連絡が取れない',
  OTHER: 'その他',
};
```

---

## 2. データベース

### 2.1 テーブル作成 SQL

Supabase SQL エディタで実行：

```sql
-- leads テーブル
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_person TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'UNCONTACTED'
    CHECK (status IN ('UNCONTACTED', 'RESPONDED', 'NEGOTIATION', 'WON', 'LOST')),
  channel TEXT
    CHECK (channel IS NULL OR channel IN ('REAL', 'HP', 'MAIL_MAGAZINE', 'MESSENGER', 'X', 'PHONE_SMS', 'WEB_APP')),
  memo TEXT,
  tags TEXT[] DEFAULT '{}',
  lost_reason TEXT,
  lost_feedback TEXT,
  reminder TIMESTAMPTZ,
  reminder_note TEXT,
  next_meeting TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- RLS ポリシー
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ワークスペースメンバーのみアクセス可能
CREATE POLICY "leads_workspace_member_access" ON leads
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
```

---

## 3. API 実装

### 3.1 ファイル: `app/api/workspaces/[workspaceId]/leads/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/leads/route.ts
 *
 * Phase 6: Leads CRUD API
 *
 * GET  - リード一覧取得
 * POST - リード作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateLeadSchema } from '@/lib/types/lead';

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

  // ワークスペースメンバーシップ確認
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
 * GET /api/workspaces/[workspaceId]/leads
 * リード一覧を取得
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // ステータスフィルター
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // 検索フィルター
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,memo.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Leads API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // snake_case → camelCase 変換
    const leads = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      status: row.status,
      channel: row.channel,
      memo: row.memo,
      tags: row.tags,
      lostReason: row.lost_reason,
      lostFeedback: row.lost_feedback,
      reminder: row.reminder,
      reminderNote: row.reminder_note,
      nextMeeting: row.next_meeting,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/leads
 * リード作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = CreateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        status: input.status,
        channel: input.channel,
        memo: input.memo,
        tags: input.tags,
      })
      .select()
      .single();

    if (error) {
      console.error('[Leads API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const lead = {
      id: data.id,
      workspaceId: data.workspace_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      channel: data.channel,
      memo: data.memo,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Leads API] Created lead:', lead.id);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 ファイル: `app/api/workspaces/[workspaceId]/leads/[leadId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/leads/[leadId]/route.ts
 *
 * Phase 6: Lead 個別操作 API
 *
 * GET    - リード詳細取得
 * PATCH  - リード更新
 * DELETE - リード削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateLeadSchema } from '@/lib/types/lead';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; leadId: string }>;
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
 * GET /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = {
    id: data.id,
    workspaceId: data.workspace_id,
    companyName: data.company_name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    status: data.status,
    channel: data.channel,
    memo: data.memo,
    tags: data.tags,
    lostReason: data.lost_reason,
    lostFeedback: data.lost_feedback,
    reminder: data.reminder,
    reminderNote: data.reminder_note,
    nextMeeting: data.next_meeting,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ lead });
}

/**
 * PATCH /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateLeadSchema.safeParse({ ...body, id: leadId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // camelCase → snake_case
    const updateData: Record<string, unknown> = {};
    if (input.companyName !== undefined) updateData.company_name = input.companyName;
    if (input.contactPerson !== undefined) updateData.contact_person = input.contactPerson;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.channel !== undefined) updateData.channel = input.channel;
    if (input.memo !== undefined) updateData.memo = input.memo;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.lostReason !== undefined) updateData.lost_reason = input.lostReason;
    if (input.lostFeedback !== undefined) updateData.lost_feedback = input.lostFeedback;
    if (input.reminder !== undefined) updateData.reminder = input.reminder;
    if (input.reminderNote !== undefined) updateData.reminder_note = input.reminderNote;
    if (input.nextMeeting !== undefined) updateData.next_meeting = input.nextMeeting;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Leads API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    const lead = {
      id: data.id,
      workspaceId: data.workspace_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      channel: data.channel,
      memo: data.memo,
      tags: data.tags,
      lostReason: data.lost_reason,
      lostFeedback: data.lost_feedback,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Leads API] Updated lead:', lead.id);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/leads/[leadId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Leads API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }

  console.log('[Leads API] Deleted lead:', leadId);
  return NextResponse.json({ success: true });
}
```

---

## 4. Context 実装

### 4.1 ファイル: `lib/contexts/LeadsContext.tsx`

```typescript
/**
 * lib/contexts/LeadsContext.tsx
 *
 * Phase 6: Leads Context
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type { Lead, LeadStatus, CreateLeadInput } from '@/lib/types/lead';

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  // CRUD
  addLead: (input: CreateLeadInput) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead | null>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  // 一括操作
  addLeads: (inputs: CreateLeadInput[]) => Promise<void>;
  // 再読み込み
  reloadLeads: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // リード一覧取得
  const loadLeads = useCallback(async () => {
    if (!workspace) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/workspaces/${workspace.id}/leads`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('[LeadsContext] Load error:', err);
      setError('リードの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // リード追加
  const addLead = useCallback(
    async (input: CreateLeadInput): Promise<Lead | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create lead');
        }

        const data = await res.json();
        setLeads((prev) => [data.lead, ...prev]);
        return data.lead;
      } catch (err) {
        console.error('[LeadsContext] Add error:', err);
        setError('リードの追加に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // リード更新
  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error('Failed to update lead');
        }

        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? data.lead : l))
        );
        return data.lead;
      } catch (err) {
        console.error('[LeadsContext] Update error:', err);
        setError('リードの更新に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // ステータス更新
  const updateStatus = useCallback(
    async (id: string, status: LeadStatus): Promise<void> => {
      await updateLead(id, { status });
    },
    [updateLead]
  );

  // リード削除
  const deleteLead = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to delete lead');
        }

        setLeads((prev) => prev.filter((l) => l.id !== id));
      } catch (err) {
        console.error('[LeadsContext] Delete error:', err);
        setError('リードの削除に失敗しました');
      }
    },
    [workspace]
  );

  // 一括追加
  const addLeads = useCallback(
    async (inputs: CreateLeadInput[]): Promise<void> => {
      await Promise.all(inputs.map((input) => addLead(input)));
    },
    [addLead]
  );

  // 初期読み込み
  // Note: ワークスペース変更時に呼び出す
  // useEffect は親コンポーネントで管理

  const value: LeadsContextValue = useMemo(
    () => ({
      leads,
      loading,
      error,
      addLead,
      updateLead,
      updateStatus,
      deleteLead,
      addLeads,
      reloadLeads: loadLeads,
    }),
    [leads, loading, error, addLead, updateLead, updateStatus, deleteLead, addLeads, loadLeads]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads(): LeadsContextValue {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within LeadsProvider');
  }
  return context;
}
```

---

## 5. UI コンポーネント

### 5.1 ディレクトリ構成

```
app/_components/leads/
├── index.ts              # re-export
├── LeadsManagement.tsx   # メインコンテナ
├── KanbanView.tsx        # カンバン表示
├── KanbanColumn.tsx      # カンバンカラム
├── ListView.tsx          # リスト表示
├── LeadCard.tsx          # リードカード
├── AddLeadForm.tsx       # 追加フォーム
├── LostSurveyModal.tsx   # 失注アンケート
└── SearchBar.tsx         # 検索バー
```

### 5.2 メインコンテナ: `LeadsManagement.tsx`

参照ファイルの `ProspectsManagement.tsx` パターンに従い実装。

主要機能：
- カンバン/リスト表示切り替え
- 検索フィルター
- リード追加フォーム
- ステータス変更
- 失注アンケートモーダル

---

## 6. ページ実装

### 6.1 ファイル: `app/(app)/leads/page.tsx`

```typescript
/**
 * app/(app)/leads/page.tsx
 *
 * Phase 6: Leads ページ
 */

'use client';

import { useEffect } from 'react';
import { useLeads, LeadsProvider } from '@/lib/contexts/LeadsContext';
import { LeadsManagement } from '@/app/_components/leads';

function LeadsPageContent() {
  const { leads, loading, error, reloadLeads, addLead, updateStatus, deleteLead, addLeads } = useLeads();

  useEffect(() => {
    reloadLeads();
  }, [reloadLeads]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        {error}
      </div>
    );
  }

  return (
    <LeadsManagement
      leads={leads}
      onAddLead={addLead}
      onAddLeads={addLeads}
      onUpdateStatus={updateStatus}
      onDeleteLead={deleteLead}
    />
  );
}

export default function LeadsPage() {
  return (
    <LeadsProvider>
      <LeadsPageContent />
    </LeadsProvider>
  );
}
```

---

## 7. ナビゲーション更新

### 7.1 `app/(app)/layout.tsx` に追加

```typescript
import { Users } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/leads', label: 'リード', icon: Users },  // 追加
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/settings', label: '設定', icon: Settings },
];
```

---

## 8. 実装手順

### Step 1: 型定義作成
```bash
# lib/types/lead.ts を作成
```

### Step 2: DB テーブル作成
Supabase SQL エディタで SQL を実行

### Step 3: API 実装
```bash
# app/api/workspaces/[workspaceId]/leads/route.ts
# app/api/workspaces/[workspaceId]/leads/[leadId]/route.ts
```

### Step 4: Context 実装
```bash
# lib/contexts/LeadsContext.tsx
```

### Step 5: UI コンポーネント実装
```bash
# app/_components/leads/ ディレクトリを作成
# 参照ファイルを元に実装
```

### Step 6: ページ実装
```bash
# app/(app)/leads/page.tsx
```

### Step 7: ナビゲーション更新
```bash
# app/(app)/layout.tsx を更新
```

### Step 8: ビルド・テスト
```bash
npm run build
npm run dev
# ブラウザで /leads を確認
```

---

## 9. テスト手順

### 9.1 API テスト（ブラウザコンソール）

```javascript
// ワークスペースID取得
const wsRes = await fetch('/api/workspaces');
const wsData = await wsRes.json();
const workspaceId = wsData.workspaces[0].id;

// リード追加
const addRes = await fetch(`/api/workspaces/${workspaceId}/leads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contactPerson: 'テスト太郎',
    companyName: 'テスト株式会社',
    status: 'UNCONTACTED'
  })
});
const addData = await addRes.json();
console.log('Created:', addData);

// リード一覧
const listRes = await fetch(`/api/workspaces/${workspaceId}/leads`);
const listData = await listRes.json();
console.log('Leads:', listData);
```

---

## 10. 参照ファイル

- `references/ui/leads/ProspectsManagement.tsx`
- `references/ui/leads/prospects/KanbanColumn.tsx`
- `references/ui/leads/prospects/ListView.tsx`
- `references/ui/leads/prospects/AddProspectForm.tsx`
- `references/ui/leads/NextActionSuggestion.tsx`
- `references/types/app-data.ts`

---

## 11. 次のステップ（オプション）

1. **CSVインポート** - 一括登録機能
2. **次アクション提案** - `NextActionSuggestion` コンポーネント統合
3. **履歴機能** - アクション履歴の記録・表示
4. **リマインダー** - 通知機能との連携
