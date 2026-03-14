# 国際化基盤設計

## 1. 国際化の概要

### 1.1 対応言語
| 言語 | ロケール | デフォルト | 対応時期 |
|------|---------|----------|---------|
| 日本語 | ja | ○ | 初期 |
| 英語 | en | × | Phase 2 |

### 1.2 国際化方針
| 項目 | 方針 |
|------|------|
| URLパターン | パスベース（/ja/, /en/） |
| デフォルト言語 | 日本語（/ja/は省略可能） |
| 言語検出 | Accept-Language → Cookie → デフォルト |
| フォールバック | 日本語 |

## 2. next-intl設定

### 2.1 導入手順
| ステップ | コマンド/ファイル | 説明 |
|---------|----------------|------|
| 1 | npm install next-intl | パッケージインストール |
| 2 | i18n.ts | 設定ファイル作成 |
| 3 | proxy.ts | ミドルウェア設定（Next.js 16） |
| 4 | app/[locale]/ | ディレクトリ構成 |

### 2.2 設定ファイル構成
```
project/
├── i18n.ts                    # next-intl設定
├── proxy.ts                   # ミドルウェア（Next.js 16）
├── messages/
│   ├── ja.json               # 日本語翻訳
│   └── en.json               # 英語翻訳
└── app/
    └── [locale]/             # ロケール動的ルート
        ├── layout.tsx
        └── page.tsx
```

### 2.3 設定ファイル

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

### 2.4 プロキシ設定（Next.js 16）

```typescript
// proxy.ts（Next.js 16ではmiddleware.tsからproxy.tsに変更）
import createMiddleware from 'next-intl/middleware';

export function proxy(request: Request) {
  return createMiddleware({
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
  })(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### 2.5 ミドルウェア設定
| 設定項目 | 値 | 説明 |
|---------|-----|------|
| locales | ['ja', 'en'] | 対応ロケール |
| defaultLocale | 'ja' | デフォルト言語 |
| localePrefix | 'as-needed' | URLプレフィックス |
| matcher | ['/((?!api\|_next\|.*\\..*).*)'] | 適用パス |

## 3. ルーティング設計

### 3.1 URLパターン
| 言語 | URL | 説明 |
|------|-----|------|
| 日本語 | /dashboard | デフォルト（/ja/省略） |
| 日本語 | /ja/dashboard | 明示的 |
| 英語 | /en/dashboard | 英語版 |

### 3.2 ページ構成
```
app/[locale]/
├── layout.tsx                # ロケール対応レイアウト
├── page.tsx                  # ホーム
├── dashboard/
│   └── page.tsx             # ダッシュボード
├── settings/
│   └── page.tsx             # 設定
└── auth/
    ├── login/page.tsx       # ログイン
    └── signup/page.tsx      # サインアップ
```

### 3.3 レイアウト設定

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Next.js 16: paramsはPromise
}) {
  const { locale } = await params; // Next.js 16: awaitが必須
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 3.4 静的パラメータ生成
| 関数 | 目的 |
|------|------|
| generateStaticParams | 静的生成するロケールを指定 |
| getStaticPaths | 各ロケールのパスを生成 |

## 4. 翻訳ファイル構成

### 4.1 ファイル構成
| 方式 | 構成 | メリット |
|------|------|---------|
| 単一ファイル | messages/ja.json | シンプル |
| 名前空間分割 | messages/ja/common.json | 大規模向け |

### 4.2 名前空間設計
| 名前空間 | 内容 | 例 |
|---------|------|-----|
| common | 共通UI要素 | ボタン、ラベル |
| auth | 認証関連 | ログイン、サインアップ |
| dashboard | ダッシュボード | 統計、グラフ |
| settings | 設定 | プロフィール、通知 |
| errors | エラーメッセージ | 各種エラー |

### 4.3 翻訳キー設計
| パターン | 例 | 説明 |
|---------|-----|------|
| namespace.element | common.save | 基本パターン |
| namespace.section.element | auth.login.title | 階層パターン |
| namespace.element.state | auth.login.error | 状態付き |

### 4.4 変数・複数形
| 機能 | 書式 | 例 |
|------|------|-----|
| 変数 | {name} | "こんにちは、{name}さん" |
| 複数形 | {count, plural, ...} | "{count}件" |
| 日付 | {date, date, medium} | フォーマット済み日付 |

### 4.5 翻訳ファイル例

```json
// messages/ja.json
{
  "common": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集"
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "signup": "新規登録"
  },
  "dashboard": {
    "title": "ダッシュボード",
    "welcome": "{name}さん、おかえりなさい"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "signup": "Sign up"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}"
  }
}
```

## 5. コンポーネントでの使用

### 5.1 サーバーコンポーネント
| 関数 | 用途 |
|------|------|
| getTranslations | 翻訳の取得 |
| getLocale | 現在のロケール取得 |
| getMessages | 全メッセージ取得 |

```typescript
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: 'ユーザー' })}</p>
    </div>
  );
}
```

### 5.2 クライアントコンポーネント
| フック | 用途 |
|--------|------|
| useTranslations | 翻訳の使用 |
| useLocale | ロケール取得 |
| useMessages | メッセージ取得 |

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function SaveButton() {
  const t = useTranslations('common');
  return <button>{t('save')}</button>;
}
```

## 6. 言語切り替えUI

### 6.1 UIパターン
| パターン | 説明 | 用途 |
|---------|------|------|
| ドロップダウン | 言語一覧から選択 | 標準的 |
| フラグアイコン | 国旗で視覚的に | シンプル |
| テキストリンク | 言語名リンク | ミニマル |

### 6.2 言語セレクター

```typescript
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
```

### 6.3 状態の永続化
| 方法 | 説明 |
|------|------|
| URL | パスに含める（推奨） |
| Cookie | 次回訪問時に記憶 |
| LocalStorage | ブラウザに保存 |

## 7. 実装チェックリスト

- [x] 対応言語の決定（ja, en）
- [x] next-intl設定の設計
- [x] ルーティング設計（パスベース、デフォルト省略）
- [x] 翻訳ファイル構成の設計（名前空間分割）
- [x] 言語切り替えUIの設計（ドロップダウン）
