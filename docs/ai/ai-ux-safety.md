# Phase 64: AI UX & Safety Design

> FDC Modular Starter - AI Integration: UX Design & Safety (Loading, Error Handling, Content Filtering, Ethics)

---

## 1. ローディング UX 設計

### 1.1 ローディング表示パターン

| パターン | 使用場面 | 表示内容 | 推奨待機時間 |
|---------|---------|---------|-------------|
| **スピナー** | 短時間処理（タスク抽出等） | 回転アイコン + 処理中テキスト | 1-3秒 |
| **プログレスバー** | 長時間処理（バッチ分析等） | 進捗バー + 完了予測 | 5-30秒 |
| **タイピングインジケーター** | ストリーミング（チャット等） | 点滅ドット + 逐次テキスト表示 | リアルタイム |
| **スケルトンローダー** | データ取得中 | コンテンツ形状のプレースホルダー | 1-5秒 |

### 1.2 UX 改善施策

| 施策 | 説明 | 対象機能 |
|------|------|---------|
| **ストリーミング表示** | LLM の出力をリアルタイムで逐次表示 | チャット、要約、分析 |
| **推定処理時間表示** | 予想される処理時間を事前に表示 | タスク抽出、OKR提案 |
| **キャンセルボタン** | 処理中のリクエストを中断可能に | 全 AI 機能 |
| **スケルトンローダー** | 出力エリアの形状を事前に表示 | タスク抽出、OKR提案 |
| **段階的ローディング** | 処理ステップを段階的に表示 | ブランド分析 |

### 1.3 処理タイプ別の待機時間ガイドライン

| 処理タイプ | 想定時間 | ローディングパターン | 詳細 |
|-----------|---------|-------------------|------|
| **タスク抽出** | 2-5秒 | スピナー + スケルトン | 入力テキスト長に依存 |
| **OKR提案** | 3-8秒 | スピナー + スケルトン | 既存データの分析が必要 |
| **ブランド分析** | 5-15秒 | プログレスバー | 複数観点の分析が必要 |
| **ドキュメント要約** | 2-10秒 | タイピングインジケーター | ストリーミング表示 |
| **チャットサポート** | 1-5秒 | タイピングインジケーター | ストリーミング表示 |
| **RAG検索+回答** | 3-8秒 | スピナー -> タイピング | 検索後にストリーミング |

### 1.4 実装例

```typescript
// AI ローディング状態の管理
interface AILoadingState {
  isLoading: boolean;
  stage: 'idle' | 'preparing' | 'processing' | 'streaming' | 'complete' | 'error';
  estimatedTime?: number;  // 秒
  progress?: number;       // 0-100
  message?: string;
}

// ローディングメッセージの定義
const LOADING_MESSAGES: Record<string, string[]> = {
  'task-extraction': [
    'テキストを分析しています...',
    'タスクを抽出しています...',
    '4象限に分類しています...',
  ],
  'okr-suggestion': [
    '事業目標を分析しています...',
    'OKR候補を生成しています...',
    'Key Resultsを最適化しています...',
  ],
  'brand-analysis': [
    'ブランド戦略を分析しています...',
    'SWOT分析を実行しています...',
    '改善提案を生成しています...',
  ],
};
```

---

## 2. エラーハンドリング設計

### 2.1 エラータイプと対応

| エラータイプ | HTTPステータス | ユーザーへの表示 | 対応アクション |
|-------------|--------------|----------------|--------------|
| **レート制限** | 429 | 「リクエストが多すぎます。しばらくお待ちください」 | 自動リトライ（長めの待機） |
| **タイムアウト** | 504 | 「処理に時間がかかっています。再試行してください」 | 自動リトライ |
| **コンテンツフィルター** | 400 | 「入力内容を確認してください」 | リトライなし、入力修正を促す |
| **API エラー** | 500/502/503 | 「AI機能が一時的に利用できません」 | 自動リトライ + フォールバック |
| **認証エラー** | 401 | 「AI機能の設定を確認してください」 | リトライなし、管理者に通知 |
| **不明なエラー** | - | 「エラーが発生しました。再試行してください」 | 自動リトライ |

### 2.2 リトライ戦略

```typescript
// リトライ設定
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,

  // エラータイプ別のリトライ設定
  retryableErrors: {
    rateLimitError: {
      maxRetries: 3,
      baseDelayMs: 5000,   // レート制限は長めに待機
    },
    timeoutError: {
      maxRetries: 3,
      baseDelayMs: 2000,
    },
    serverError: {
      maxRetries: 3,
      baseDelayMs: 1000,
    },
  },

  // リトライ不可のエラー
  nonRetryableErrors: [
    'contentFilterError',
    'authenticationError',
    'invalidRequestError',
  ],
};
```

```
リトライタイミング（Exponential Backoff）:
  1回目: 1秒後
  2回目: 2秒後
  3回目: 4秒後

レート制限時:
  1回目: 5秒後
  2回目: 10秒後
  3回目: 20秒後
```

### 2.3 フォールバック戦略

```
+---------------------+
| Anthropic Claude    |
| (メインプロバイダー)  |
+----------+----------+
           |
           | 連続3回失敗
           v
+---------------------+
| OpenAI GPT-4o       |
| (フォールバック)      |
+----------+----------+
           |
           | フォールバックも失敗
           v
+---------------------+
| Graceful Degradation|
| (機能縮退)           |
|                     |
| "AI機能は現在利用     |
|  できません。手動で   |
|  操作してください"    |
+---------------------+
```

```typescript
// フォールバック制御の実装
interface ProviderHealth {
  consecutiveFailures: number;
  lastFailureAt: number | null;
  isFallback: boolean;
}

const FALLBACK_THRESHOLD = 3;  // 連続3回失敗でフォールバック
const RECOVERY_CHECK_INTERVAL = 5 * 60 * 1000;  // 5分後にメイン復帰チェック

async function executeWithFallback<T>(
  mainFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  health: ProviderHealth,
): Promise<T> {
  // メインプロバイダーがフォールバック中でない場合
  if (!health.isFallback) {
    try {
      const result = await mainFn();
      health.consecutiveFailures = 0;
      return result;
    } catch (error) {
      health.consecutiveFailures++;
      health.lastFailureAt = Date.now();

      if (health.consecutiveFailures >= FALLBACK_THRESHOLD) {
        health.isFallback = true;
      }
    }
  }

  // フォールバックプロバイダーを使用
  return fallbackFn();
}
```

---

## 3. コンテンツフィルタリング

### 3.1 入力バリデーション

| チェック項目 | 方法 | 対応 |
|------------|------|------|
| **モデレーション API** | OpenAI Moderation API で有害コンテンツを検出 | リクエスト拒否 + ユーザー通知 |
| **プロンプトインジェクション検知** | パターンマッチング + ヒューリスティック | 入力サニタイズ + ログ記録 |
| **文字数制限** | 機能別の最大入力文字数 | 超過分を切り詰め + 通知 |
| **入力形式チェック** | 空文字、特殊文字のみ等を検出 | リクエスト拒否 + ユーザー通知 |

### 3.2 プロンプトインジェクション対策

#### 検知パターン

```typescript
// プロンプトインジェクション検知パターン
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /disregard\s+(previous|above|all)\s+instructions/i,
  /forget\s+(previous|above|all)\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+if\s+/i,
  /pretend\s+(you|to)\s+/i,
  /new\s+instructions?\s*:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
];

function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}
```

#### 入力サニタイズ

```typescript
// 入力サニタイズ
function sanitizeAIInput(input: string): string {
  // 1. 制御文字の除去
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. 過度な空白の正規化
  sanitized = sanitized.replace(/\s{10,}/g, ' '.repeat(3));

  // 3. HTMLタグの除去
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized.trim();
}
```

### 3.3 出力バリデーション

| チェック項目 | 方法 | 対応 |
|------------|------|------|
| **コンテンツモデレーション** | 出力テキストを Moderation API で検証 | 有害コンテンツを除外 |
| **PII 漏洩検知** | 正規表現で個人情報パターンを検出 | マスキング処理 |
| **ハルシネーション注記** | AI生成コンテンツに免責事項を付与 | ラベル表示 |

```typescript
// PII 検知パターン
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\d{2,4}-?\d{2,4}-?\d{3,4})/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
};

function maskPII(text: string): string {
  let masked = text;
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    masked = masked.replace(pattern, `[${type.toUpperCase()}_MASKED]`);
  }
  return masked;
}
```

### 3.4 文字数制限

| 機能 | 最大入力文字数 | 最大出力トークン |
|------|-------------|----------------|
| タスク抽出 | 10,000 | 2,048 |
| OKR提案 | 5,000 | 2,048 |
| ブランド分析 | 20,000 | 4,096 |
| ドキュメント要約 | 50,000 | 2,048 |
| チャットサポート | 2,000 | 1,024 |

---

## 4. AI 倫理と透明性

### 4.1 AI 生成コンテンツのラベリング

```typescript
// AI生成コンテンツのラベル表示
interface AIGeneratedContent {
  content: string;
  metadata: {
    generatedAt: string;
    model: string;
    confidence?: number;
  };
}

// UI表示例
// +------------------------------------------+
// | [AI Generated] タスク抽出結果              |
// |                                          |
// | 1. プロジェクト計画書の作成               |
// | 2. ステークホルダーへの報告               |
// | ...                                      |
// |                                          |
// | この内容はAIにより自動生成されました。     |
// | 内容を確認の上、必要に応じて修正して      |
// | ください。                               |
// +------------------------------------------+
```

### 4.2 制限事項の免責表示

```
表示テンプレート:

"この内容はAIにより自動生成されたものです。
 正確性は保証されません。重要な意思決定には
 必ず人間の確認を行ってください。"

機能別の注意書き:
- タスク抽出: "抽出されたタスクの優先度・期限は推定値です。必要に応じて調整してください。"
- OKR提案: "提案されたOKRは参考情報です。事業状況に合わせてカスタマイズしてください。"
- ブランド分析: "分析結果はAIの推定に基づくものです。市場調査データと合わせてご判断ください。"
```

### 4.3 データ利用ポリシー

```
FDC AI データ利用ポリシー:

1. ユーザーデータの取り扱い
   - AI処理に使用するデータは、該当機能の処理目的にのみ使用
   - LLMプロバイダーへの送信データは最小限に限定
   - 処理完了後、LLMプロバイダー側でデータは保持されない（API利用規約に準拠）

2. データの保存
   - AI生成結果はユーザーのワークスペースデータとして保存
   - キャッシュデータは暗号化して保存、TTL後に自動削除
   - ログデータは個人情報をマスキングして保存

3. オプトアウト
   - ユーザーはAI機能の利用をオプトアウト可能
   - オプトアウト時は全AI機能が無効化される
   - 既存のAI生成データは保持される（削除リクエスト可能）
```

### 4.4 フィードバック収集

```typescript
// フィードバックUI
interface AIFeedback {
  responseId: string;      // AI レスポンスの ID
  rating: 'up' | 'down';  // Thumbs up / down
  flagged: boolean;        // 不適切コンテンツとしてフラグ
  comment?: string;        // 自由記述フィードバック
  timestamp: string;
  userId: string;
}

// フィードバックUI コンポーネント構成
// +------------------------------------------+
// | AI回答内容...                             |
// |                                          |
// | [👍] [👎] [旗マーク] [コメント入力]        |
// +------------------------------------------+
```

```sql
-- フィードバックテーブル
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  response_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('up', 'down')),
  flagged BOOLEAN DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
```

---

## 5. モニタリングとアラート

### 5.1 モニタリングメトリクス

| メトリクス | 閾値 | アラート条件 | 通知先 |
|-----------|------|------------|--------|
| **エラー率** | 5% | 直近1時間のエラー率 > 5% | Slack + Email |
| **平均レスポンス時間** | 5秒 | 直近1時間の平均 > 5秒 | Slack |
| **コンテンツブロック率** | 10% | 直近24時間のブロック率 > 10% | Slack + Email |
| **日次APIコスト** | 予算の80% | 日次コスト > 予算の80% | Slack + Email |
| **プロンプトインジェクション検知** | 任意 | 検知時に即座に通知 | Slack + Email |
| **フォールバック発動** | 任意 | フォールバック切り替え時 | Slack |

### 5.2 ダッシュボード指標

```
AI モニタリングダッシュボード:

+------------------+------------------+------------------+
| リクエスト数      | エラー率          | 平均レスポンス時間 |
| 1,234/day        | 2.3%             | 3.2s             |
+------------------+------------------+------------------+
| APIコスト(本日)   | キャッシュヒット率 | フィードバック     |
| $12.50/$50       | 42%              | 78% positive     |
+------------------+------------------+------------------+

機能別内訳:
| 機能             | リクエスト | エラー率 | 平均時間 | コスト  |
|-----------------|-----------|---------|---------|--------|
| タスク抽出       | 450       | 1.2%    | 2.8s    | $3.20  |
| OKR提案         | 89        | 3.4%    | 4.1s    | $1.50  |
| ブランド分析     | 34        | 2.9%    | 6.2s    | $1.80  |
| ドキュメント要約 | 180       | 1.1%    | 3.5s    | $3.00  |
| チャットサポート | 281       | 4.3%    | 2.1s    | $3.00  |
```

### 5.3 インシデント対応レベル

| レベル | 条件 | 対応 | 対応時間 |
|--------|------|------|---------|
| **Critical** | エラー率 > 50% / 全AI機能停止 | 即座にフォールバック + オンコール通知 | 15分以内 |
| **High** | エラー率 > 20% / コスト予算超過 | フォールバック検討 + チーム通知 | 1時間以内 |
| **Medium** | エラー率 > 5% / レスポンス遅延 | 原因調査 + 監視強化 | 4時間以内 |
| **Low** | コンテンツブロック率上昇 / 品質低下 | ログ分析 + プロンプト調整 | 24時間以内 |

### 5.4 ログ設計

```typescript
// AI リクエストログ
interface AIRequestLog {
  requestId: string;
  timestamp: string;
  feature: string;         // task-extraction, okr-suggestion, etc.
  provider: string;        // anthropic, openai
  model: string;           // claude-sonnet-4-20250514, gpt-4o
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status: 'success' | 'error' | 'filtered' | 'cached';
  errorType?: string;
  cached: boolean;
  userId: string;          // ハッシュ化
  workspaceId: string;     // ハッシュ化
  costUSD: number;
}

// ログ出力例（Pino）
// {
//   "level": "info",
//   "requestId": "ai_req_abc123",
//   "feature": "task-extraction",
//   "provider": "anthropic",
//   "model": "claude-sonnet-4-20250514",
//   "inputTokens": 1500,
//   "outputTokens": 450,
//   "durationMs": 2800,
//   "status": "success",
//   "cached": false,
//   "costUSD": 0.0085
// }
```

---

## 6. 実装チェックリスト

### Phase 64 完了条件

- [ ] AI UX & Safety Design ドキュメント作成（本ファイル）
- [ ] ローディング UX 設計完了
- [ ] エラーハンドリング設計完了
- [ ] コンテンツフィルタリング設計完了
- [ ] AI 倫理・透明性ポリシー策定
- [ ] モニタリング・アラート設計完了
- [ ] FDC-CORE.md 更新

### 実装時の注意事項

1. **ローディング UX**: ストリーミング対応の場合、Vercel AI SDK の `useChat` / `useCompletion` が内部でローディング状態を管理するため、カスタムローディングは補助的に使用する
2. **エラーハンドリング**: API Route 側でエラーをキャッチし、適切な HTTP ステータスコードとエラーメッセージを返す
3. **コンテンツフィルタリング**: 入力バリデーションは API Route の先頭で実行し、LLM への不要なリクエストを防ぐ
4. **モニタリング**: 既存の Pino ログ基盤（Phase 21）と統合する

---

**Last Updated**: 2026-03-05
**Phase**: 64
**Status**: AI UX & Safety Design 策定完了
