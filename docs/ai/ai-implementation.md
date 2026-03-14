# Phase 63: AI Implementation Design

> FDC Modular Starter - AI Integration: Implementation Details (Streaming, RAG, Structured Output, Cache)

---

## 1. ストリーミング設計

### 1.1 対象機能とストリーミング方式

| 機能 | 方式 | 理由 |
|------|------|------|
| **チャットサポート** | Streaming | リアルタイムの対話体験が必要 |
| **ドキュメント要約** | Streaming | 長文生成のため段階的表示が UX 向上 |
| **ブランド戦略分析** | Streaming | 分析レポートが長文になるため |
| **タスク抽出** | Non-streaming | 構造化データを一括で返す必要がある |
| **OKR提案** | Non-streaming | 構造化データを一括で返す必要がある |

### 1.2 ストリーミングフロー図

```
+----------------+    +-----------------+    +------------------+
| User Input     |    | API Route       |    | LLM Provider     |
|                |--->| /api/ai/chat    |--->| (Anthropic)      |
| テキスト入力    |    |                 |    |                  |
|                |    | streamText()    |    | Claude 3.5 Sonnet|
+----------------+    +-----------------+    +------------------+
                            |                       |
                            |   SSE (Server-Sent     |
                            |   Events)              |
                            |<----------------------|
                            |                       |
+----------------+    +-----v-----------+
| Client Display |    | SSE Stream      |
|                |<---| text delta      |
| 逐次テキスト    |    | chunks          |
| 表示           |    |                 |
+----------------+    +-----------------+
```

### 1.3 実装アプローチ: Vercel AI SDK

#### サーバーサイド（API Route）

```typescript
// app/api/ai/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'あなたはFDCアプリのサポートアシスタントです。',
    messages,
    maxTokens: 2048,
  });

  return result.toDataStreamResponse();
}
```

#### クライアントサイド（React コンポーネント）

```typescript
// コンポーネント内での使用例
'use client';

import { useChat } from '@ai-sdk/react';

export function SupportChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong>
          <p>{m.content}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>
          送信
        </button>
      </form>
    </div>
  );
}
```

#### 要約（useCompletion）

```typescript
// コンポーネント内での使用例
'use client';

import { useCompletion } from '@ai-sdk/react';

export function DocumentSummarizer() {
  const { completion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
    api: '/api/ai/summarize',
  });

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>
          要約する
        </button>
      </form>
      {completion && <div>{completion}</div>}
    </div>
  );
}
```

---

## 2. RAG（Retrieval-Augmented Generation）設計

### 2.1 RAG 対象

| 対象 | 用途 | データソース | 更新頻度 |
|------|------|------------|---------|
| **ヘルプドキュメント** | サポートチャット | docs/ 配下の MD ファイル | デプロイ時 |
| **ブランド戦略ドキュメント** | 戦略分析の補助情報 | ユーザーアップロード資料 | ユーザー操作時 |

### 2.2 RAG パイプライン図

```
+-------------+    +-----------+    +-------------+    +--------------+
| Document    |    | Chunk     |    | Embedding   |    | Vector DB    |
| (MD/PDF)    |--->| Splitter  |--->| Model       |--->| (pgvector)   |
|             |    |           |    |             |    |              |
| 原文        |    | 500文字    |    | text-       |    | Supabase     |
|             |    | チャンク   |    | embedding-  |    | pgvector     |
|             |    |           |    | 3-small     |    |              |
+-------------+    +-----------+    +-------------+    +--------------+

                   検索時フロー:

+-------------+    +-------------+    +--------------+    +-----------+
| User Query  |    | Embedding   |    | Similarity   |    | LLM       |
|             |--->| Model       |--->| Search       |--->| + Context |
| 質問テキスト |    |             |    | (cosine)     |    |           |
|             |    | text-       |    | Top-K = 5    |    | 回答生成   |
|             |    | embedding-  |    |              |    |           |
|             |    | 3-small     |    | pgvector     |    |           |
+-------------+    +-------------+    +--------------+    +-----------+
```

### 2.3 Embedding モデル選定

| モデル | プロバイダー | 次元数 | 料金 | 性能 | 推奨 |
|--------|------------|--------|------|------|------|
| **text-embedding-3-small** | OpenAI | 1536 | $0.02/1M tokens | 良好 | **推奨** |
| text-embedding-3-large | OpenAI | 3072 | $0.13/1M tokens | 最高 | コスト高 |
| embed-multilingual-v3 | Cohere | 1024 | $0.10/1M tokens | 良好 | 多言語特化 |

**選定理由**: `text-embedding-3-small`
- コスト効率が最も高い（$0.02/1M tokens）
- 1536次元で十分な精度
- OpenAI SDK で統一的に利用可能
- 日本語にも対応

### 2.4 Vector DB 選定

| DB | 特徴 | 料金 | FDC適合性 |
|----|------|------|----------|
| **Supabase pgvector** | PostgreSQL 拡張 | 既存DB利用（追加料金なし） | **最適** |
| Pinecone | 専用 Vector DB | $70~/月 | オーバースペック |
| Weaviate | OSS Vector DB | セルフホスト必要 | 運用負荷 |
| Chroma | 軽量 Vector DB | 無料（OSS） | 永続化に懸念 |

**選定理由**: `Supabase pgvector`
- 既存の Supabase インフラを活用（追加コストなし）
- PostgreSQL の RLS と統合可能（テナント分離）
- SQL でクエリ可能（運用が容易）
- FDC の既存データモデルとの親和性が高い

### 2.5 テーブル設計

```sql
-- Vector Store テーブル
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- pgvector インデックス
CREATE INDEX ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS ポリシー（テナント分離）
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON documents
  FOR ALL USING (workspace_id = current_workspace_id());
```

### 2.6 チャンク設計

| パラメータ | 値 | 理由 |
|-----------|-----|------|
| **チャンクサイズ** | 500文字 | 日本語1文字 = 約1.5トークン、コスト効率と検索精度のバランス |
| **オーバーラップ** | 50文字 | チャンク境界での文脈喪失を防止 |
| **分割方式** | 段落ベース | Markdown の見出し・段落構造を尊重 |
| **メタデータ** | タイトル、セクション、ファイルパス | 検索結果のフィルタリングに利用 |

```typescript
// チャンク分割の実装イメージ
interface Chunk {
  content: string;
  metadata: {
    source: string;      // ファイルパス
    title: string;       // ドキュメントタイトル
    section: string;     // セクション名
    chunkIndex: number;  // チャンク番号
  };
}

function splitDocument(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
): Chunk[] {
  // 段落ベースで分割し、chunkSize を超える場合はさらに分割
  // overlap 文字分を前のチャンクから引き継ぐ
  // ...
}
```

---

## 3. Structured Output 設計

### 3.1 対象機能

| 機能 | 出力形式 | スキーマ定義 |
|------|---------|------------|
| **タスク抽出** | `Task[]` | Zod Schema |
| **OKR提案** | `{ objective: string, keyResults: KeyResult[] }` | Zod Schema |
| **ブランド分析** | `{ swot: SWOT, recommendations: string[] }` | Zod Schema |

### 3.2 Zod スキーマ定義

```typescript
// lib/ai/schemas/task.ts
import { z } from 'zod/v4';

export const extractedTaskSchema = z.object({
  title: z.string().describe('タスクのタイトル'),
  description: z.string().describe('タスクの詳細説明'),
  quadrant: z.enum([
    'urgent_important',
    'not_urgent_important',
    'urgent_not_important',
    'not_urgent_not_important',
  ]).describe('アイゼンハワーマトリクスの4象限分類'),
  estimatedDueDate: z.string().nullable().describe('推定期限（ISO 8601形式）'),
  priority: z.enum(['high', 'medium', 'low']).describe('優先度'),
});

export const taskExtractionResultSchema = z.object({
  tasks: z.array(extractedTaskSchema).describe('抽出されたタスクリスト'),
  summary: z.string().describe('抽出元テキストの要約'),
  totalTasks: z.number().describe('抽出されたタスク数'),
});

export type ExtractedTask = z.infer<typeof extractedTaskSchema>;
export type TaskExtractionResult = z.infer<typeof taskExtractionResultSchema>;
```

```typescript
// lib/ai/schemas/okr.ts
import { z } from 'zod/v4';

export const keyResultSchema = z.object({
  title: z.string().describe('Key Result のタイトル'),
  targetValue: z.number().describe('目標値'),
  unit: z.string().describe('単位（%、件、円 等）'),
  rationale: z.string().describe('設定根拠'),
});

export const okrSuggestionSchema = z.object({
  objective: z.string().describe('Objective のタイトル'),
  objectiveRationale: z.string().describe('Objective の設定根拠'),
  keyResults: z.array(keyResultSchema).min(2).max(5).describe('Key Results（2-5個）'),
  relatedActionMaps: z.array(z.string()).describe('関連する Action Map の提案'),
});

export const okrSuggestionResultSchema = z.object({
  suggestions: z.array(okrSuggestionSchema).min(1).max(3).describe('OKR提案（1-3セット）'),
  analysisNotes: z.string().describe('分析メモ'),
});

export type OKRSuggestion = z.infer<typeof okrSuggestionSchema>;
export type OKRSuggestionResult = z.infer<typeof okrSuggestionResultSchema>;
```

```typescript
// lib/ai/schemas/brand.ts
import { z } from 'zod/v4';

export const swotSchema = z.object({
  strengths: z.array(z.string()).describe('強み'),
  weaknesses: z.array(z.string()).describe('弱み'),
  opportunities: z.array(z.string()).describe('機会'),
  threats: z.array(z.string()).describe('脅威'),
});

export const brandAnalysisSchema = z.object({
  swot: swotSchema.describe('SWOT分析'),
  positioningStatement: z.string().describe('ポジショニングステートメント'),
  recommendations: z.array(z.string()).describe('改善提案（優先度順）'),
  competitiveAdvantage: z.string().describe('競合優位性の分析'),
  riskFactors: z.array(z.string()).describe('リスク要因'),
});

export type BrandAnalysis = z.infer<typeof brandAnalysisSchema>;
```

### 3.3 generateObject の使用

```typescript
// app/api/ai/extract/route.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { taskExtractionResultSchema } from '@/lib/ai/schemas/task';

export async function POST(req: Request) {
  const { text } = await req.json();

  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: taskExtractionResultSchema,
    prompt: `以下のテキストからタスクを抽出し、アイゼンハワーマトリクスの4象限に分類してください。\n\n${text}`,
  });

  return Response.json(result.object);
}
```

```typescript
// app/api/ai/suggest/route.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { okrSuggestionResultSchema } from '@/lib/ai/schemas/okr';

export async function POST(req: Request) {
  const { businessGoals, existingOkrs } = await req.json();

  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: okrSuggestionResultSchema,
    prompt: `以下の事業目標と既存OKRに基づいて、新しいOKRを提案してください。

## 事業目標
${businessGoals}

## 既存OKR
${JSON.stringify(existingOkrs, null, 2)}`,
  });

  return Response.json(result.object);
}
```

---

## 4. キャッシュ戦略

### 4.1 キャッシュ対象

| 対象 | キャッシュ | TTL | 理由 |
|------|----------|-----|------|
| **定型的な質問への回答** | する | 24時間 | 同一質問は同一回答で十分 |
| **ドキュメント要約** | する | 1時間 | 同一ドキュメントの要約は変わらない |
| **ヘルプドキュメント検索** | する | 24時間 | ドキュメントの更新頻度が低い |
| **ユーザー固有の分析** | しない | - | パーソナライズされた回答が必要 |
| **タスク抽出** | しない | - | 入力テキストが毎回異なる |
| **OKR提案** | しない | - | コンテキストが毎回異なる |

### 4.2 キャッシュキー設計

```
キー形式: {feature}:{hash(input)}:{model}

例:
  summarize:a1b2c3d4:claude-3-5-sonnet
  help-search:e5f6g7h8:claude-3-5-sonnet
  faq:i9j0k1l2:claude-3-5-sonnet
```

```typescript
// lib/ai/cache.ts
import { createHash } from 'crypto';

interface CacheConfig {
  ttlSeconds: number;
  prefix: string;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  summarize: { ttlSeconds: 3600, prefix: 'summarize' },      // 1時間
  'help-search': { ttlSeconds: 86400, prefix: 'help-search' }, // 24時間
  faq: { ttlSeconds: 86400, prefix: 'faq' },                  // 24時間
};

export function generateCacheKey(
  feature: string,
  input: string,
  model: string,
): string {
  const inputHash = createHash('sha256')
    .update(input)
    .digest('hex')
    .slice(0, 16);
  return `ai:${feature}:${inputHash}:${model}`;
}

export async function getCachedResponse(key: string): Promise<string | null> {
  // Vercel KV / Redis から取得
  // 実装時に KV クライアントを注入
  return null;
}

export async function setCachedResponse(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  // Vercel KV / Redis に保存
  // 実装時に KV クライアントを注入
}
```

### 4.3 セマンティックキャッシュ

```
通常キャッシュ:
  "FDCの使い方を教えて" -> キャッシュミス
  "FDCの使い方を教えてください" -> キャッシュミス（別のキー）

セマンティックキャッシュ:
  "FDCの使い方を教えて" -> キャッシュミス -> 回答生成 + embedding保存
  "FDCの使い方を教えてください" -> 類似度検索 -> キャッシュヒット（類似度 > 0.95）
```

```typescript
// セマンティックキャッシュの概念実装
async function semanticCacheLookup(
  query: string,
  threshold: number = 0.95,
): Promise<string | null> {
  // 1. クエリの embedding を生成
  const queryEmbedding = await generateEmbedding(query);

  // 2. Vector DB で類似キャッシュを検索
  const { data } = await supabase.rpc('match_cache', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: 1,
  });

  // 3. 類似度が閾値以上ならキャッシュヒット
  if (data && data.length > 0) {
    return data[0].response;
  }

  return null;
}
```

---

## 5. コスト最適化戦略

### 5.1 最適化手法一覧

| 手法 | 削減率 | 実装難度 | 優先度 |
|------|--------|---------|--------|
| **レスポンスキャッシュ** | 30-50% | 低 | P1 |
| **軽量モデルの選択的使用** | 40-60% | 低 | P1 |
| **プロンプト最適化** | 10-20% | 中 | P2 |
| **バッチ処理** | 20-30% | 中 | P2 |
| **セマンティックキャッシュ** | 10-20% | 高 | P3 |

### 5.2 軽量モデルの選択的使用

```typescript
// タスクの複雑度に応じてモデルを選択
function selectModel(task: string, complexity: 'low' | 'medium' | 'high') {
  switch (complexity) {
    case 'low':
      // 簡単なタスク: Claude 3.5 Haiku（安価・高速）
      return anthropic('claude-3-5-haiku-20241022');
    case 'medium':
      // 中程度のタスク: Claude 3.5 Sonnet
      return anthropic('claude-sonnet-4-20250514');
    case 'high':
      // 複雑なタスク: Claude 3.5 Sonnet（高精度設定）
      return anthropic('claude-sonnet-4-20250514');
  }
}
```

### 5.3 プロンプト最適化

```
最適化前（350 tokens）:
  "あなたはプロジェクトマネジメントの専門家です。以下のテキストを読んで、
   そこに含まれているタスクを見つけて抽出してください。各タスクについて、
   タイトルと説明と4象限分類と期限を設定してください..."

最適化後（180 tokens）:
  "PMとしてテキストからタスクを抽出。各タスクに: タイトル、説明、
   4象限(urgent_important等)、期限を付与。日本語出力。"
```

### 5.4 バッチ処理

```typescript
// 複数ドキュメントの要約をバッチ処理
async function batchSummarize(documents: string[]): Promise<string[]> {
  // 個別に処理する代わりに、複数ドキュメントを1リクエストにまとめる
  // ただし、コンテキスト長の制限に注意
  const combinedPrompt = documents
    .map((doc, i) => `--- Document ${i + 1} ---\n${doc}`)
    .join('\n\n');

  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      summaries: z.array(z.string()),
    }),
    prompt: `以下の${documents.length}件のドキュメントを個別に要約してください。\n\n${combinedPrompt}`,
  });

  return result.object.summaries;
}
```

---

## 6. 実装チェックリスト

### Phase 63 完了条件

- [ ] AI Implementation Design ドキュメント作成（本ファイル）
- [ ] ストリーミング設計完了
- [ ] RAG パイプライン設計完了
- [ ] Embedding モデル・Vector DB 選定完了
- [ ] Structured Output スキーマ設計完了
- [ ] キャッシュ戦略策定完了
- [ ] コスト最適化戦略策定完了
- [ ] FDC-CORE.md 更新

### 技術スタック依存関係

```
必要パッケージ:
  - ai                    # Vercel AI SDK Core
  - @ai-sdk/anthropic     # Anthropic プロバイダー
  - @ai-sdk/openai        # OpenAI プロバイダー
  - @ai-sdk/react         # React フック（useChat, useCompletion）

オプション:
  - @supabase/supabase-js # pgvector 操作（既存）
```

### 次フェーズへの引き継ぎ事項

- Phase 64: UX設計（ローディング、エラーハンドリング）と安全性設計（コンテンツフィルタリング、倫理）

---

**Last Updated**: 2026-03-05
**Phase**: 63
**Status**: AI Implementation Design 策定完了
