# Phase 62: AI Strategy

> FDC Modular Starter - AI Integration: Strategy & Architecture

---

## 1. AI Use Case Evaluation

### 1.1 FDC SaaS における AI 活用候補

| # | ユースケース | 説明 | 顧客価値 | 実装複雑度 | コスト | 優先度 |
|---|-------------|------|---------|-----------|--------|--------|
| 1 | **タスク自動生成** | ミーティングメモやドキュメントからタスクを抽出 | 高 | 中 | 中 | P1 |
| 2 | **OKR 提案** | AI によるOKR目標・Key Result の推薦 | 高 | 中 | 中 | P2 |
| 3 | **ブランド戦略分析** | 競合・市場分析に基づく戦略提案 | 中 | 高 | 高 | P3 |
| 4 | **ドキュメント要約** | 長文ドキュメントの要約生成 | 中 | 低 | 低 | P4 |
| 5 | **チャットボットサポート** | アプリ内 Q&A サポート | 低 | 高 | 高 | P5 |

### 1.2 各ユースケース詳細

#### P1: タスク自動生成（高優先度）

```
入力: ミーティングメモ / ドキュメントテキスト
出力: 構造化タスクリスト（タイトル、説明、4象限分類、期限）
期待効果: タスク作成時間を70%削減
```

**対象機能との連携**:
- Phase 9 タスク管理（4象限）への直接投入
- Phase 10 Action Map の ActionItem 自動生成
- Phase 14 Google Tasks との同期

#### P2: OKR 提案（中優先度）

```
入力: 事業目標テキスト / 既存OKR / 業界データ
出力: Objective + Key Results の候補セット
期待効果: OKR設定の質を向上、設定時間を50%削減
```

**対象機能との連携**:
- Phase 11 OKR 管理への直接投入
- Phase 10 Action Map との紐付け提案

#### P3: ブランド戦略分析（中優先度）

```
入力: ブランド戦略10ポイント / 競合情報 / 市場データ
出力: SWOT分析 + 改善提案 + ポジショニング提案
期待効果: 戦略策定の精度向上
```

**対象機能との連携**:
- Phase 15 Brand Strategy の分析補助
- Phase 16 Lean Canvas の検証

#### P4: ドキュメント要約（低優先度）

```
入力: 長文テキスト（議事録、レポート等）
出力: 要約テキスト（箇条書き / 段落形式）
期待効果: 情報取得時間の削減
```

#### P5: チャットボットサポート（低優先度）

```
入力: ユーザーの質問テキスト
出力: ヘルプドキュメントに基づく回答
期待効果: サポートコスト削減、24/7対応
技術要件: RAG（Retrieval-Augmented Generation）が必要
```

---

## 2. LLM Provider 比較

### 2.1 プロバイダー比較表

| 項目 | OpenAI GPT-4o | Anthropic Claude 3.5 Sonnet | Google Gemini | Groq Llama 3 |
|------|--------------|----------------------------|---------------|--------------|
| **入力料金** | $2.50/1M tokens | $3.00/1M tokens | $1.25/1M tokens | $0.59/1M tokens |
| **出力料金** | $10.00/1M tokens | $15.00/1M tokens | $5.00/1M tokens | $0.79/1M tokens |
| **コンテキスト長** | 128K | 200K | 1M | 8K |
| **ストリーミング** | Yes | Yes | Yes | Yes |
| **Structured Output** | Yes | Yes | Yes | 限定的 |
| **日本語性能** | 優秀 | 優秀 | 良好 | 普通 |
| **コード生成** | 優秀 | 最優秀 | 良好 | 良好 |
| **推論能力** | 優秀 | 最優秀 | 良好 | 普通 |
| **レスポンス速度** | 速い | 速い | 速い | 最速 |
| **API安定性** | 高い | 高い | 中程度 | 中程度 |
| **SDK成熟度** | 最高 | 高い | 中程度 | 低い |
| **Vercel AI SDK対応** | Yes | Yes | Yes | Yes |

### 2.2 FDC 適合性評価

| ユースケース | OpenAI GPT-4o | Claude 3.5 Sonnet | Gemini | Groq Llama 3 |
|-------------|--------------|-------------------|--------|--------------|
| タスク自動生成 | A | **S** | B | B |
| OKR提案 | A | **S** | B | C |
| ブランド戦略分析 | A | **S** | B | C |
| ドキュメント要約 | A | A | **S** | B |
| チャットボットサポート | A | **S** | B | B |
| **総合評価** | **A** | **S** | **B** | **B** |

### 2.3 選定結果

```
メインプロバイダー:  Anthropic Claude 3.5 Sonnet
  - 理由: 推論能力・日本語性能が最高、FDCプロジェクトの技術スタックと親和性が高い
  - Vercel AI SDK との統合が容易
  - Structured Output のサポートが充実

フォールバック:       OpenAI GPT-4o
  - 理由: API安定性が高く、SDK成熟度が最高
  - Claude 障害時の代替として十分な品質
  - 広範なドキュメントとコミュニティサポート
```

---

## 3. コスト見積もり

### 3.1 FDC ユースケース別コスト試算

| ユースケース | 想定リクエスト/月 | 平均入力トークン | 平均出力トークン | 月額コスト（Claude） |
|-------------|------------------|----------------|----------------|-------------------|
| タスク自動生成 | 500 | 2,000 | 500 | $3.75 |
| OKR提案 | 100 | 3,000 | 1,000 | $1.80 |
| ブランド戦略分析 | 50 | 5,000 | 2,000 | $2.25 |
| ドキュメント要約 | 200 | 4,000 | 800 | $4.80 |
| チャットボットサポート | 300 | 1,000 | 500 | $3.15 |
| **合計** | **1,150** | - | - | **$15.75/月** |

### 3.2 スケーリング時のコスト予測

| ユーザー数 | リクエスト/月 | 月額コスト | ユーザーあたり |
|-----------|-------------|-----------|--------------|
| 10 | 1,150 | $15.75 | $1.58 |
| 100 | 11,500 | $157.50 | $1.58 |
| 1,000 | 115,000 | $1,575.00 | $1.58 |
| 10,000 | 1,150,000 | $15,750.00 | $1.58 |

> キャッシュ戦略（Phase 63）により、実際のコストは上記の50-70%に抑えられる見込み。

---

## 4. アーキテクチャ設計

### 4.1 全体構成図

```
+------------------+     +-------------------+     +--------------------+
|                  |     |                   |     |                    |
|  Client          |     |  Next.js API      |     |  LLM Provider      |
|  (React)         |---->|  Route            |---->|                    |
|                  |     |                   |     |  - Anthropic Claude |
|  - useChat       |     |  /api/ai/*        |     |  - OpenAI (fallback)|
|  - useCompletion |     |                   |     |                    |
|                  |<----|  SSE streaming    |<----|                    |
+------------------+     +-------------------+     +--------------------+
                               |       |
                               |       |
                          +----v----+  +v-----------+
                          |         |  |             |
                          |  Cache  |  |  Vector DB  |
                          |  Layer  |  |  (optional) |
                          |         |  |             |
                          | Redis / |  | Supabase    |
                          | KV      |  | pgvector    |
                          +---------+  +-------------+
```

### 4.2 レイヤー構成

```
+-----------------------------------------------+
| Presentation Layer                             |
|  - React Components (useChat, useCompletion)   |
|  - Loading/Streaming UI                        |
+-----------------------------------------------+
| API Layer                                      |
|  - Next.js API Routes (/api/ai/*)              |
|  - Authentication & Rate Limiting              |
|  - Input Validation & Sanitization             |
+-----------------------------------------------+
| AI Service Layer                               |
|  - Provider Abstraction (ai-provider.ts)       |
|  - Prompt Management (prompts/*.ts)            |
|  - Response Processing                         |
+-----------------------------------------------+
| Infrastructure Layer                           |
|  - LLM Provider SDK (Vercel AI SDK)            |
|  - Cache Layer (Vercel KV / Redis)             |
|  - Vector DB (Supabase pgvector) [optional]    |
+-----------------------------------------------+
```

### 4.3 ファイル構成（予定）

```
lib/
  ai/
    providers/
      anthropic.ts        # Anthropic Claude プロバイダー
      openai.ts           # OpenAI フォールバック
      index.ts            # プロバイダー抽象化
    prompts/
      task-extraction.ts  # タスク抽出プロンプト
      okr-suggestion.ts   # OKR提案プロンプト
      brand-analysis.ts   # ブランド戦略分析プロンプト
      summarization.ts    # 要約プロンプト
      support-chat.ts     # サポートチャットプロンプト
    schemas/
      task.ts             # タスク抽出スキーマ (Zod)
      okr.ts              # OKR提案スキーマ (Zod)
      brand.ts            # ブランド分析スキーマ (Zod)
    cache.ts              # キャッシュ層
    rate-limiter.ts       # レート制限
    cost-monitor.ts       # コスト監視
    fallback.ts           # フォールバック制御
app/
  api/
    ai/
      chat/route.ts       # チャット API
      extract/route.ts    # タスク抽出 API
      suggest/route.ts    # OKR提案 API
      analyze/route.ts    # ブランド分析 API
      summarize/route.ts  # 要約 API
```

---

## 5. 設計原則

### 5.1 プロバイダー抽象化

```typescript
// lib/ai/providers/index.ts
// Vercel AI SDK を使用してプロバイダーを抽象化
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// デフォルトモデル設定
export const defaultModel = anthropic('claude-sonnet-4-20250514');
export const fallbackModel = openai('gpt-4o');
```

### 5.2 レート制限

```typescript
// ユーザーあたりのレート制限設定
const RATE_LIMITS = {
  free: {
    requestsPerMinute: 5,
    requestsPerDay: 50,
    tokensPerDay: 50_000,
  },
  pro: {
    requestsPerMinute: 20,
    requestsPerDay: 500,
    tokensPerDay: 500_000,
  },
  enterprise: {
    requestsPerMinute: 60,
    requestsPerDay: 5_000,
    tokensPerDay: 5_000_000,
  },
} as const;
```

### 5.3 フォールバック戦略

```typescript
// フォールバック制御
// 連続3回の失敗でフォールバックプロバイダーに切り替え
const FALLBACK_CONFIG = {
  maxConsecutiveFailures: 3,
  fallbackDurationMs: 5 * 60 * 1000, // 5分間フォールバック
  healthCheckIntervalMs: 30 * 1000,   // 30秒ごとにヘルスチェック
};
```

### 5.4 コスト監視

```typescript
// コスト監視設定
const COST_MONITORING = {
  dailyBudgetUSD: 50,
  warningThreshold: 0.8,  // 80%で警告
  alertThreshold: 0.95,   // 95%でアラート
  hardLimitThreshold: 1.0, // 100%で停止
};
```

---

## 6. 環境変数

### 6.1 必須環境変数

```bash
# AI Provider Keys
ANTHROPIC_API_KEY=sk-ant-api03-...     # Anthropic Claude API キー
OPENAI_API_KEY=sk-proj-...              # OpenAI API キー（フォールバック用）
```

### 6.2 オプション環境変数

```bash
# AI Configuration
AI_DEFAULT_PROVIDER=anthropic           # デフォルトプロバイダー（anthropic / openai）
AI_DEFAULT_MODEL=claude-sonnet-4-20250514  # デフォルトモデル
AI_MAX_TOKENS=4096                      # 最大出力トークン数
AI_TEMPERATURE=0.7                      # デフォルト温度パラメータ

# Cost Control
AI_DAILY_BUDGET_USD=50                  # 日次予算（USD）
AI_RATE_LIMIT_RPM=20                    # レート制限（リクエスト/分）

# Cache
AI_CACHE_TTL_SECONDS=86400              # キャッシュ TTL（秒）
```

### 6.3 .env.example への追記

```bash
# --- AI Integration (Phase 62) ---
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AI_DEFAULT_PROVIDER=anthropic
AI_DAILY_BUDGET_USD=50
```

---

## 7. プロンプト設計ガイドライン

### 7.1 ファイル命名規則

```
lib/ai/prompts/
  {feature-name}.ts    # 機能名をケバブケースで

例:
  task-extraction.ts
  okr-suggestion.ts
  brand-analysis.ts
  summarization.ts
  support-chat.ts
```

### 7.2 テンプレート構造

```typescript
// lib/ai/prompts/task-extraction.ts
export const taskExtractionPrompt = {
  system: `あなたはプロジェクトマネジメントの専門家です。
ユーザーが提供するテキストからタスクを抽出し、
アイゼンハワーマトリクスの4象限に分類してください。

## 出力ルール
- 各タスクにはタイトル、説明、4象限分類、推定期限を含める
- 4象限: urgent_important, not_urgent_important, urgent_not_important, not_urgent_not_important
- 期限は具体的な日付がない場合は相対的な期限（例: 1週間以内）を推定する
- 日本語で出力すること`,

  user: (input: string) => `以下のテキストからタスクを抽出してください:\n\n${input}`,
};
```

### 7.3 プロンプトカタログ（FDC 機能別）

| 機能 | プロンプトファイル | System Prompt の役割 | 出力形式 |
|------|------------------|--------------------|---------|
| タスク抽出 | `task-extraction.ts` | PM専門家 + 4象限分類 | Structured (Zod) |
| OKR提案 | `okr-suggestion.ts` | OKRコーチ + SMART原則 | Structured (Zod) |
| ブランド分析 | `brand-analysis.ts` | 戦略コンサルタント + SWOT | Structured (Zod) |
| 要約 | `summarization.ts` | エディター + 箇条書き | テキスト |
| サポートチャット | `support-chat.ts` | ヘルプデスク + FDCナレッジ | テキスト (Streaming) |

### 7.4 プロンプト設計のベストプラクティス

1. **役割の明確化**: System Prompt で AI の役割を明確に定義
2. **出力形式の指定**: JSON Schema / Zod スキーマで出力形式を厳密に定義
3. **Few-shot Examples**: 具体例を含めて出力品質を向上
4. **日本語対応**: 日本語での出力を明示的に指示
5. **制約条件の明記**: 文字数制限、禁止事項を明記
6. **バージョン管理**: プロンプトの変更履歴を管理

---

## 8. 実装チェックリスト

### Phase 62 完了条件

- [ ] AI Strategy ドキュメント作成（本ファイル）
- [ ] ユースケース評価完了
- [ ] LLM プロバイダー選定完了
- [ ] コスト見積もり完了
- [ ] アーキテクチャ設計完了
- [ ] プロンプト設計ガイドライン策定
- [ ] 環境変数定義
- [ ] FDC-CORE.md 更新

### 次フェーズへの引き継ぎ事項

- Phase 63: ストリーミング、RAG、Structured Output、キャッシュの実装設計
- Phase 64: UX/安全性設計（ローディング、エラーハンドリング、コンテンツフィルタリング）

---

**Last Updated**: 2026-03-05
**Phase**: 62
**Status**: AI Strategy 策定完了
