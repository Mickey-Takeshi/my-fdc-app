# OAuth Consent Screen Configuration Guide

## 1. Overview

Google Cloud Console の OAuth 同意画面（OAuth Consent Screen）は、ユーザーがアプリケーションに Google アカウントへのアクセスを許可する際に表示される画面である。
本ガイドでは、FDC Modular の OAuth 同意画面の設定手順を説明する。

---

## 2. Google Cloud Console での設定手順

### 2.1 プロジェクト作成・選択

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクトセレクターからプロジェクトを選択（または新規作成）
3. 左側メニューから **APIs & Services** > **OAuth consent screen** を選択

### 2.2 User Type の選択

| User Type | 対象 | 制限 |
|-----------|------|------|
| Internal | Google Workspace 組織内のユーザーのみ | 組織内限定、審査不要 |
| External | すべての Google アカウント | テストモードでは100人まで、本番は審査必要 |

FDC Modular は **External** を選択する。

### 2.3 同意画面の設定

**OAuth consent screen** タブで以下の情報を入力する。

---

## 3. 必須フィールド一覧

| フィールド | 説明 | 入力例 |
|-----------|------|--------|
| App name | アプリケーション名（ユーザーに表示される） | `FDC Modular` |
| User support email | ユーザーサポート用メールアドレス | `support@example.com` |
| App logo | アプリケーションロゴ（120x120px 推奨、PNG/JPG） | `logo.png` |
| Application home page | アプリケーションのホームページ URL | `https://your-domain.com` |
| Application privacy policy link | プライバシーポリシーページ URL | `https://your-domain.com/privacy` |
| Application terms of service link | 利用規約ページ URL | `https://your-domain.com/terms` |
| Authorized domains | 認可済みドメイン（トップレベルドメインを登録） | `your-domain.com` |
| Developer contact information | 開発者連絡先メールアドレス（Google からの通知用） | `dev@example.com` |

### 注意事項

- **App logo**: 審査時に確認される。公序良俗に反する画像は不可。
- **Authorized domains**: OAuth リダイレクト URI のドメインと一致させる必要がある。`localhost` は自動的に許可されるため登録不要。
- **Privacy policy / Terms of service**: 本番公開時には実際にアクセス可能な URL を設定する必要がある（Phase 51 で作成するページを指定）。

---

## 4. スコープの種類と設定

### 4.1 スコープ分類

| 分類 | スコープ例 | 審査要件 |
|------|-----------|---------|
| Non-sensitive（非機密） | `openid`, `email`, `profile` | 審査不要 |
| Sensitive（機密） | `calendar.readonly`, `calendar.events`, `tasks`, `tasks.readonly` | Google による審査が必要 |
| Restricted（制限付き） | `gmail.readonly`, `drive.readonly` | Google による厳格な審査 + セキュリティ評価が必要 |

### 4.2 FDC Modular で使用するスコープ

| スコープ | 分類 | 用途 |
|---------|------|------|
| `openid` | Non-sensitive | OpenID Connect 認証 |
| `email` | Non-sensitive | メールアドレス取得 |
| `profile` | Non-sensitive | ユーザー名・プロフィール画像取得 |
| `https://www.googleapis.com/auth/calendar.events` | Sensitive | Google Calendar イベントの読み書き |
| `https://www.googleapis.com/auth/tasks` | Sensitive | Google Tasks の読み書き |

### 4.3 スコープの追加手順

1. **OAuth consent screen** > **Scopes** セクションで **ADD OR REMOVE SCOPES** をクリック
2. 使用するスコープにチェックを入れる
3. **UPDATE** をクリックして保存

---

## 5. テストモード vs 本番モード

### 5.1 テストモード（Publishing status: Testing）

| 項目 | 内容 |
|------|------|
| ユーザー制限 | テストユーザーとして登録した最大100人のみ |
| トークン有効期限 | 7日間（7日後に再認証が必要） |
| 同意画面の表示 | 「このアプリは確認されていません」警告が表示される |
| 審査 | 不要 |
| 用途 | 開発・テスト段階 |

**テストユーザーの追加方法**:

1. **OAuth consent screen** > **Test users** セクション
2. **ADD USERS** をクリック
3. テストユーザーの Google メールアドレスを入力
4. **SAVE** をクリック

### 5.2 本番モード（Publishing status: In production）

| 項目 | 内容 |
|------|------|
| ユーザー制限 | なし（すべての Google ユーザーが利用可能） |
| トークン有効期限 | リフレッシュトークンで自動更新（期限なし） |
| 同意画面の表示 | 警告なしで表示 |
| 審査 | Sensitive/Restricted スコープ使用時は必要 |
| 用途 | 本番運用 |

### 5.3 テストモードから本番モードへの移行

1. **OAuth consent screen** ページで **PUBLISH APP** をクリック
2. Non-sensitive スコープのみの場合: 即座に本番モードに移行
3. Sensitive/Restricted スコープの場合: Google の審査プロセスが開始される

---

## 6. 審査要件（Sensitive スコープ使用時）

### 6.1 必要な準備

| 要件 | 詳細 |
|------|------|
| プライバシーポリシー | 公開 URL でアクセス可能なプライバシーポリシーページ |
| 利用規約 | 公開 URL でアクセス可能な利用規約ページ |
| ホームページ | アプリケーションのランディングページ |
| デモ動画 | アプリの使用方法を示す動画（YouTube unlisted 推奨） |
| Written explanation | 各スコープの使用理由を説明する文書（英語） |
| ドメイン認証 | Google Search Console でドメインの所有権を確認 |

### 6.2 ドメイン認証手順

1. [Google Search Console](https://search.google.com/search-console/) にアクセス
2. ドメインプロパティを追加
3. DNS レコード（TXT）でドメインの所有権を確認
4. OAuth consent screen の Authorized domains にドメインを追加

### 6.3 審査のタイムライン

| スコープ分類 | 審査期間目安 |
|-------------|------------|
| Non-sensitive のみ | 審査不要（即時公開可能） |
| Sensitive | 1 - 4 週間 |
| Restricted | 4 - 6 週間以上（セキュリティ評価を含む） |

---

## 7. よくある問題と対処

| 問題 | 原因 | 対処法 |
|------|------|--------|
| 「このアプリは確認されていません」警告 | テストモードまたは未審査 | テストユーザーを追加するか、審査を完了する |
| リダイレクト URI エラー | Authorized redirect URIs の設定ミス | Credentials ページで正しい URI を追加 |
| スコープ不足エラー | 必要なスコープが未設定 | OAuth consent screen でスコープを追加 |
| トークン期限切れ（7日） | テストモードの制限 | 本番モードに移行するか、再認証する |
| ドメイン認証エラー | Authorized domains 未設定 | Search Console でドメイン認証後に追加 |

---

## 8. 関連ドキュメント

- [Phase 51: Privacy Policy / Terms of Service](../../app/(public)/privacy/page.tsx)
- [Phase 52: OAuth Review Application Guide](./OAUTH-REVIEW-GUIDE.md)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Consent Screen Help](https://support.google.com/cloud/answer/10311615)

---

**Last Updated**: 2026-03-05
**Phase**: 50
