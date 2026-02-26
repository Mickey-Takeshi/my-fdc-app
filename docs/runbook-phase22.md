# Phase 22: 本番デプロイ・パフォーマンス最適化ランブック

**Phase 22: Vercel本番デプロイ・環境変数設定・Core Web Vitals最適化**

---

## 0. 前提条件

- [ ] Phase 0 完了（Vercel接続済み）
- [ ] Phase 20 完了（セキュリティ強化）
- [ ] Phase 21 完了（テスト設定済み）
- [ ] Node.js >= 22.22.0
- [ ] Supabase プロジェクト作成済み

---

## 1. 必読ドキュメント

| ドキュメント | パス | 目的 |
|------------|------|------|
| モジュラーガイド | docs/FDC-MODULAR-GUIDE.md | プロジェクト全体像 |
| 開発ガイド | docs/guides/DEVELOPMENT.md | 技術詳細・コーディング規約 |

---

## 2. このPhaseで習得する概念

| 概念 | 説明 |
|------|------|
| **Core Web Vitals** | Googleの品質指標（LCP, INP, CLS） |
| **プレビューデプロイ** | PRごとに自動生成される確認用URL |
| **コード分割** | `dynamic import` で必要なコードだけを読み込む |
| **画像最適化** | `next/image` による自動最適化 |

### Core Web Vitals 指標

| 指標 | 説明 | 目標値 |
|------|------|--------|
| **LCP** (Largest Contentful Paint) | 最大コンテンツの表示時間 | < 2.5秒 |
| **INP** (Interaction to Next Paint) | インタラクション応答時間 | < 200ms |
| **CLS** (Cumulative Layout Shift) | レイアウトのずれ | < 0.1 |

---

## Step 1: 本番用環境変数の設定（Vercel）

### 1.1 設定する環境変数一覧

| 変数名 | 説明 | スコープ |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 本番Supabase URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番Supabase Public Key | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバーサイド用 | Production のみ |
| `TOKEN_ENCRYPTION_KEY` | JWTトークン暗号化キー | Production のみ |
| `GOOGLE_CLIENT_ID` | 本番用OAuth Client ID | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | 本番用OAuth Secret | Production のみ |

### 1.2 Vercel ダッシュボードでの設定手順

```
1. Vercel ダッシュボード → プロジェクト選択
2. Settings → Environment Variables
3. 各変数を追加:
   - Name: 変数名
   - Value: 値
   - Environment: Production / Preview / Development を選択
```

### 1.3 TOKEN_ENCRYPTION_KEY の生成

```bash
# 32バイトのランダムキーを生成
openssl rand -base64 32
```

**出力例:**
```
Xk9mR2pL7nQ3vY8wB5cD1fG6hJ0kM4pN=
```

### 確認ポイント

- [ ] `NEXT_PUBLIC_SUPABASE_URL` が設定されている
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定されている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が Production のみに設定されている
- [ ] `TOKEN_ENCRYPTION_KEY` が新規生成されて設定されている

---

## Step 2: Google OAuth 本番設定

### 2.1 Google Cloud Console での設定

```
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client IDs → 本番用クライアントを選択/作成
3. Authorized redirect URIs に追加:
   - https://your-app.vercel.app/api/auth/callback
   - https://your-project-id.supabase.co/auth/v1/callback
```

### 2.2 Supabase での OAuth 設定

```
1. Supabase Dashboard → Authentication → Providers
2. Google を有効化
3. Client ID と Client Secret を設定
4. Authorized Client IDs に本番のClient IDを追加
```

### 確認ポイント

- [ ] Google Cloud Console でリダイレクトURIが設定されている
- [ ] Supabase で Google Provider が有効化されている
- [ ] 本番URLでのログインが動作する

---

## Step 3: Core Web Vitals 最適化

### 3.1 画像最適化コンポーネント

**ファイル: `app/_components/ui/OptimizedImage.tsx`**

```typescript
/**
 * app/_components/ui/OptimizedImage.tsx
 *
 * Phase 22: 画像最適化コンポーネント
 * - next/image によるLCP改善
 * - placeholder blur でCLS改善
 */

import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/AKGl6hJp+pQXcYBaJtwB+H4fyqXV3UE+q3puJYYFdgAdiYGAMf1OKUpFy7FYALuf/9k="
      className={className}
      style={{
        objectFit: 'cover',
      }}
    />
  );
}
```

### 3.2 動的インポート（コード分割）

**ファイル: `app/_components/dynamic/DynamicComponents.tsx`**

```typescript
/**
 * app/_components/dynamic/DynamicComponents.tsx
 *
 * Phase 22: 動的インポートによるコード分割
 * - 重いコンポーネントを遅延読み込み
 * - 初期バンドルサイズを削減
 */

import dynamic from 'next/dynamic';

// ローディングコンポーネント
function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
}

// LeanCanvas を動的インポート（重いコンポーネントの例）
export const DynamicLeanCanvas = dynamic(
  () => import('@/app/_components/lean-canvas/LeanCanvas').then((mod) => mod.LeanCanvas),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // クライアントサイドのみ
  }
);

// チャート系コンポーネント（将来用）
export const DynamicChart = dynamic(
  () => import('@/app/_components/charts/ChartComponent').then((mod) => mod.default),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);
```

### 3.3 フォント最適化

**ファイル: `app/layout.tsx` に追加**

```typescript
import { Inter } from 'next/font/google';

// フォント最適化: subset指定でサイズ削減
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOUT防止: フォント読み込み中は代替フォント表示
  preload: true,
});

// RootLayout内でclassNameに追加
// <body className={inter.className}>
```

### 確認ポイント

- [ ] `OptimizedImage` コンポーネントが作成されている
- [ ] 動的インポートが設定されている
- [ ] フォント最適化が適用されている

---

## Step 4: Web Vitals 計測設定

### 4.1 Web Vitals 計測コンポーネント

**ファイル: `app/_components/analytics/WebVitals.tsx`**

```typescript
/**
 * app/_components/analytics/WebVitals.tsx
 *
 * Phase 22: Core Web Vitals 計測
 * - LCP, INP, CLS を計測してコンソールに出力
 * - 本番では分析サービスに送信可能
 */

'use client';

import { useEffect } from 'react';

type MetricName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB';

interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function WebVitals() {
  useEffect(() => {
    // web-vitals ライブラリを動的インポート
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        // 開発環境: コンソールに出力
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] ${metric.name}:`, {
            value: metric.value.toFixed(2),
            rating: metric.rating,
          });
        }

        // 本番環境: 分析サービスに送信（例）
        // sendToAnalytics(metric);
      };

      onCLS(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onFCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, []);

  return null;
}
```

### 4.2 パッケージインストール

```bash
npm install web-vitals
```

### 4.3 RootLayout に組み込み

**ファイル: `app/layout.tsx` に追加**

```typescript
import { WebVitals } from '@/app/_components/analytics/WebVitals';

// RootLayout内のbodyタグ内に追加
// <WebVitals />
```

### 確認ポイント

- [ ] `web-vitals` パッケージがインストールされている
- [ ] `WebVitals` コンポーネントが作成されている
- [ ] RootLayout に組み込まれている

---

## Step 5: 本番ビルドの検証

### 5.1 ビルド実行

```bash
npm run build
```

**期待される出力（ルートサイズ）:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        105 kB
├ ○ /dashboard                           3.1 kB        103 kB
├ ○ /login                               2.8 kB        102 kB
└ ...
```

### 5.2 Lighthouse 計測

```bash
# 本番ビルドを起動
npm run build && npm run start

# 別ターミナルで Lighthouse 実行
npx lighthouse http://localhost:3000/login --output=html --output-path=./lighthouse-report.html
```

### 5.3 パフォーマンス目標値

| 指標 | 目標 | 説明 |
|------|------|------|
| Performance Score | >= 90 | 総合パフォーマンススコア |
| LCP | < 2.5s | 最大コンテンツ表示 |
| INP | < 200ms | インタラクション応答 |
| CLS | < 0.1 | レイアウトシフト |

### 確認ポイント

- [ ] `npm run build` が成功する
- [ ] First Load JS が妥当なサイズ（< 150kB 推奨）
- [ ] Lighthouse Performance >= 90

---

## Step 6: 本番リリースチェックリスト

### 6.1 セキュリティ

| 項目 | 確認方法 | 状態 |
|------|----------|------|
| RLS有効 | Supabase Dashboard → Database → Tables | [ ] |
| CSPヘッダー | DevTools → Network → Response Headers | [ ] |
| HTTPSリダイレクト | Vercel自動対応 | [x] |
| 環境変数非公開 | `SUPABASE_SERVICE_ROLE_KEY` がクライアントに露出しない | [ ] |

### 6.2 認証

| 項目 | 確認方法 | 状態 |
|------|----------|------|
| Google OAuth | 本番URLでログイン | [ ] |
| コールバックURL | 正しくリダイレクト | [ ] |
| セッション管理 | ログイン状態の維持 | [ ] |

### 6.3 テスト

| 項目 | 確認方法 | 状態 |
|------|----------|------|
| ユニットテスト | `npm run test:unit` | [ ] |
| E2Eテスト | CI/CD で自動実行 | [ ] |
| 型チェック | `npm run type-check` | [ ] |

### 6.4 パフォーマンス

| 項目 | 確認方法 | 状態 |
|------|----------|------|
| LCP < 2.5s | Lighthouse / DevTools | [ ] |
| CLS < 0.1 | Lighthouse / DevTools | [ ] |
| バンドルサイズ | `npm run build` 出力 | [ ] |

---

## Step 7: 本番デプロイ

### 7.1 デプロイトリガー

```bash
# main ブランチにマージすると自動デプロイ
git checkout main
git merge elegant-wu
git push origin main
```

### 7.2 Vercel デプロイ確認

```
1. Vercel ダッシュボード → Deployments
2. 最新デプロイのステータスが "Ready" であることを確認
3. Visit ボタンで本番URLにアクセス
4. 基本機能の動作確認
```

### 7.3 デプロイ後の確認

```bash
# 本番URLでの動作確認
curl -I https://your-app.vercel.app

# レスポンスヘッダーの確認
# - x-frame-options: DENY
# - content-security-policy: ...
# - strict-transport-security: ...
```

### 確認ポイント

- [ ] Vercel デプロイが成功している
- [ ] 本番URLにアクセスできる
- [ ] セキュリティヘッダーが設定されている
- [ ] Google OAuth でログインできる

---

## トラブルシューティング

### ビルドエラー

```bash
# 型エラーの確認
npm run type-check

# Lint エラーの確認
npm run lint

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

### 環境変数エラー

```
Error: Missing NEXT_PUBLIC_SUPABASE_URL
```

**解決方法:**
1. Vercel Dashboard → Settings → Environment Variables
2. 該当変数が設定されているか確認
3. 変数のスコープ（Production/Preview/Development）を確認

### OAuth エラー

```
Error: redirect_uri_mismatch
```

**解決方法:**
1. Google Cloud Console でリダイレクトURIを確認
2. 本番URLが正確に登録されているか確認
3. 末尾のスラッシュの有無を確認

---

## 完了チェック

- [ ] Vercel 環境変数が設定されている
- [ ] Google OAuth が本番設定されている
- [ ] Core Web Vitals 最適化が実装されている
- [ ] Web Vitals 計測が設定されている
- [ ] 本番ビルドが成功する
- [ ] Lighthouse Performance >= 90
- [ ] 本番デプロイが完了している
- [ ] 本番URLで動作確認完了

---

## 次のステップ

Phase 22 が完了したら、以下の継続的改善を検討:

1. **モニタリング強化**: Vercel Analytics / Sentry 導入
2. **パフォーマンス改善**: Bundle Analyzer でサイズ最適化
3. **ユーザーフィードバック**: エラー報告機能

---

**Last Updated**: 2026-01-16
**Version**: Phase 22 v1.0
**Maintained by**: FDC Development Team (Human + Claude Code)
