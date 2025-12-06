# FDC Modular 開発ガイド

**バージョン:** v1.0.0
**最終更新:** 2025-12-06

## 0. ドキュメント概要

### 0.1 目的

このドキュメントは、FDC Modular Starter の開発・拡張を安全かつ一貫性をもって進めるための
**AI・人間共通の開発規範**です。

Claude Code を使用する場合は、必ず本ドキュメントを読み込み遵守してください。

### 0.2 現在の開発状況

**学習用スターター v1.0.0（2025-12-06）**

| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 0 | ✅ 完了 | スターター構築 |
| Phase 1 | 🔜 予定 | タスクページ追加 |
| Phase 2 | 🔜 予定 | 設定ページ追加 |
| Phase 3 | 🔜 予定 | リード管理機能 |

---

## 1. プロジェクト構成

### 1.1 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js | 15.1.0 |
| UIライブラリ | React | 19.0.0 |
| 言語 | TypeScript | 5.7.2 |
| Node.js | - | 22.x |

### 1.2 ディレクトリ構成

```
founders-direct-modular/
├── app/                    # Next.js App Router
│   ├── (app)/              # 認証済みルート（Route Group）
│   │   ├── dashboard/      # ダッシュボード
│   │   │   └── page.tsx    # Client Component
│   │   └── layout.tsx      # 認証レイアウト
│   ├── login/              # ログインページ
│   │   └── page.tsx        # Client Component
│   ├── globals.css         # グローバルCSS
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # リダイレクト
│
├── lib/                    # 共通ライブラリ
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 認証コンテキスト
│   │   └── DataContext.tsx # データコンテキスト
│   ├── hooks/              # カスタムフック（将来追加）
│   └── types/              # 型定義
│       └── index.ts        # 全型定義
│
├── docs/                   # ドキュメント
│   ├── FDC-MODULAR-GUIDE.md
│   ├── FDC-CORE.md
│   ├── CHANGELOG.md
│   ├── guides/
│   │   └── DEVELOPMENT.md  # 本ファイル
│   └── runbooks/
│       ├── README.md
│       ├── PHASE1-TASKS-PAGE.md
│       ├── PHASE2-SETTINGS-PAGE.md
│       └── PHASE3-LEADS.md
│
├── .github/workflows/      # CI/CD
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 2. コーディング規約

### 2.1 TypeScript

```typescript
// ✅ 正しい: 明示的な型定義
function getData(key: string): AppData | null { ... }

// ❌ 禁止: any 型
function getData(key: any): any { ... }
```

### 2.2 React コンポーネント

```typescript
// ✅ 正しい: 'use client' を最上部に記載
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState('');
  return <div>{state}</div>;
}
```

### 2.3 Context 使用

```typescript
// ✅ 正しい: useData フックを使用
import { useData } from '@/lib/contexts/DataContext';

export default function MyComponent() {
  const { data, dispatch } = useData();
  // ...
}
```

---

## 3. 状態管理パターン

### 3.1 DataContext

アプリケーションデータは `DataContext` で管理します。

```typescript
// データ取得
const { data, dispatch } = useData();

// データ更新（Action を dispatch）
dispatch({ type: 'ADD_TASK', payload: newTask });
dispatch({ type: 'TOGGLE_TASK', payload: taskId });
dispatch({ type: 'DELETE_TASK', payload: taskId });
```

### 3.2 新しい Action の追加手順

1. `lib/types/index.ts` に型を追加
2. `lib/contexts/DataContext.tsx` に Action を追加
3. reducer に case を追加

---

## 4. ファイル追加パターン

### 4.1 新規ページ追加

```
app/(app)/新機能/
└── page.tsx    # 'use client' を含む Client Component
```

### 4.2 ナビゲーション更新

`app/(app)/layout.tsx` の `NAV_ITEMS` に追加:

```typescript
const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/tasks', label: 'タスク' },
  { href: '/新機能', label: '新機能' },  // 追加
];
```

---

## 5. ドキュメント更新ルール

### 5.1 更新タイミング

| イベント | 更新対象 |
|---------|---------|
| 機能追加 | CHANGELOG.md, FDC-CORE.md |
| バグ修正 | CHANGELOG.md |
| アーキテクチャ変更 | DEVELOPMENT.md, FDC-CORE.md |
| 新規ランブック作成 | runbooks/README.md |

### 5.2 CHANGELOG 形式

```markdown
## [1.1.0] - 2025-12-XX - Phase 1

### Added
- タスクページ追加（`app/(app)/tasks/page.tsx`）
- フィルター機能（all/active/completed）

### Changed
- ナビゲーションにタスクリンク追加
```

### 5.3 FDC-CORE.md 更新

フェーズ完了時に以下を更新:
1. 「現在の開発状況」セクション
2. 「フェーズ完了状況」テーブル

---

## 6. Claude Code 運用ルール

### 6.1 セッション開始プロンプト

```
このプロジェクトの開発を行います。

以下のファイルを読み込んでください:
- docs/FDC-CORE.md
- docs/guides/DEVELOPMENT.md

プロジェクトパス: /Users/5dmgmt/プラグイン/founders-direct-modular
```

### 6.2 機能追加プロンプト

```
Phase N を実行してください。

ランブック: docs/runbooks/PHASEN-XXX.md

実行後、以下を更新してください:
1. docs/CHANGELOG.md に変更内容を追記
2. docs/FDC-CORE.md のフェーズ状況を更新
3. package.json のバージョンを更新（minor バージョンアップ）
```

### 6.3 作業完了確認プロンプト

```
作業完了を確認してください:

1. npm run build が成功するか
2. npm run type-check が成功するか
3. ドキュメントが更新されているか
   - CHANGELOG.md
   - FDC-CORE.md
```

---

## 7. テスト

### 7.1 手動テスト

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
# パスワード: fdc
```

### 7.2 ビルドテスト

```bash
# 型チェック
npm run type-check

# プロダクションビルド
npm run build
```

---

## 8. SaaS版への移行パス

このスターターで学習した後、以下の手順でSaaS版に移行できます:

| Modular 版 | SaaS 版 | 変換内容 |
|------------|---------|---------|
| localStorage | Supabase | データ永続化層 |
| 簡易認証 | Supabase Auth | Google OAuth |
| DataContext | WorkspaceDataContext | マルチテナント対応 |
| 単一テナント | マルチテナント | tenants テーブル追加 |

---

**Last Updated**: 2025-12-06
**Version**: v1.0.0
**Maintained by**: FDC Development Team
