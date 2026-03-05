# 翻訳ワークフロー設計

## 1. 翻訳ワークフローの概要

### 1.1 ワークフロー全体像
```
新規キー追加（開発者）
   ↓
日本語テキスト入力
   ↓
AI翻訳（初期翻訳）
   ↓
人間レビュー
   ↓
未翻訳チェック（CI）
   ↓
リリース
```

### 1.2 役割分担
| 役割 | 担当 | 作業内容 |
|------|------|---------|
| 開発者 | エンジニア | キー追加、日本語入力 |
| AI | Claude | 初期翻訳生成 |
| レビュアー | ネイティブ/翻訳者 | 品質チェック |
| CI | 自動 | 未翻訳検出 |

## 2. 翻訳キーの命名規則

### 2.1 命名パターン
| パターン | 形式 | 例 |
|---------|------|-----|
| 基本 | {namespace}.{element} | common.save |
| 階層 | {namespace}.{component}.{element} | auth.login.title |
| 状態付き | {namespace}.{component}.{state} | auth.login.error |

### 2.2 名前空間一覧
| 名前空間 | 内容 | 例 |
|---------|------|-----|
| common | 共通UI | common.button.save |
| auth | 認証 | auth.login.title |
| dashboard | ダッシュボード | dashboard.stats.users |
| settings | 設定 | settings.profile.name |
| errors | エラー | errors.validation.required |

### 2.3 命名規則
| ルール | 説明 | 良い例 | 悪い例 |
|--------|------|-------|--------|
| 小文字 | すべて小文字 | common.save | Common.Save |
| ドット区切り | 階層はドット | auth.login | auth_login |
| 動詞/名詞 | 用途に応じて | save, title | button1 |
| 具体的 | 意味がわかる | login.error.invalid | login.error1 |

## 3. 翻訳ファイル管理

### 3.1 ファイル構成
```
messages/
├── ja/                      # 日本語（ソース）
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   └── errors.json
├── en/                      # 英語
│   ├── common.json
│   ├── auth.json
│   └── ...
└── glossary.json            # 用語集
```

### 3.2 ファイルフォーマット
| 項目 | 設定 |
|------|------|
| 形式 | JSON |
| インデント | 2スペース |
| ソート | キーをアルファベット順 |
| エンコーディング | UTF-8 |

## 4. 型安全な翻訳

### 4.1 型定義の生成

```typescript
// scripts/generate-i18n-types.ts
import ja from '../messages/ja.json';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K
      : never
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<typeof ja>;
```

### 4.2 型チェック付き翻訳

```typescript
// lib/i18n/typed-translations.ts
import { useTranslations } from 'next-intl';
import type { TranslationKey } from './types';

export function useTypedTranslations(namespace: string) {
  const t = useTranslations(namespace);

  return function typedT(key: TranslationKey, params?: Record<string, string>) {
    return t(key, params);
  };
}
```

## 5. 未翻訳検出

### 5.1 検出方法
| 方法 | 説明 | タイミング |
|------|------|-----------|
| 差分チェック | 言語間のキー差分 | CI |
| 型チェック | TypeScript型エラー | ビルド時 |
| 空文字チェック | 空の翻訳を検出 | CI |

### 5.2 差分チェックスクリプト

```typescript
// scripts/check-translations.ts
import ja from '../messages/ja.json';
import en from '../messages/en.json';

function getKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object'
      ? getKeys(value, fullKey)
      : [fullKey];
  });
}

const jaKeys = new Set(getKeys(ja));
const enKeys = new Set(getKeys(en));

const missingInEn = [...jaKeys].filter(k => !enKeys.has(k));
const missingInJa = [...enKeys].filter(k => !jaKeys.has(k));

if (missingInEn.length > 0) {
  console.error('Missing in English:', missingInEn);
  process.exit(1);
}
```

### 5.3 CIチェック項目
| チェック | 説明 | 失敗時の対応 |
|---------|------|------------|
| キー整合性 | 全言語で同じキー | 不足キーを追加 |
| 空文字検出 | 翻訳が空でない | 翻訳を入力 |
| フォーマット | JSONの形式 | フォーマット修正 |

### 5.4 レポート形式
```
翻訳チェックレポート
━━━━━━━━━━━━━━━━━━━━
対象言語: ja, en

■ 不足キー（en）
  - dashboard.stats.newUsers
  - settings.notifications.email

■ 空の翻訳（en）
  - errors.validation.custom

合計: 3件の問題
```

## 6. AI翻訳ワークフロー

### 6.1 AI翻訳の役割
| フェーズ | AI | 人間 |
|---------|-----|------|
| 初期翻訳 | ○ | - |
| レビュー | - | ○ |
| 用語統一 | △（用語集参照） | ○ |
| 最終確認 | - | ○ |

### 6.2 AI翻訳プロンプト設計
| 要素 | 内容 |
|------|------|
| 役割 | UIテキスト翻訳者 |
| 指示 | 簡潔で自然な翻訳 |
| 用語集 | 統一用語のリスト |
| 出力形式 | JSON |

### 6.3 バッチ翻訳フロー
```
1. 未翻訳キーを抽出
   ↓
2. 用語集をロード
   ↓
3. AI翻訳を実行（レート制限対応）
   ↓
4. 結果をファイルに出力
   ↓
5. 人間レビュー用にPRを作成
```

### 6.4 初期翻訳スクリプト

```typescript
// scripts/translate-with-ai.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function translateToEnglish(jaText: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Translate the following Japanese UI text to natural English.
Keep it concise and suitable for UI elements.

Japanese: ${jaText}

English:`,
    }],
  });

  return response.content[0].text;
}
```

### 6.5 一括翻訳

```typescript
// scripts/bulk-translate.ts
async function translateFile(jaFile: string) {
  const ja = JSON.parse(fs.readFileSync(jaFile, 'utf-8'));
  const en: Record<string, string> = {};

  for (const [key, value] of Object.entries(ja)) {
    if (typeof value === 'string') {
      en[key] = await translateToEnglish(value);
      // レート制限対応
      await sleep(100);
    }
  }

  return en;
}
```

## 7. 用語集管理

### 7.1 用語集の構成
| フィールド | 説明 | 例 |
|-----------|------|-----|
| 日本語 | ソース言語 | ワークスペース |
| 英語 | ターゲット言語 | Workspace |
| 説明 | 用語の説明 | 組織の作業領域 |
| カテゴリ | 分類 | UI |

### 7.2 用語一覧
| 日本語 | 英語 | カテゴリ |
|--------|------|---------|
| ワークスペース | Workspace | 核心概念 |
| ダッシュボード | Dashboard | UI |
| タスク | Task | 核心概念 |
| メンバー | Member | ユーザー |
| 設定 | Settings | UI |
| ブランド | Brand | 核心概念 |
| リーンキャンバス | Lean Canvas | 核心概念 |
| OKR | OKR | 核心概念 |
| 監査ログ | Audit Log | 管理 |
| 招待 | Invitation | ユーザー |

### 7.3 用語更新ルール
| ルール | 説明 |
|--------|------|
| 追加 | PRでレビュー |
| 変更 | 影響範囲を確認してから変更 |
| 削除 | 使用箇所を確認してから削除 |

### 7.4 用語集を使った翻訳

```typescript
// AI翻訳時に用語集を参照
const prompt = `Translate Japanese to English.
Use these terms consistently:
${Object.entries(glossary).map(([ja, en]) => `- ${ja} → ${en}`).join('\n')}

Japanese: ${text}
English:`;
```

## 8. 品質管理

### 8.1 レビューチェックリスト
| 項目 | チェック内容 |
|------|------------|
| 正確性 | 意味が正しいか |
| 自然さ | 自然な表現か |
| 一貫性 | 用語が統一されているか |
| 長さ | UIに収まるか |
| 変数 | {変数}が正しいか |

### 8.2 品質指標
| 指標 | 目標 |
|------|------|
| 翻訳カバレッジ | 100% |
| レビュー率 | 100% |
| 修正率 | <10% |

## 9. 実装チェックリスト

- [x] 翻訳キー命名規則の策定
- [x] 翻訳ファイル構成の設計
- [x] 未翻訳検出スクリプトの設計
- [x] AI翻訳ワークフローの設計
- [x] 用語集の作成
- [x] 品質管理プロセスの設計
