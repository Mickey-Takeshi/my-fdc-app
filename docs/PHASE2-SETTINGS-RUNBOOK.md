# Phase 2 ランブック: 設定ページ

**バージョン:** v1.0.0
**作成日:** 2025-12-07
**前提:** Phase 0-1 完了（スターター + タスク機能が localStorage で動作）

---

## 0. 前提条件

- [x] Phase 0 完了（スターター起動済み）
- [x] Phase 1 完了（タスク機能が localStorage で動作）
- [x] タスクの CRUD 操作が正常に動作している

---

## 1. 実装サマリー

| # | 実装内容 | ファイル | 優先度 |
|---|---------|---------|--------|
| 1 | Settings 型定義 | `lib/types/settings.ts` | P0 |
| 2 | SettingsContext | `lib/contexts/SettingsContext.tsx` | P0 |
| 3 | 設定ページ /settings | `app/(app)/settings/page.tsx` | P0 |
| 4 | プロフィール編集 | `app/_components/settings/ProfileSection.tsx` | P0 |
| 5 | Export 機能 | `app/_components/settings/ExportSection.tsx` | P1 |
| 6 | Import 機能 | `app/_components/settings/ImportSection.tsx` | P1 |
| 7 | リセット機能 | `app/_components/settings/ResetSection.tsx` | P1 |
| 8 | SettingsTab（コンテナ） | `app/_components/settings/SettingsTab.tsx` | P0 |

---

## 2. 型定義

### 2.1 Settings 型（`lib/types/settings.ts`）

```typescript
/**
 * lib/types/settings.ts
 *
 * 設定関連の型定義
 */

// ========================================
// プロフィール
// ========================================

export interface Profile {
  name: string;
  email: string;
  bio: string;
  company?: string;
  website?: string;
  socialLinks: {
    x?: string;
    facebook?: string;
    instagram?: string;
    note?: string;
  };
}

// ========================================
// アプリ設定
// ========================================

export interface AppSettings {
  projectName: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    reminder: boolean;
  };
}

// ========================================
// 全設定データ（Export/Import用）
// ========================================

export interface AllData {
  profile: Profile;
  settings: AppSettings;
  tasks: import('./task').Task[];
  exportedAt: string;
  version: string;
}

// ========================================
// デフォルト値
// ========================================

export const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  bio: '',
  socialLinks: {},
};

export const DEFAULT_SETTINGS: AppSettings = {
  projectName: 'My Project',
  theme: 'system',
  language: 'ja',
  notifications: {
    email: true,
    push: true,
    reminder: true,
  },
};

// ========================================
// バリデーション
// ========================================

export function validateProfile(profile: Partial<Profile>): string[] {
  const errors: string[] = [];

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push('メールアドレスの形式が正しくありません');
  }

  if (profile.website && !/^https?:\/\/.+/.test(profile.website)) {
    errors.push('WebサイトURLはhttp://またはhttps://で始めてください');
  }

  return errors;
}

export function validateImportData(data: unknown): data is AllData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;
  return (
    'profile' in d &&
    'settings' in d &&
    'tasks' in d &&
    'exportedAt' in d &&
    'version' in d
  );
}
```

---

## 3. SettingsContext 設計

### 3.1 SettingsContext（`lib/contexts/SettingsContext.tsx`）

```typescript
/**
 * lib/contexts/SettingsContext.tsx
 *
 * 設定管理用Context（localStorage永続化）
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { Profile, AppSettings } from '@/lib/types/settings';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '@/lib/types/settings';

// ========================================
// Context
// ========================================

interface SettingsContextValue {
  profile: Profile;
  settings: AppSettings;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAll: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ========================================
// localStorage
// ========================================

const PROFILE_KEY = 'fdc_profile';
const SETTINGS_KEY = 'fdc_settings';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[SettingsContext] Failed to save ${key}`);
  }
}

// ========================================
// Provider
// ========================================

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 初期化
  useEffect(() => {
    setProfile(loadFromStorage(PROFILE_KEY, DEFAULT_PROFILE));
    setSettings(loadFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS));
    setLoading(false);
  }, []);

  // 永続化
  useEffect(() => {
    if (!loading) {
      saveToStorage(PROFILE_KEY, profile);
    }
  }, [profile, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(SETTINGS_KEY, settings);
    }
  }, [settings, loading]);

  // アクション
  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetAll = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('fdc_tasks');
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        profile,
        settings,
        loading,
        updateProfile,
        updateSettings,
        resetAll,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
```

---

## 4. コンポーネント構成

### 4.1 ディレクトリ構造

```
app/
├── (app)/
│   └── settings/
│       └── page.tsx           # 設定ページ
├── _components/
│   └── settings/
│       ├── index.ts           # re-export
│       ├── SettingsTab.tsx    # タブコンテナ
│       ├── SectionCard.tsx    # セクションカード（共通）
│       ├── ProfileSection.tsx # プロフィール編集
│       ├── ExportSection.tsx  # エクスポート
│       ├── ImportSection.tsx  # インポート
│       └── ResetSection.tsx   # リセット（確認ダイアログ）
lib/
├── types/
│   └── settings.ts            # 型定義
└── contexts/
    └── SettingsContext.tsx    # Context
```

### 4.2 SectionCard コンポーネント（共通）

```typescript
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
```

### 4.3 ProfileSection

- 名前、メールアドレス、自己紹介
- SNSリンク（X, Facebook, Instagram, Note）
- バリデーション付き保存

### 4.4 ExportSection

- 全データをJSON形式でダウンロード
- ファイル名: `fdc-backup-YYYY-MM-DD.json`
- 含むデータ: profile, settings, tasks

### 4.5 ImportSection

- JSONファイルをアップロード
- バリデーション後にデータ復元
- 上書き確認ダイアログ

### 4.6 ResetSection

- 全データ削除（確認ダイアログ付き）
- 2段階確認（ボタン→モーダル→テキスト入力）

---

## 5. 実装手順

### Step 1: 型定義作成 (P0)

```bash
touch lib/types/settings.ts
```

上記 §2.1 のコードを実装。

### Step 2: SettingsContext 作成 (P0)

```bash
touch lib/contexts/SettingsContext.tsx
```

上記 §3.1 のコードを実装。

### Step 3: コンポーネント作成 (P0)

```bash
mkdir -p app/_components/settings
touch app/_components/settings/index.ts
touch app/_components/settings/SettingsTab.tsx
touch app/_components/settings/SectionCard.tsx
touch app/_components/settings/ProfileSection.tsx
touch app/_components/settings/ExportSection.tsx
touch app/_components/settings/ImportSection.tsx
touch app/_components/settings/ResetSection.tsx
```

### Step 4: 設定ページ作成 (P0)

```bash
mkdir -p "app/(app)/settings"
touch "app/(app)/settings/page.tsx"
```

### Step 5: ナビゲーション追加

`app/(app)/layout.tsx` に設定タブを追加:

```typescript
import { Settings } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/settings', label: '設定', icon: Settings },  // 追加
];
```

### Step 6: 検証

```bash
npm run type-check
npm run build
```

---

## 6. Export/Import 仕様

### 6.1 Export データ形式

```json
{
  "profile": {
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "bio": "フリーランスエンジニア",
    "socialLinks": {
      "x": "@tanaka"
    }
  },
  "settings": {
    "projectName": "My Project",
    "theme": "light",
    "language": "ja",
    "notifications": {
      "email": true,
      "push": true,
      "reminder": true
    }
  },
  "tasks": [
    {
      "id": "xxx",
      "title": "タスク1",
      "suit": "spade",
      "status": "not_started",
      ...
    }
  ],
  "exportedAt": "2025-12-07T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 6.2 Import フロー

1. ファイル選択
2. JSON パース
3. バリデーション（`validateImportData`）
4. 確認ダイアログ表示
5. データ復元
6. 成功トースト表示

---

## 7. リセット機能の安全設計

### 7.1 2段階確認

1. **ボタンクリック** → 確認モーダル表示
2. **モーダル内で「リセット」と入力** → 削除実行

### 7.2 削除対象

- `fdc_profile`（プロフィール）
- `fdc_settings`（設定）
- `fdc_tasks`（タスク）

---

## 8. 検証チェックリスト

### 8.1 機能検証

- [ ] プロフィール編集・保存ができる
- [ ] 設定変更が即座に反映される
- [ ] Export で JSON ファイルがダウンロードされる
- [ ] Import で JSON ファイルからデータ復元できる
- [ ] リセットで全データが削除される
- [ ] ページリロード後もデータが保持される

### 8.2 技術検証

```bash
# 型チェック
npm run type-check

# ビルド
npm run build

# Lint
npm run lint

# 開発サーバー起動
npm run dev
```

---

## 9. 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| グランドガイド | `references/saas-docs/FDC-GRAND-GUIDE.md` |
| 開発ガイド | `references/saas-docs/guides/DEVELOPMENT.md` |
| UI参照: SettingsTab | `references/ui/settings/SettingsTab.tsx` |
| 型参照: app-data.ts | `references/types/app-data.ts` |

---

## 10. 完了定義 (Definition of Done)

Phase 2 は以下がすべて満たされたとき完了:

1. **型定義**: `lib/types/settings.ts` が作成され、型チェック通過
2. **Context**: `lib/contexts/SettingsContext.tsx` が作成、localStorage 永続化実装
3. **UI**: プロフィール編集、Export/Import、リセットが実装
4. **機能**: 全機能が正常動作
5. **永続化**: localStorage でデータ保持
6. **検証**: `npm run type-check && npm run build` 成功

---

**Last Updated**: 2025-12-07
**Author**: Claude Code + Human
