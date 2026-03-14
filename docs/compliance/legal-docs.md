# 法務ドキュメント設計書（Phase 77）

> FDC Modular Starter における利用規約、プライバシーポリシー、同意管理、Cookie 同意の設計を定義する。

---

## 1. 利用規約（Terms of Service）

### 1.1 条文構成

| 条 | タイトル | 概要 |
|----|---------|------|
| 第1条 | 適用 | 本規約の適用範囲と同意方法 |
| 第2条 | 定義 | 本サービス、ユーザー、ワークスペース等の用語定義 |
| 第3条 | アカウント登録 | 登録要件、本人確認、アカウント管理責任 |
| 第4条 | 料金・支払い | プラン、課金サイクル、返金ポリシー |
| 第5条 | 禁止行為 | サービス利用における禁止事項 |
| 第6条 | 知的財産権 | コンテンツの権利帰属、ライセンス範囲 |
| 第7条 | 免責事項 | サービス提供に関する免責範囲 |
| 第8条 | サービスの変更・終了 | 変更通知、終了時のデータ取扱い |
| 第9条 | 解約 | 解約手続き、データ保持期間 |
| 第10条 | 準拠法・管轄 | 準拠法、紛争解決、管轄裁判所 |

### 1.2 禁止行為一覧

```
禁止行為（第5条）:

1. 法令違反行為
   - 法令または公序良俗に違反する行為
   - 犯罪行為に関連する行為

2. サービス妨害行為
   - サーバーへの過負荷攻撃（DoS/DDoS）
   - 不正アクセスまたはその試み
   - リバースエンジニアリング、逆コンパイル
   - 自動化ツールによる大量アクセス（API制限を超える利用）

3. 不正利用
   - 他ユーザーのアカウントへの不正アクセス
   - 虚偽情報でのアカウント登録
   - 第三者への再販売・再配布

4. コンテンツ関連
   - 違法コンテンツのアップロード
   - 知的財産権を侵害するコンテンツの投稿
   - マルウェア、ウイルスの配布

5. その他
   - 当社の事前承諾なくサービスを商用利用する行為
   - 他ユーザーの個人情報を収集する行為
```

### 1.3 バージョン管理

| 項目 | ルール |
|------|--------|
| バージョン形式 | YYYY.MM.DD（例: 2026.03.05） |
| 変更通知 | 重要変更は30日前にメールで通知 |
| 旧版保持 | 変更日から1年間は旧バージョンを閲覧可能 |
| 同意方法 | 登録時にチェックボックスで明示的同意 |
| 再同意 | 重要変更時はログイン時に再同意を要求 |

### 1.4 バージョン管理テーブル

```sql
CREATE TABLE terms_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(10) NOT NULL,          -- YYYY.MM.DD
  content_ja TEXT NOT NULL,              -- 日本語版
  content_en TEXT,                       -- 英語版（将来対応）
  change_summary TEXT NOT NULL,          -- 変更概要
  effective_date TIMESTAMPTZ NOT NULL,   -- 発効日
  notification_date TIMESTAMPTZ,         -- 通知送信日
  is_current BOOLEAN DEFAULT false,      -- 現行版フラグ
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 現行版は1つのみ
CREATE UNIQUE INDEX idx_terms_current ON terms_versions (is_current) WHERE is_current = true;
```

---

## 2. プライバシーポリシー（Privacy Policy）

### 2.1 セクション構成

| # | セクション | 概要 |
|---|-----------|------|
| 1 | 収集する情報 | 収集するデータの種類と取得方法 |
| 2 | 利用目的 | 収集データの具体的な利用目的 |
| 3 | 第三者への提供 | データ共有先と条件 |
| 4 | 保管・セキュリティ | データの保管場所と保護措置 |
| 5 | ユーザーの権利 | アクセス権、訂正権、削除権等 |
| 6 | Cookie | Cookie の利用方法と設定 |
| 7 | 子どものプライバシー | 未成年者への対応方針 |
| 8 | ポリシーの変更 | 変更通知の方法と手順 |
| 9 | お問い合わせ | 問い合わせ先と連絡方法 |

### 2.2 収集情報の分類

| カテゴリ | 収集データ | 取得方法 | 必須/任意 |
|---------|-----------|---------|-----------|
| アカウント情報 | 氏名、メールアドレス、プロフィール画像 | Google OAuth 経由 | 必須 |
| 利用データ | アクセスログ、操作履歴、画面遷移 | 自動取得 | 必須 |
| 決済データ | プラン情報、支払い履歴、請求先 | Stripe 経由 | 有料プランのみ |
| サポート履歴 | 問い合わせ内容、対応履歴 | ユーザー入力 | 任意 |

### 2.3 第三者サービス一覧

| サービス | 利用目的 | 共有データ | データ所在地 |
|---------|---------|-----------|-------------|
| Supabase | データベース・認証 | アカウント情報、アプリデータ | AWS（東京リージョン） |
| Stripe | 決済処理 | 決済情報、顧客ID | 米国（PCI DSS準拠） |
| Vercel | ホスティング・CDN | アクセスログ | グローバル（エッジ） |
| Resend | メール送信 | メールアドレス、送信内容 | 米国 |

---

## 3. 同意管理システム

### 3.1 同意種別

| 同意種別 | 必須/任意 | デフォルト | 説明 |
|---------|-----------|-----------|------|
| 利用規約 | 必須 | - | サービス利用の前提条件 |
| プライバシーポリシー | 必須 | - | 個人情報取扱いへの同意 |
| マーケティング通知 | 任意 | OFF | プロモーション、ニュースレター |
| Cookie（分析） | 任意 | OFF | アクセス解析用 Cookie |

### 3.2 同意記録データ

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,      -- tos, privacy, marketing, cookies
  version VARCHAR(10) NOT NULL,           -- 同意時の規約バージョン
  granted BOOLEAN NOT NULL,               -- 同意/拒否
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,                        -- 同意時のIPアドレス
  user_agent TEXT,                         -- 同意時のユーザーエージェント
  withdrawn_at TIMESTAMPTZ,               -- 同意撤回日時
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, consent_type, version)
);

-- インデックス
CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);
```

### 3.3 同意フロー

```
[新規登録フロー]

+------------------------------------------+
| アカウント登録画面                         |
|                                          |
|  Google でログイン                        |
|  ============================            |
|                                          |
|  [x] 利用規約に同意する（必須）            |
|      -> 利用規約全文へのリンク             |
|                                          |
|  [x] プライバシーポリシーに同意する（必須） |
|      -> ポリシー全文へのリンク             |
|                                          |
|  [ ] マーケティング通知を受け取る（任意）   |
|                                          |
|  [登録する]                               |
+------------------------------------------+
         |
         v
+------------------------------------------+
| 同意記録を DB に保存                       |
| - user_id, consent_type, version         |
| - granted_at, ip_address, user_agent     |
+------------------------------------------+
         |
         v
+------------------------------------------+
| アカウント作成完了                         |
| -> ダッシュボードへリダイレクト             |
+------------------------------------------+
```

### 3.4 同意更新シナリオ

```
[シナリオ1: ポリシー改定時の再同意]

規約改定
  |
  v
ユーザーがログイン
  |
  v
改定版の同意が未取得？ --No--> 通常画面表示
  |
  Yes
  v
+------------------------------------------+
| 規約変更のお知らせ                         |
|                                          |
| 利用規約が更新されました（v2026.04.01）    |
|                                          |
| 主な変更点:                               |
| - 第4条（料金）の改定                     |
| - 第8条（サービス終了）の追加             |
|                                          |
| [変更内容を確認]  [同意して続ける]         |
+------------------------------------------+


[シナリオ2: 設定画面からの同意撤回]

設定 > プライバシー設定
  |
  v
+------------------------------------------+
| プライバシー設定                           |
|                                          |
| マーケティング通知: [ON/OFF トグル]        |
| Cookie（分析）:     [ON/OFF トグル]        |
|                                          |
| [変更を保存]                              |
+------------------------------------------+
  |
  v
user_consents テーブルに withdrawn_at を記録


[シナリオ3: メールリンクからの配信停止]

メール内の「配信停止」リンクをクリック
  |
  v
/api/consents/unsubscribe?token=xxx
  |
  v
marketing 同意を撤回（withdrawn_at を記録）
  |
  v
「配信停止が完了しました」画面を表示
```

---

## 4. Cookie 同意

### 4.1 Cookie 分類

| 分類 | 同意 | 目的 | 例 |
|------|------|------|-----|
| 必須（Essential） | 不要 | サービス提供に必要 | セッション Cookie、認証トークン |
| 分析（Analytics） | 必要 | 利用状況の分析 | PostHog、アクセス解析 |
| マーケティング（Marketing） | 必要 | 広告・リターゲティング | 広告トラッキング（将来対応） |

### 4.2 Cookie バナー

```
+------------------------------------------------------------------+
|                                                                  |
|  当サイトでは、サービス提供に必要な Cookie のほか、              |
|  利用状況の分析のために Cookie を使用しています。                |
|                                                                  |
|  [詳細設定]    [必要な Cookie のみ]    [すべて許可]              |
|                                                                  |
+------------------------------------------------------------------+

[詳細設定] クリック時:

+------------------------------------------------------------------+
|                                                                  |
|  Cookie 設定                                                     |
|  ============================                                    |
|                                                                  |
|  必須 Cookie              [常にON]   (変更不可)                  |
|  セッション管理、認証に必要な Cookie                              |
|                                                                  |
|  分析 Cookie              [ON/OFF]                               |
|  サービス改善のための利用状況分析                                 |
|                                                                  |
|  マーケティング Cookie    [ON/OFF]                               |
|  広告配信の最適化（現在未使用）                                   |
|                                                                  |
|  [設定を保存]                                                    |
|                                                                  |
+------------------------------------------------------------------+
```

### 4.3 同意設定の保存

| 項目 | 値 |
|------|-----|
| 保存先 | localStorage |
| キー | cookie-consent |
| 有効期限 | 1年（365日） |
| データ形式 | JSON |

```typescript
// Cookie 同意設定の型定義
interface CookieConsent {
  essential: true;          // 常に true（変更不可）
  analytics: boolean;       // 分析 Cookie の同意状態
  marketing: boolean;       // マーケティング Cookie の同意状態
  consentedAt: string;      // ISO 8601 形式のタイムスタンプ
  expiresAt: string;        // 有効期限（1年後）
  version: string;          // Cookie ポリシーバージョン
}

// localStorage への保存例
const consent: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  consentedAt: '2026-03-05T10:00:00Z',
  expiresAt: '2027-03-05T10:00:00Z',
  version: '2026.03.05'
};

localStorage.setItem('cookie-consent', JSON.stringify(consent));
```

### 4.4 Cookie 同意チェック関数

```typescript
// lib/utils/cookie-consent.ts

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('cookie-consent');
  if (!stored) return null;

  const consent: CookieConsent = JSON.parse(stored);

  // 有効期限チェック
  if (new Date(consent.expiresAt) < new Date()) {
    localStorage.removeItem('cookie-consent');
    return null;
  }

  return consent;
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics ?? false;
}

export function hasMarketingConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.marketing ?? false;
}

export function setCookieConsent(
  analytics: boolean,
  marketing: boolean,
  version: string
): void {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const consent: CookieConsent = {
    essential: true,
    analytics,
    marketing,
    consentedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    version,
  };

  localStorage.setItem('cookie-consent', JSON.stringify(consent));
}
```

---

## 5. 法務ページ構成

### 5.1 ページ一覧

| パス | ページ名 | 認証 | 備考 |
|------|---------|------|------|
| /terms | 利用規約 | 不要 | 公開ページ |
| /privacy | プライバシーポリシー | 不要 | 公開ページ |
| /legal/tokushoho | 特定商取引法に基づく表記 | 不要 | 日本法対応 |
| /legal/cookies | Cookie ポリシー | 不要 | Cookie 詳細 |

### 5.2 共通レイアウト

```
+------------------------------------------------------------------+
|  [ロゴ]                              [ホーム] [ログイン]          |
+------------------------------------------------------------------+
|                                                                  |
|  # ページタイトル                                                 |
|                                                                  |
|  最終更新日: 2026年3月5日                                        |
|  バージョン: 2026.03.05                                          |
|                                                                  |
|  -------------------------------------------------------------- |
|                                                                  |
|  ## 目次                                                         |
|  1. セクション1                                                  |
|  2. セクション2                                                  |
|  ...                                                             |
|                                                                  |
|  -------------------------------------------------------------- |
|                                                                  |
|  ## 1. セクション1                                               |
|  本文テキスト...                                                  |
|                                                                  |
|  ## 2. セクション2                                               |
|  本文テキスト...                                                  |
|                                                                  |
+------------------------------------------------------------------+
|  (C) 2026 FDC | 利用規約 | プライバシー | 特商法表記              |
+------------------------------------------------------------------+
```

### 5.3 レイアウトコンポーネント

```typescript
// app/(public)/layout.tsx
interface LegalPageProps {
  title: string;
  version: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  version,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Logo />
        <nav>
          <Link href="/">ホーム</Link>
          <Link href="/login">ログイン</Link>
        </nav>
      </header>

      <main className="legal-content">
        <h1>{title}</h1>
        <div className="legal-meta">
          <p>最終更新日: {lastUpdated}</p>
          <p>バージョン: {version}</p>
        </div>
        <hr />
        {children}
      </main>

      <footer className="legal-footer">
        <p>&copy; 2026 FDC</p>
        <nav>
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシー</Link>
          <Link href="/legal/tokushoho">特商法表記</Link>
        </nav>
      </footer>
    </div>
  );
}
```

---

## 6. 実装チェックリスト

### Phase 77A: 利用規約

- [ ] terms_versions テーブル作成（マイグレーション）
- [ ] /terms ページ実装（全10条）
- [ ] バージョン表示・旧版閲覧機能
- [ ] 利用規約同意チェックボックス（登録フロー）

### Phase 77B: プライバシーポリシー

- [ ] /privacy ページ実装（全9セクション）
- [ ] 収集情報一覧の表形式表示
- [ ] 第三者サービス一覧の更新機能
- [ ] プライバシーポリシー同意チェックボックス

### Phase 77C: 同意管理

- [ ] user_consents テーブル作成（マイグレーション）
- [ ] 同意記録 API（POST /api/consents）
- [ ] 同意確認 API（GET /api/consents/:userId）
- [ ] 同意撤回 API（PATCH /api/consents/:id/withdraw）
- [ ] 再同意フロー（ログイン時チェック）
- [ ] メール配信停止 API（GET /api/consents/unsubscribe）

### Phase 77D: Cookie 同意

- [ ] CookieConsentBanner コンポーネント
- [ ] Cookie 詳細設定モーダル
- [ ] cookie-consent localStorage 管理
- [ ] /legal/cookies ページ
- [ ] 分析 Cookie の条件付き読み込み

### Phase 77E: 特定商取引法

- [ ] /legal/tokushoho ページ実装
- [ ] 事業者情報の記載
- [ ] 返金ポリシーの記載

---

**Last Updated**: 2026-03-05
**Phase**: 77
**Status**: 設計完了
