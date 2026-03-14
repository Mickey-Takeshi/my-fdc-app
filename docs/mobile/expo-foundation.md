# Expo基盤設計書

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| フレームワーク | Expo (React Native) |
| ルーティング | Expo Router |
| 認証 | Supabase Auth |
| 状態管理 | React Query + Zustand |
| UIライブラリ | Tamagui (Phase 84で設計) |

## 2. 技術選定

### 2.1 Expoを選択する理由

| 観点 | Expo | 素のReact Native |
|------|------|------------------|
| セットアップ | 数分で完了 | 複雑な環境構築 |
| OTAアップデート | EAS Update | 要追加実装 |
| ビルド | EAS Build（クラウド） | ローカル環境必須 |
| ネイティブモジュール | 大半はExpo SDKに含む | 柔軟性が高い |
| 適用ケース | MVP〜中規模アプリ | 特殊要件のアプリ |

## 3. モノレポ構成

```
monorepo (Turborepo)
├── apps/
│   ├── web/           # Next.js (既存)
│   └── mobile/        # Expo (新規)
└── packages/
    ├── ui/            # 共有UIコンポーネント
    ├── api/           # APIクライアント・Supabase
    ├── types/         # 型定義
    └── utils/         # ユーティリティ関数
```

### 3.1 パッケージ依存関係

| パッケージ | 依存先 | Web | Mobile |
|-----------|--------|-----|--------|
| @myapp/ui | types | o | o |
| @myapp/api | types | o | o |
| @myapp/types | - | o | o |
| @myapp/utils | types | o | o |

### 3.2 Turborepo設定

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

### 3.3 共有パッケージ

```json
// packages/api/package.json
{
  "name": "@myapp/api",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

## 4. Expo Routerルーティング設計

```
mobile/app/
├── _layout.tsx           # ルートレイアウト
├── index.tsx             # スプラッシュ/初期画面
├── (auth)/               # 認証グループ
│   ├── _layout.tsx       # Stack
│   ├── login.tsx
│   └── signup.tsx
└── (app)/                # 認証後グループ
    ├── _layout.tsx       # Tabs
    ├── dashboard.tsx
    ├── tasks/
    │   ├── index.tsx
    │   └── [id].tsx
    └── settings.tsx
```

### 4.1 ナビゲーションフロー

```
起動
 |
 v
[認証状態チェック]
 |
 +-- 未ログイン --> (auth)/login
 |                    |
 |                    v
 |               ログイン成功
 |                    |
 +-- ログイン済 <-----+
         |
         v
    (app)/dashboard
         |
    +----+----+
    v         v
  Tasks   Settings
```

### 4.2 ルートレイアウト

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
```

## 5. Supabase認証統合

### 5.1 認証フロー

```
Mobile Client --> Supabase Auth --> AsyncStore (セッション)
      |                |
      |                v
      +----------> Supabase DB (RPC/REST)
```

### 5.2 プラットフォーム別ストレージ

| プラットフォーム | ストレージ | 暗号化 |
|-----------------|-----------|--------|
| iOS | SecureStore | Keychain |
| Android | EncryptedSharedPreferences | AES |
| 開発時 | AsyncStorage | なし |

### 5.3 モバイル用Supabaseクライアント

```typescript
// packages/api/src/supabase/mobile.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 5.4 認証フック

```typescript
// packages/api/src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

## 6. app.json設定項目

| 項目 | iOS | Android |
|------|-----|---------|
| ID | bundleIdentifier | package |
| アイコン | icon (1024x1024) | adaptiveIcon |
| スプラッシュ | splash.image | splash.image |
| 権限 | infoPlist | permissions |

```json
// app.json
{
  "expo": {
    "name": "FDC App",
    "slug": "fdc-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.fdc.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.fdc.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## 7. EAS Build設定

| プロファイル | 用途 | 配布 |
|-------------|------|------|
| development | 開発ビルド | Expo Go / Dev Client |
| preview | テスト配布 | TestFlight / 内部配布 |
| production | 本番リリース | App Store / Google Play |

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 8. 実装チェックリスト

- [x] Turborepoでモノレポ構成を設計した
- [x] Expoプロジェクト構成を設計した
- [x] 共有パッケージ構成を設計した
- [x] Expo Routerのルーティングを設計した
- [x] Supabase認証の統合方法を設計した
- [x] app.jsonの設定項目を整理した
- [x] EAS Buildプロファイルを設計した
