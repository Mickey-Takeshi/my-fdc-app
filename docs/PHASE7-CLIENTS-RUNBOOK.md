# Phase 7: Clients（顧客）管理 ランブック

**作成日**: 2025-12-08
**前提**: Phase 6 完了（リード管理動作）

---

## 0. 概要

顧客（Clients）管理機能を実装する。リードが成約（WON）になった際にクライアントへ変換し、契約期限管理、次ミーティング管理、失注分析を実現。

### 完了チェック

- [ ] Client 型定義を作成した
- [ ] clients テーブルを作成した
- [ ] /clients ページを作成した
- [ ] クライアントカード表示ができる
- [ ] クライアント詳細編集ができる
- [ ] 契約期限警告が表示される
- [ ] 失注一覧セクションが表示される
- [ ] リード→クライアント変換（WON時）が動作する

---

## 1. 型定義

### 1.1 ファイル: `lib/types/client.ts`

```typescript
/**
 * lib/types/client.ts
 *
 * Phase 7: Clients（顧客）型定義
 */

import { z } from 'zod';

// ========================================
// クライアントステータス
// ========================================

export const ClientStatusSchema = z.enum([
  'client',           // 契約中
  'contract_expired', // 契約期限切れ
]);

export type ClientStatus = z.infer<typeof ClientStatusSchema>;

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  client: '契約中',
  contract_expired: '契約期限切れ',
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  client: '#4CAF50',
  contract_expired: '#FF5722',
};

// ========================================
// Client（顧客）型
// ========================================

export const ClientSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  // 元リードID（参照用）
  leadId: z.string().uuid().optional(),
  // 基本情報
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  // ステータス
  status: ClientStatusSchema,
  // 契約情報
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  // メモ・履歴
  notes: z.string().optional(),
  history: z.array(z.object({
    date: z.string(),
    action: z.string(),
    note: z.string().optional(),
  })).optional(),
  // 日付
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

// 履歴エントリ
export interface ClientHistoryEntry {
  date: string;
  action: string;
  note?: string;
}

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateClientSchema = z.object({
  leadId: z.string().uuid().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: ClientStatusSchema.default('client'),
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: ClientStatusSchema.optional(),
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  notes: z.string().optional(),
  history: z.array(z.object({
    date: z.string(),
    action: z.string(),
    note: z.string().optional(),
  })).optional(),
});

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ========================================
// ヘルパー関数
// ========================================

/**
 * 契約期限が近いかチェック（7日以内）
 */
export function isContractDeadlineNear(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
}

/**
 * 契約期限が過ぎているかチェック
 */
export function isContractExpired(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

/**
 * 次ミーティングが近いかチェック（3日以内）
 */
export function isNextMeetingNear(meeting: string | null | undefined): boolean {
  if (!meeting) return false;
  const meetingDate = new Date(meeting);
  const now = new Date();
  const diffDays = Math.ceil((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
}
```

---

## 2. データベース

### 2.1 テーブル作成 SQL

Supabase SQL エディタで実行：

```sql
-- clients テーブル
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  company_name TEXT,
  contact_person TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'client'
    CHECK (status IN ('client', 'contract_expired')),
  contract_deadline TIMESTAMPTZ,
  next_meeting TIMESTAMPTZ,
  notes TEXT,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_clients_workspace_id ON clients(workspace_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_contract_deadline ON clients(contract_deadline);
CREATE INDEX idx_clients_lead_id ON clients(lead_id);

-- RLS ポリシー
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ワークスペースメンバーのみアクセス可能
CREATE POLICY "clients_workspace_member_access" ON clients
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
```

---

## 3. API 実装

### 3.1 ファイル: `app/api/workspaces/[workspaceId]/clients/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/clients/route.ts
 *
 * Phase 7: Clients CRUD API
 *
 * GET  - クライアント一覧取得
 * POST - クライアント作成（リード変換含む）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateClientSchema } from '@/lib/types/client';

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
 * GET /api/workspaces/[workspaceId]/clients
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
      .from('clients')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Clients API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // snake_case → camelCase
    const clients = (data || []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      leadId: row.lead_id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      status: row.status,
      contractDeadline: row.contract_deadline,
      nextMeeting: row.next_meeting,
      notes: row.notes,
      history: row.history || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/clients
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
    const parsed = CreateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 初期履歴
    const initialHistory = [{
      date: new Date().toISOString(),
      action: '顧客登録',
      note: input.leadId ? 'リードから変換' : '新規登録',
    }];

    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        lead_id: input.leadId,
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
        status: input.status,
        contract_deadline: input.contractDeadline,
        next_meeting: input.nextMeeting,
        notes: input.notes,
        history: initialHistory,
      })
      .select()
      .single();

    if (error) {
      console.error('[Clients API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    const client = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      contractDeadline: data.contract_deadline,
      nextMeeting: data.next_meeting,
      notes: data.notes,
      history: data.history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Clients API] Created client:', client.id);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 ファイル: `app/api/workspaces/[workspaceId]/clients/[clientId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/clients/[clientId]/route.ts
 *
 * Phase 7: Client 個別操作 API
 *
 * GET    - クライアント詳細取得
 * PATCH  - クライアント更新
 * DELETE - クライアント削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateClientSchema } from '@/lib/types/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; clientId: string }>;
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
 * GET /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const client = {
    id: data.id,
    workspaceId: data.workspace_id,
    leadId: data.lead_id,
    companyName: data.company_name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    status: data.status,
    contractDeadline: data.contract_deadline,
    nextMeeting: data.next_meeting,
    notes: data.notes,
    history: data.history || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ client });
}

/**
 * PATCH /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const body = await request.json();
    const parsed = UpdateClientSchema.safeParse({ ...body, id: clientId });

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
    if (input.contractDeadline !== undefined) updateData.contract_deadline = input.contractDeadline;
    if (input.nextMeeting !== undefined) updateData.next_meeting = input.nextMeeting;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.history !== undefined) updateData.history = input.history;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      console.error('[Clients API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      );
    }

    const client = {
      id: data.id,
      workspaceId: data.workspace_id,
      leadId: data.lead_id,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      status: data.status,
      contractDeadline: data.contract_deadline,
      nextMeeting: data.next_meeting,
      notes: data.notes,
      history: data.history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[Clients API] Updated client:', client.id);
    return NextResponse.json({ client });
  } catch (error) {
    console.error('[Clients API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/clients/[clientId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, clientId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[Clients API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }

  console.log('[Clients API] Deleted client:', clientId);
  return NextResponse.json({ success: true });
}
```

### 3.3 リード→クライアント変換 API

ファイル: `app/api/workspaces/[workspaceId]/leads/[leadId]/convert/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/leads/[leadId]/convert/route.ts
 *
 * Phase 7: リード → クライアント変換 API
 *
 * POST - リードをクライアントに変換
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; leadId: string }>;
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
 * POST /api/workspaces/[workspaceId]/leads/[leadId]/convert
 *
 * リードをクライアントに変換
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId, leadId } = await params;

  const auth = await checkAuth(request, workspaceId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    // リード取得
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // ステータスチェック（WON でなくても変換可能だが警告）
    const isWon = lead.status === 'WON';

    // クライアント作成
    const initialHistory = [{
      date: new Date().toISOString(),
      action: '顧客登録',
      note: `リード「${lead.contact_person}」から変換`,
    }];

    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        email: lead.email,
        phone: lead.phone,
        status: 'client',
        notes: lead.memo,
        history: initialHistory,
      })
      .select()
      .single();

    if (insertError || !client) {
      console.error('[Convert API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    // リードのステータスを WON に更新（まだでなければ）
    if (!isWon) {
      await supabase
        .from('leads')
        .update({ status: 'WON' })
        .eq('id', leadId);
    }

    const result = {
      id: client.id,
      workspaceId: client.workspace_id,
      leadId: client.lead_id,
      companyName: client.company_name,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone,
      status: client.status,
      contractDeadline: client.contract_deadline,
      nextMeeting: client.next_meeting,
      notes: client.notes,
      history: client.history || [],
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    };

    console.log('[Convert API] Converted lead to client:', result.id);
    return NextResponse.json({ client: result }, { status: 201 });
  } catch (error) {
    console.error('[Convert API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. Context 実装

### 4.1 ファイル: `lib/contexts/ClientsContext.tsx`

```typescript
/**
 * lib/contexts/ClientsContext.tsx
 *
 * Phase 7: Clients Context
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
import type { Client, ClientStatus, CreateClientInput, ClientHistoryEntry } from '@/lib/types/client';

interface ClientsContextValue {
  clients: Client[];
  loading: boolean;
  error: string | null;
  // CRUD
  addClient: (input: CreateClientInput) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<void>;
  // リード変換
  convertLead: (leadId: string) => Promise<Client | null>;
  // 履歴追加
  addHistory: (id: string, entry: ClientHistoryEntry) => Promise<void>;
  // 再読み込み
  reloadClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // クライアント一覧取得
  const loadClients = useCallback(async () => {
    if (!workspace) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspace.id}/clients`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('[ClientsContext] Load error:', err);
      setError('クライアントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ワークスペース変更時に読み込み
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // クライアント追加
  const addClient = useCallback(
    async (input: CreateClientInput): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create client');
        }

        const data = await res.json();
        setClients((prev) => [data.client, ...prev]);
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Add error:', err);
        setError('クライアントの追加に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // クライアント更新
  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error('Failed to update client');
        }

        const data = await res.json();
        setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Update error:', err);
        setError('クライアントの更新に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // クライアント削除
  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/clients/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to delete client');
        }

        setClients((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('[ClientsContext] Delete error:', err);
        setError('クライアントの削除に失敗しました');
      }
    },
    [workspace]
  );

  // リード変換
  const convertLead = useCallback(
    async (leadId: string): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/leads/${leadId}/convert`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!res.ok) {
          throw new Error('Failed to convert lead');
        }

        const data = await res.json();
        setClients((prev) => [data.client, ...prev]);
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Convert error:', err);
        setError('リードの変換に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // 履歴追加
  const addHistory = useCallback(
    async (id: string, entry: ClientHistoryEntry): Promise<void> => {
      const client = clients.find((c) => c.id === id);
      if (!client) return;

      const newHistory = [...(client.history || []), entry];
      await updateClient(id, { history: newHistory });
    },
    [clients, updateClient]
  );

  const value: ClientsContextValue = useMemo(
    () => ({
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      convertLead,
      addHistory,
      reloadClients: loadClients,
    }),
    [
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      convertLead,
      addHistory,
      loadClients,
    ]
  );

  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}

export function useClients(): ClientsContextValue {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within ClientsProvider');
  }
  return context;
}
```

---

## 5. UI コンポーネント

### 5.1 ディレクトリ構成

```
app/_components/clients/
├── index.ts                # re-export
├── ClientsManagement.tsx   # メインコンテナ
├── ClientCard.tsx          # クライアントカード
├── AddClientForm.tsx       # 追加フォーム
├── ClientEditForm.tsx      # 編集フォーム
└── LostProspectsSection.tsx # 失注分析セクション
```

### 5.2 メインコンテナ: `ClientsManagement.tsx`

参照ファイル `ClientsManagement.tsx` パターンに従い実装。

主要機能：
- クライアント一覧表示
- 契約期限切れ警告
- 新規クライアント追加
- クライアントカード展開/編集
- 失注一覧セクション（LOST リードの分析）

### 5.3 クライアントカード: `ClientCard.tsx`

参照ファイル `ClientCard.tsx` パターンに従い実装。

主要機能：
- 展開/折りたたみ
- ステータスバッジ
- 契約期限警告（7日以内、期限切れ）
- 次ミーティング警告（3日以内）
- 履歴表示
- 編集フォーム

### 5.4 失注分析: `LostProspectsSection.tsx`

参照ファイル `LostProspectsSection.tsx` パターンに従い実装。

主要機能：
- 失注理由別統計
- チャネル別統計
- 改善提案表示
- 失注リードの詳細表示

---

## 6. ページ実装

### 6.1 ファイル: `app/(app)/clients/page.tsx`

```typescript
/**
 * app/(app)/clients/page.tsx
 *
 * Phase 7: Clients ページ
 */

'use client';

import { useEffect, useState } from 'react';
import { useClients, ClientsProvider } from '@/lib/contexts/ClientsContext';
import { useLeads, LeadsProvider } from '@/lib/contexts/LeadsContext';
import { ClientsManagement } from '@/app/_components/clients';

function ClientsPageContent() {
  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    reloadClients,
    addClient,
    updateClient,
    deleteClient,
  } = useClients();

  const {
    leads,
    loading: leadsLoading,
    reloadLeads,
  } = useLeads();

  useEffect(() => {
    reloadClients();
    reloadLeads();
  }, [reloadClients, reloadLeads]);

  // LOST リードを抽出
  const lostLeads = leads.filter((lead) => lead.status === 'LOST');

  if (clientsLoading || leadsLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>;
  }

  if (clientsError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        {clientsError}
      </div>
    );
  }

  return (
    <ClientsManagement
      clients={clients}
      lostLeads={lostLeads}
      onAddClient={addClient}
      onUpdateClient={updateClient}
      onDeleteClient={deleteClient}
    />
  );
}

export default function ClientsPage() {
  return (
    <LeadsProvider>
      <ClientsProvider>
        <ClientsPageContent />
      </ClientsProvider>
    </LeadsProvider>
  );
}
```

---

## 7. リード WON 時の自動変換

### 7.1 LeadsManagement の更新

リードのステータスが WON に変更された際、クライアント変換を提案：

```typescript
// LeadsManagement.tsx 内
const handleStatusChange = async (lead: Lead, newStatus: LeadStatus | 'DELETE') => {
  if (newStatus === 'WON') {
    // クライアント変換確認モーダル表示
    setConvertModalLead(lead);
  } else if (newStatus === 'DELETE') {
    await onDeleteLead(lead.id);
  } else if (newStatus === 'LOST') {
    setLostSurveyLead(lead);
  } else {
    await onUpdateStatus(lead.id, newStatus);
  }
};
```

### 7.2 変換確認モーダル

```typescript
// ConvertToClientModal.tsx
interface ConvertToClientModalProps {
  lead: Lead;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConvertToClientModal({ lead, onConfirm, onCancel }: ConvertToClientModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>顧客に変換しますか？</h3>
        <p>
          リード「{lead.contactPerson}」を顧客として登録します。
          変換後、顧客一覧に追加されます。
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            顧客に変換
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. ナビゲーション更新

### 8.1 `app/(app)/layout.tsx` に追加

```typescript
import { Users, Briefcase } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/leads', label: 'リード', icon: Users },
  { href: '/clients', label: '顧客', icon: Briefcase },  // 追加
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/settings', label: '設定', icon: Settings },
];
```

---

## 9. 実装手順

### Step 1: 型定義作成
```bash
# lib/types/client.ts を作成
```

### Step 2: DB テーブル作成
Supabase SQL エディタで SQL を実行

### Step 3: API 実装
```bash
# app/api/workspaces/[workspaceId]/clients/route.ts
# app/api/workspaces/[workspaceId]/clients/[clientId]/route.ts
# app/api/workspaces/[workspaceId]/leads/[leadId]/convert/route.ts
```

### Step 4: Context 実装
```bash
# lib/contexts/ClientsContext.tsx
```

### Step 5: UI コンポーネント実装
```bash
# app/_components/clients/ ディレクトリを作成
# 参照ファイルを元に実装
```

### Step 6: ページ実装
```bash
# app/(app)/clients/page.tsx
```

### Step 7: ナビゲーション更新
```bash
# app/(app)/layout.tsx を更新
```

### Step 8: リード変換機能追加
```bash
# LeadsManagement.tsx に変換モーダル追加
```

### Step 9: ビルド・テスト
```bash
npm run build
npm run dev
# ブラウザで /clients を確認
```

---

## 10. テスト手順

### 10.1 API テスト（ブラウザコンソール）

```javascript
// ワークスペースID取得
const wsRes = await fetch('/api/workspaces');
const wsData = await wsRes.json();
const workspaceId = wsData.workspaces[0].id;

// クライアント追加
const addRes = await fetch(`/api/workspaces/${workspaceId}/clients`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contactPerson: 'テスト太郎',
    companyName: 'テスト株式会社',
    status: 'client'
  })
});
const addData = await addRes.json();
console.log('Created:', addData);

// クライアント一覧
const listRes = await fetch(`/api/workspaces/${workspaceId}/clients`);
const listData = await listRes.json();
console.log('Clients:', listData);

// リード変換テスト
const leadId = 'リードのID';
const convertRes = await fetch(`/api/workspaces/${workspaceId}/leads/${leadId}/convert`, {
  method: 'POST'
});
const convertData = await convertRes.json();
console.log('Converted:', convertData);
```

### 10.2 UI テスト

1. `/clients` ページにアクセス
2. 「新規顧客追加」でクライアント作成
3. クライアントカード展開・編集
4. 契約期限設定・警告表示確認
5. `/leads` で WON 変更 → 変換確認

---

## 11. 参照ファイル

- `references/ui/clients/ClientsManagement.tsx`
- `references/ui/clients/clients/AddClientForm.tsx`
- `references/ui/clients/clients/ClientCard.tsx`
- `references/ui/clients/clients/ClientEditForm.tsx`
- `references/ui/clients/clients/LostProspectsSection.tsx`
- `references/types/app-data.ts`

---

## 12. 次のステップ（オプション）

1. **契約更新通知** - 期限前のリマインダー
2. **顧客分析ダッシュボード** - 契約状況のグラフ化
3. **履歴詳細** - アクション履歴の詳細管理
4. **PDF/CSV エクスポート** - 顧客一覧出力
