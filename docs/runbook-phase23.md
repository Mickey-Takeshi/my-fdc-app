# Phase 23: PWA（Progressive Web App）対応ランブック

**Phase 23: manifest.json・Service Worker・オフライン対応**

---

## 0. 前提条件

- [ ] Phase 22 完了（本番デプロイ済み）
- [ ] HTTPS環境でアクセス可能
- [ ] Node.js >= 22.22.0

---

## 1. このPhaseで習得する概念

| 概念 | 説明 |
|------|------|
| **PWA** | Progressive Web App。Webアプリをネイティブアプリのように動作させる技術 |
| **manifest.json** | アプリ名、アイコン、テーマカラーなどのメタ情報を定義 |
| **Service Worker** | ブラウザとサーバー間で動作し、キャッシュやオフライン対応を実現 |
| **Cache API** | Service Workerで使用するキャッシュストレージ |

### PWAの利点

| 利点 | 説明 |
|------|------|
| ホーム画面追加 | アプリアイコンからワンタップで起動 |
| オフライン対応 | ネットワーク接続なしでも基本機能が使える |
| プッシュ通知 | ネイティブアプリのような通知機能（将来拡張） |
| 高速起動 | キャッシュにより2回目以降の起動が高速 |

---

## Step 1: アイコンファイルの作成

### 1.1 必要なアイコンサイズ

| ファイル名 | サイズ | 用途 |
|-----------|--------|------|
| `icon-192.png` | 192x192 | Android ホーム画面 |
| `icon-512.png` | 512x512 | スプラッシュスクリーン |
| `apple-touch-icon.png` | 180x180 | iOS ホーム画面 |
| `favicon.ico` | 32x32 | ブラウザタブ |

### 1.2 プレースホルダーアイコンの作成

開発用にシンプルなSVGアイコンを作成します。

**ファイル: `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#667eea"/>
  <text x="256" y="320" font-size="280" font-family="system-ui" font-weight="bold" fill="white" text-anchor="middle">F</text>
</svg>
```

### 1.3 PNG変換コマンド（本番用）

```bash
# ImageMagickがインストールされている場合
convert public/icon.svg -resize 192x192 public/icon-192.png
convert public/icon.svg -resize 512x512 public/icon-512.png
convert public/icon.svg -resize 180x180 public/apple-touch-icon.png
convert public/icon.svg -resize 32x32 public/favicon.ico
```

### 確認ポイント

- [ ] `public/icon.svg` が作成されている
- [ ] アイコンファイルが正方形である

---

## Step 2: manifest.json の作成

### 2.1 マニフェストファイル

**ファイル: `public/manifest.json`**

```json
{
  "name": "FDC Modular Starter",
  "short_name": "FDC",
  "description": "Founders Direct Cockpit - スタートアップ向けビジネス管理ツール",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [],
  "categories": ["business", "productivity"]
}
```

### 2.2 マニフェストの主要プロパティ

| プロパティ | 説明 |
|-----------|------|
| `name` | アプリのフルネーム（インストール画面） |
| `short_name` | ホーム画面に表示される短い名前 |
| `start_url` | アプリ起動時のURL |
| `display` | `standalone`でネイティブアプリ風表示 |
| `theme_color` | ステータスバーの色 |
| `background_color` | スプラッシュスクリーンの背景色 |

### 確認ポイント

- [ ] `public/manifest.json` が作成されている
- [ ] `theme_color` がアプリのプライマリカラーと一致

---

## Step 3: メタタグの追加

### 3.1 RootLayoutにPWAメタタグを追加

**ファイル: `app/layout.tsx`**

```typescript
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WebVitals } from '@/app/_components/analytics/WebVitals';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'FDC Modular Starter',
  description: 'Founders Direct Cockpit - Modular Starter',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FDC',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

### 確認ポイント

- [ ] `manifest` プロパティが設定されている
- [ ] `appleWebApp` が設定されている
- [ ] `viewport.themeColor` が設定されている

---

## Step 4: Service Worker の作成

### 4.1 Service Worker ファイル

**ファイル: `public/sw.js`**

```javascript
const CACHE_NAME = 'fdc-cache-v1';
const OFFLINE_URL = '/offline.html';

// キャッシュするリソース
const PRECACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// フェッチ時のキャッシュ戦略
self.addEventListener('fetch', (event) => {
  // APIリクエストはキャッシュしない
  if (event.request.url.includes('/api/')) {
    return;
  }

  // ナビゲーションリクエスト（ページ遷移）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // その他のリクエスト: Cache First戦略
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // 成功したレスポンスをキャッシュ
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

### 4.2 キャッシュ戦略の説明

| 戦略 | 用途 |
|------|------|
| **Cache First** | 静的アセット（画像、CSS、JS） |
| **Network First** | ページナビゲーション |
| **Network Only** | APIリクエスト |

### 確認ポイント

- [ ] `public/sw.js` が作成されている
- [ ] APIリクエストがキャッシュから除外されている

---

## Step 5: オフラインページの作成

### 5.1 オフラインHTML

**ファイル: `public/offline.html`**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>オフライン - FDC</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea, #764ba2);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
      margin: 20px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      opacity: 0.9;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>オフラインです</h1>
    <p>インターネット接続がありません。<br>接続を確認してから再試行してください。</p>
    <button onclick="location.reload()">再読み込み</button>
  </div>
</body>
</html>
```

### 確認ポイント

- [ ] `public/offline.html` が作成されている
- [ ] デザインがアプリのテーマと一致している

---

## Step 6: Service Worker 登録コンポーネント

### 6.1 登録コンポーネント

**ファイル: `app/_components/pwa/ServiceWorkerRegistration.tsx`**

```typescript
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    }
  }, []);

  return null;
}
```

### 6.2 RootLayoutに組み込み

**ファイル: `app/layout.tsx` に追加**

```typescript
import { ServiceWorkerRegistration } from '@/app/_components/pwa/ServiceWorkerRegistration';

// body内に追加
<ServiceWorkerRegistration />
```

### 確認ポイント

- [ ] `ServiceWorkerRegistration` コンポーネントが作成されている
- [ ] 本番環境でのみ登録される条件が設定されている

---

## Step 7: インストールプロンプト（オプション）

### 7.1 インストールボタンコンポーネント

**ファイル: `app/_components/pwa/InstallPrompt.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] Installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 9999,
      }}
    >
      <span>アプリをインストールしますか？</span>
      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#667eea',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        インストール
      </button>
      <button
        onClick={() => setShowPrompt(false)}
        style={{
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.5)',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        後で
      </button>
    </div>
  );
}
```

### 確認ポイント

- [ ] `InstallPrompt` コンポーネントが作成されている（オプション）

---

## Step 8: PWA検証

### 8.1 Chrome DevTools での確認

```
1. Chrome DevTools を開く（F12）
2. Application タブを選択
3. 左メニューの「Manifest」で manifest.json を確認
4. 左メニューの「Service Workers」で登録状態を確認
```

### 8.2 Lighthouse PWA 監査

```bash
# ローカルで本番ビルドを起動
npm run build && npm run start

# 別ターミナルで Lighthouse 実行
npx lighthouse http://localhost:3000 --only-categories=pwa --output=html --output-path=./pwa-report.html
```

### 8.3 PWA 要件チェックリスト

| 要件 | 説明 | 必須 |
|------|------|------|
| HTTPS | セキュアな接続 | ✓ |
| manifest.json | アプリメタ情報 | ✓ |
| Service Worker | オフライン対応 | ✓ |
| 192x192 アイコン | ホーム画面用 | ✓ |
| 512x512 アイコン | スプラッシュ用 | ✓ |
| start_url | 起動URL | ✓ |

### 確認ポイント

- [ ] Chrome DevToolsでmanifestが認識されている
- [ ] Service Workerが登録されている
- [ ] Lighthouse PWAスコアが良好

---

## トラブルシューティング

### Service Workerが登録されない

```javascript
// 開発環境（localhost）でも動作確認したい場合
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### キャッシュが更新されない

```javascript
// sw.js のバージョンを更新
const CACHE_NAME = 'fdc-cache-v2'; // v1 → v2
```

### iOSでインストールできない

iOSはSafariのみPWAインストールに対応。以下を確認：
- `apple-touch-icon` が設定されている
- `appleWebApp.capable` が `true`

---

## 完了チェック

- [ ] `public/manifest.json` が作成されている
- [ ] `public/sw.js` が作成されている
- [ ] `public/offline.html` が作成されている
- [ ] アイコンファイルが配置されている
- [ ] `app/layout.tsx` にPWAメタタグが追加されている
- [ ] `ServiceWorkerRegistration` が組み込まれている
- [ ] Chrome DevToolsでPWAが認識されている
- [ ] ホーム画面に追加できる

---

## 次のステップ

Phase 23 が完了したら、以下の拡張を検討：

1. **プッシュ通知**: Web Push APIで通知機能
2. **バックグラウンド同期**: オフライン時の操作を後で同期
3. **App Shortcutsの追加**: ホーム画面アイコンの長押しメニュー

---

**Last Updated**: 2026-01-16
**Version**: Phase 23 v1.0
**Maintained by**: FDC Development Team (Human + Claude Code)
