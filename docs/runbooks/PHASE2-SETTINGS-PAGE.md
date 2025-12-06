# Phase 2: 設定ページの追加

**目標**: ユーザー設定ページ `/settings` を作成し、データ管理機能（エクスポート・インポート・リセット）を実装する

**所要時間目安**: 20-30分
**難易度**: ★★☆（中級）

---

## 前提条件

- [ ] Phase 1 が完了していること
- [ ] `/tasks` ページが動作すること
- [ ] `npm run build` が成功すること

### 現在のプロジェクト状態確認

```bash
# ビルドが通るか確認
npm run build

# /tasks ルートが含まれていることを確認
# Route (app)
# └ ○ /tasks
```

---

## 実装概要

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | 型定義を拡張 | `lib/types/index.ts` |
| 2 | DataContext を拡張 | `lib/contexts/DataContext.tsx` |
| 3 | 設定ページ作成 | `app/(app)/settings/page.tsx`（新規） |
| 4 | ナビゲーション更新 | `app/(app)/layout.tsx` |
| 5 | 動作確認 | ブラウザ |
| 6 | ビルド確認 | `npm run build` |
| 7 | ドキュメント更新 | 各種ドキュメント |

---

## Step 1: 型定義を拡張

### 1.1 現在の状態確認

`lib/types/index.ts` の現在の内容:

```typescript
// 現在の AppData
export interface AppData {
  version: string;
  tasks: Task[];
  lastUpdated: string;
}

export const DEFAULT_APP_DATA: AppData = {
  version: '1.0.0',
  tasks: [],
  lastUpdated: new Date().toISOString(),
};
```

### 1.2 Settings 型と AppData 拡張

`lib/types/index.ts` を以下のように更新:

```typescript
/**
 * lib/types/index.ts
 *
 * 型定義（ミニマルスターター版）
 * SaaS版と同じ構造を維持
 *
 * Phase 2 で Settings を追加
 */

// ユーザー情報
export interface User {
  id: string;
  email: string;
  name: string;
}

// ダッシュボード統計
export interface DashboardStats {
  taskCount: number;
  completedCount: number;
  progressRate: number;
}

// タスク
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// 設定（Phase 2 で追加）
export interface Settings {
  userName: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

// アプリケーションデータ（Phase 2 で settings を追加）
export interface AppData {
  version: string;
  tasks: Task[];
  settings: Settings;
  lastUpdated: string;
}

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  theme: 'light',
  notifications: true,
};

// デフォルトデータ（Phase 2 で settings を追加）
export const DEFAULT_APP_DATA: AppData = {
  version: '1.0.0',
  tasks: [],
  settings: DEFAULT_SETTINGS,
  lastUpdated: new Date().toISOString(),
};
```

**変更ポイント**:
- `Settings` インターフェースを新規追加
- `AppData` に `settings` プロパティを追加
- `DEFAULT_SETTINGS` 定数を追加
- `DEFAULT_APP_DATA` に `settings` を追加

---

## Step 2: DataContext を拡張

### 2.1 現在の状態確認

`lib/contexts/DataContext.tsx` の Action 定義（22-27行目）:

```typescript
type Action =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string };
```

### 2.2 DataContext を更新

`lib/contexts/DataContext.tsx` を以下のように更新:

```typescript
'use client';

/**
 * lib/contexts/DataContext.tsx
 *
 * データコンテキスト（ミニマルスターター版）
 * localStorage でデータを永続化
 *
 * Phase 2 で設定管理とデータリセット機能を追加
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import { AppData, Task, Settings, DEFAULT_APP_DATA, DEFAULT_SETTINGS } from '@/lib/types';

const STORAGE_KEY = 'fdc_app_data';

// Action Types（Phase 2 で UPDATE_SETTINGS, RESET_DATA, IMPORT_DATA を追加）
type Action =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_DATA'; payload: AppData };

// Reducer（Phase 2 で拡張）
function dataReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };

    // Phase 2 で追加
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    // Phase 2 で追加
    case 'RESET_DATA':
      return {
        ...DEFAULT_APP_DATA,
        lastUpdated: new Date().toISOString(),
      };

    // Phase 2 で追加
    case 'IMPORT_DATA':
      return {
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };

    default:
      return state;
  }
}

// Context
interface DataContextType {
  data: AppData;
  dispatch: Dispatch<Action>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(dataReducer, DEFAULT_APP_DATA);

  // 初期読み込み（Phase 2 でマイグレーション対応を追加）
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppData;

        // マイグレーション: settings がない古いデータへの対応
        const migrated: AppData = {
          ...parsed,
          settings: parsed.settings || DEFAULT_SETTINGS,
        };

        dispatch({ type: 'SET_DATA', payload: migrated });
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
  }, []);

  // 変更時に保存
  useEffect(() => {
    const toSave = { ...data, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [data]);

  return (
    <DataContext.Provider value={{ data, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
```

**変更ポイント**:
- `Action` 型に `UPDATE_SETTINGS`, `RESET_DATA`, `IMPORT_DATA` を追加
- `dataReducer` に対応する case を追加
- `Settings`, `DEFAULT_SETTINGS` を import
- マイグレーション対応（古いデータに settings を追加）

---

## Step 3: 設定ページ作成

### 3.1 ディレクトリ作成

```bash
mkdir -p app/\(app\)/settings
```

### 3.2 ファイル作成

`app/(app)/settings/page.tsx` を作成:

```typescript
'use client';

/**
 * app/(app)/settings/page.tsx
 *
 * 設定ページ
 * - ユーザー設定（名前、テーマ、通知）
 * - データ管理（エクスポート、インポート、リセット）
 * - バージョン情報
 *
 * Phase 2 で追加
 */

import { useState, useRef } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import type { Settings, AppData } from '@/lib/types';

export default function SettingsPage() {
  const { data, dispatch } = useData();
  const [localSettings, setLocalSettings] = useState<Settings>(data.settings);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================
  // 設定関連
  // ========================================

  /**
   * ローカル設定を更新
   */
  const updateLocalSettings = (updates: Partial<Settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  /**
   * 設定を保存
   */
  const handleSaveSettings = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: localSettings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ========================================
  // データ管理
  // ========================================

  /**
   * データをエクスポート（JSONファイルダウンロード）
   */
  const handleExport = () => {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `fdc-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * インポート用ファイル選択ダイアログを開く
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * ファイルを読み込んでインポート
   */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content) as AppData;

        // バリデーション
        if (!imported.version || !Array.isArray(imported.tasks)) {
          throw new Error('無効なデータ形式です');
        }

        if (!confirm(`${imported.tasks.length} 件のタスクをインポートします。現在のデータは上書きされます。よろしいですか？`)) {
          return;
        }

        dispatch({ type: 'IMPORT_DATA', payload: imported });
        setLocalSettings(imported.settings || data.settings);
        alert('インポートが完了しました');
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'インポートに失敗しました');
      }
    };
    reader.readAsText(file);

    // 同じファイルを再選択できるようにリセット
    e.target.value = '';
  };

  /**
   * データをリセット
   */
  const handleReset = () => {
    if (!confirm('すべてのデータを削除しますか？この操作は取り消せません。')) return;
    if (!confirm('本当に削除してよろしいですか？タスク、設定など全てのデータが失われます。')) return;

    dispatch({ type: 'RESET_DATA' });
    setLocalSettings(data.settings);
    alert('データをリセットしました');
  };

  // ========================================
  // 統計
  // ========================================
  const stats = {
    taskCount: data.tasks.length,
    completedCount: data.tasks.filter((t) => t.completed).length,
    dataSize: new Blob([JSON.stringify(data)]).size,
  };

  // ========================================
  // レンダリング
  // ========================================
  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>設定</h2>

      {/* ========================================
          基本設定
          ======================================== */}
      <div className="card">
        <h3 className="card-title">基本設定</h3>

        {/* ユーザー名 */}
        <div className="form-group">
          <label>ユーザー名</label>
          <input
            type="text"
            value={localSettings.userName}
            onChange={(e) => updateLocalSettings({ userName: e.target.value })}
            placeholder="山田 太郎"
          />
        </div>

        {/* テーマ */}
        <div className="form-group">
          <label>テーマ</label>
          <select
            value={localSettings.theme}
            onChange={(e) => updateLocalSettings({ theme: e.target.value as Settings['theme'] })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              background: 'white',
            }}
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
            <option value="system">システム設定に従う</option>
          </select>
          <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            ※ テーマ切り替え機能は Phase 4 以降で実装予定
          </small>
        </div>

        {/* 通知 */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.notifications}
              onChange={(e) => updateLocalSettings({ notifications: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            通知を有効にする
          </label>
          <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            ※ 通知機能は Phase 4 以降で実装予定
          </small>
        </div>

        {/* 保存ボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            設定を保存
          </button>
          {saved && (
            <span style={{ color: 'var(--success)', fontSize: '14px' }}>
              ✓ 保存しました
            </span>
          )}
        </div>
      </div>

      {/* ========================================
          データ管理
          ======================================== */}
      <div className="card">
        <h3 className="card-title">データ管理</h3>

        {/* 統計 */}
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--background)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {stats.taskCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>タスク数</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                {stats.completedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>完了</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                {(stats.dataSize / 1024).toFixed(1)} KB
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>データサイズ</div>
            </div>
          </div>
        </div>

        {/* 最終更新 */}
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          最終更新: {new Date(data.lastUpdated).toLocaleString('ja-JP')}
        </p>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 エクスポート
          </button>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            📤 インポート
          </button>
          <button
            className="btn"
            style={{ background: 'var(--danger)', color: 'white' }}
            onClick={handleReset}
          >
            🗑️ データをリセット
          </button>
        </div>

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />

        {/* インポートエラー表示 */}
        {importError && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              color: 'var(--danger)',
              fontSize: '14px',
            }}
          >
            ⚠️ {importError}
          </div>
        )}
      </div>

      {/* ========================================
          バージョン情報
          ======================================== */}
      <div className="card">
        <h3 className="card-title">バージョン情報</h3>
        <div style={{ fontSize: '14px' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>FDC Modular Starter</strong> v{data.version}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            学習用ミニマルスターターキット
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            © 2025 FDC Development Team
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 ファイル作成確認

```bash
ls -la app/\(app\)/settings/
```

---

## Step 4: ナビゲーション更新

### 4.1 現在の状態確認

`app/(app)/layout.tsx` の15-19行目（Phase 1 完了後）:

```typescript
const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/tasks', label: 'タスク' },
  // Phase 2 で追加: { href: '/settings', label: '設定' },
];
```

### 4.2 NAV_ITEMS を更新

`app/(app)/layout.tsx` の `NAV_ITEMS` を以下に変更:

```typescript
const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/tasks', label: 'タスク' },
  { href: '/settings', label: '設定' },
  // Phase 3 で追加: { href: '/leads', label: 'リード' },
];
```

---

## Step 5: 動作確認

### 5.1 開発サーバー起動

```bash
npm run dev
```

### 5.2 ブラウザで確認

1. http://localhost:3000 にアクセス
2. パスワード `fdc` でログイン
3. ナビゲーションに「設定」リンクが表示されることを確認
4. 「設定」をクリックして `/settings` に遷移

### 5.3 機能テスト

| テスト項目 | 期待動作 | 確認 |
|-----------|---------|------|
| ユーザー名入力 | 入力・保存が動作する | [ ] |
| テーマ選択 | プルダウンで選択できる | [ ] |
| 通知チェックボックス | オン/オフが切り替わる | [ ] |
| 設定保存 | 「保存しました」が表示される | [ ] |
| エクスポート | JSONファイルがダウンロードされる | [ ] |
| インポート | ファイル選択・確認後にデータが復元される | [ ] |
| リセット | 2回確認後にデータが削除される | [ ] |
| データ永続化 | リロード後も設定が残る | [ ] |

### 5.4 エクスポート/インポートテスト

1. タスクを数件追加
2. 設定ページでエクスポート
3. データをリセット
4. インポートでデータを復元
5. タスクが復元されていることを確認

---

## Step 6: ビルド確認

### 6.1 型チェック

```bash
npm run type-check
```

### 6.2 プロダクションビルド

```bash
npm run build
```

成功すると以下のような出力:

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      xxx B         xxx kB
├ ○ /dashboard                             xxx B         xxx kB
├ ○ /login                                 xxx B         xxx kB
├ ○ /settings                              xxx B         xxx kB  ← 追加
└ ○ /tasks                                 xxx B         xxx kB
```

---

## Step 7: ドキュメント更新

### 7.1 CHANGELOG.md 更新

`docs/CHANGELOG.md` に追加:

```markdown
## [1.2.0] - 2025-XX-XX - Phase 2: 設定ページ追加

### 概要

ユーザー設定ページを追加。データ管理機能（エクスポート/インポート/リセット）を実装。

### Added

| ファイル | 内容 |
|---------|------|
| `app/(app)/settings/page.tsx` | 設定ページ |

### Changed

| ファイル | 内容 |
|---------|------|
| `lib/types/index.ts` | Settings 型を追加、AppData を拡張 |
| `lib/contexts/DataContext.tsx` | UPDATE_SETTINGS, RESET_DATA, IMPORT_DATA アクションを追加 |
| `app/(app)/layout.tsx` | ナビゲーションに設定リンク追加 |

### 機能詳細

- ユーザー設定（名前、テーマ、通知）
- データエクスポート（JSON形式）
- データインポート（バリデーション付き）
- データリセット（2段階確認）
- データ統計表示（件数、サイズ）
- 既存データのマイグレーション対応
```

### 7.2 FDC-CORE.md 更新

フェーズ完了状況を更新:

```markdown
| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 0 | ✅ 完了 | スターター構築 |
| Phase 1 | ✅ 完了 | タスクページ追加 |
| Phase 2 | ✅ 完了 | 設定ページ追加 |
| Phase 3 | 🔜 予定 | リード管理機能 |
```

現在の開発状況を更新:

```markdown
- **バージョン**: v1.2.0
- **現在のPhase**: Phase 2 完了（設定ページ追加）
- **次フェーズ**: Phase 3（リード管理機能）
```

### 7.3 runbooks/README.md 更新

Phase 一覧の状態を更新:

```markdown
| Phase | ファイル | 内容 | 状態 |
|-------|----------|------|------|
| 0 | - | スターター構築 | ✅ 完了 |
| 1 | PHASE1-TASKS-PAGE.md | タスクページの追加 | ✅ 完了 |
| 2 | PHASE2-SETTINGS-PAGE.md | 設定ページの追加 | ✅ 完了 |
| 3 | PHASE3-LEADS.md | リード管理機能 | 🔜 予定 |
```

### 7.4 package.json 更新

バージョンを `1.2.0` に更新:

```json
{
  "version": "1.2.0"
}
```

---

## 完了条件（DoD）チェックリスト

- [ ] `/settings` で設定ページが表示される
- [ ] ユーザー名の入力・保存が動作する
- [ ] テーマ選択が動作する
- [ ] 通知設定のトグルが動作する
- [ ] データエクスポートが動作する（JSONファイルダウンロード）
- [ ] データインポートが動作する（ファイル選択・バリデーション）
- [ ] データリセットが動作する（2段階確認）
- [ ] ナビゲーションから遷移できる
- [ ] 設定がリロード後も永続化される
- [ ] 既存データ（settings なし）がマイグレーションされる
- [ ] `npm run type-check` が成功
- [ ] `npm run build` が成功
- [ ] ドキュメントが更新されている
  - [ ] CHANGELOG.md
  - [ ] FDC-CORE.md
  - [ ] runbooks/README.md
  - [ ] package.json

---

## トラブルシューティング

### Q: 型エラーが出る（Settings が見つからない）

`lib/types/index.ts` から `Settings` と `DEFAULT_SETTINGS` がエクスポートされているか確認:

```typescript
export interface Settings { ... }
export const DEFAULT_SETTINGS: Settings = { ... };
```

### Q: 既存データが読み込まれない

マイグレーションコードが正しく動作しているか確認:

```typescript
// DataContext.tsx の useEffect 内
const migrated: AppData = {
  ...parsed,
  settings: parsed.settings || DEFAULT_SETTINGS,
};
```

### Q: インポートでエラーが出る

JSONファイルの形式を確認:
- `version` プロパティが存在するか
- `tasks` が配列であるか

```json
{
  "version": "1.0.0",
  "tasks": [...],
  "settings": {...}
}
```

---

## 次のフェーズ

→ [Phase 3: リード管理機能](PHASE3-LEADS.md)

---

## Claude Code 用プロンプト

### Phase 2 実行

```
Phase 2 を実行してください。

ランブック: docs/runbooks/PHASE2-SETTINGS-PAGE.md

実行後、以下を更新してください:
1. docs/CHANGELOG.md に変更内容を追記
2. docs/FDC-CORE.md のフェーズ状況を更新
3. docs/runbooks/README.md のPhase状態を更新
4. package.json のバージョンを 1.2.0 に更新

最後に npm run build で確認してください。
```
