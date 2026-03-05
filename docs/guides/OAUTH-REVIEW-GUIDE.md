# OAuth Review Application Guide

## 1. Overview

Google OAuth の Sensitive/Restricted スコープを本番環境で使用するには、
Google による審査（Verification）が必要である。
本ガイドでは、審査申請に必要な準備と手順を説明する。

---

## 2. デモ動画の要件

### 2.1 技術仕様

| 項目 | 要件 |
|------|------|
| 長さ | 1 - 5 分 |
| フォーマット | MP4 推奨 |
| 解像度 | 720p 以上（1080p 推奨） |
| 公開方法 | YouTube に限定公開（unlisted）でアップロード |
| 音声 | 必須ではないが、ナレーション付きが望ましい |
| 字幕 | 英語字幕を推奨 |

### 2.2 デモ動画に含めるべき内容

- アプリケーションの概要説明
- OAuth 同意画面の表示（ユーザーが見る画面）
- 各スコープがどのように使用されているかの具体的なデモ
- データがどのように表示・利用されるかの画面

### 2.3 録画シナリオ例

#### Basic Pattern（Non-sensitive スコープのみ）

```
1. アプリのログインページを表示（0:00 - 0:15）
2. 「Sign in with Google」をクリック（0:15 - 0:30）
3. Google 同意画面が表示される（0:30 - 0:45）
   - openid, email, profile スコープの確認
4. 同意してアプリにリダイレクト（0:45 - 1:00）
5. ダッシュボードにユーザー名・メールが表示される（1:00 - 1:30）
```

#### Sensitive Scope Pattern（Calendar / Tasks スコープ含む）

```
1. アプリのログインページを表示（0:00 - 0:15）
2. 「Sign in with Google」をクリック（0:15 - 0:30）
3. Google 同意画面が表示される（0:30 - 1:00）
   - openid, email, profile スコープの確認
   - calendar.events スコープの確認
   - tasks スコープの確認
4. 同意してアプリにリダイレクト（1:00 - 1:15）
5. ダッシュボードにユーザー情報が表示される（1:15 - 1:30）
6. Google Calendar の予定一覧を表示（1:30 - 2:30）
   - カレンダーイベントの取得
   - イベントからタスクへの変換デモ
7. Google Tasks の一覧を表示（2:30 - 3:30）
   - タスクの双方向同期
   - FDC タスクの変更が Google Tasks に反映される様子
8. 設定画面で Google 連携の解除方法を表示（3:30 - 4:00）
```

---

## 3. Written Explanation テンプレート

### 3.1 Basic Pattern（Non-sensitive スコープのみ）

```
Application Name: FDC Modular
Website: https://your-domain.com

Scopes Requested:
- openid
- email
- profile

Purpose:
FDC Modular is a business management tool for founders and entrepreneurs.
We use Google OAuth for secure user authentication.

Scope Usage:
- openid: Used for OpenID Connect authentication to verify user identity.
- email: Used to retrieve the user's email address for account identification
  and communication purposes.
- profile: Used to retrieve the user's display name and profile picture
  to personalize the application experience.

Data Handling:
- User data is stored securely in Supabase PostgreSQL with Row Level Security.
- All data transmission is encrypted via SSL/TLS.
- Users can delete their account and all associated data at any time.
- Privacy Policy: https://your-domain.com/privacy
- Terms of Service: https://your-domain.com/terms
```

### 3.2 Sensitive Scope Pattern（Calendar / Tasks スコープ含む）

```
Application Name: FDC Modular
Website: https://your-domain.com

Scopes Requested:
- openid
- email
- profile
- https://www.googleapis.com/auth/calendar.events
- https://www.googleapis.com/auth/tasks

Purpose:
FDC Modular is a business management tool for founders and entrepreneurs.
It integrates with Google Calendar and Google Tasks to provide a unified
task and schedule management experience.

Scope Usage:
- openid: Used for OpenID Connect authentication to verify user identity.
- email: Used to retrieve the user's email address for account identification
  and communication purposes.
- profile: Used to retrieve the user's display name and profile picture
  to personalize the application experience.
- calendar.events: Used to read and write Google Calendar events.
  Users can view their calendar events in the FDC dashboard and create
  new events from within the application. This enables unified schedule
  management alongside task and project management features.
- tasks: Used for bidirectional synchronization between FDC tasks and
  Google Tasks. When a user creates or updates a task in FDC, it is
  synced to Google Tasks, and vice versa. This ensures task consistency
  across platforms.

Data Handling:
- OAuth tokens are encrypted at rest using AES-256 encryption in Supabase.
- Google data is only accessed when explicitly requested by the user.
- Calendar events and tasks are cached locally for performance but can
  be cleared by the user at any time.
- Users can revoke Google access from the Settings page or from
  Google Account permissions (https://myaccount.google.com/permissions).
- All data transmission is encrypted via SSL/TLS.
- Row Level Security (RLS) ensures users can only access their own data.
- Privacy Policy: https://your-domain.com/privacy
- Terms of Service: https://your-domain.com/terms

Demo Video: [YouTube unlisted URL]
```

---

## 4. PUBLISH APP 手順

### 4.1 事前チェックリスト

公開前に以下を確認する。

- [ ] プライバシーポリシーページが公開 URL でアクセス可能
- [ ] 利用規約ページが公開 URL でアクセス可能
- [ ] ホームページ URL が正しく設定されている
- [ ] Authorized domains にデプロイ先ドメインが登録されている
- [ ] すべての必要なスコープが設定されている
- [ ] テストユーザーでの動作確認が完了している
- [ ] デモ動画が YouTube にアップロード済み（Sensitive スコープの場合）

### 4.2 公開手順

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIs & Services** > **OAuth consent screen** を選択
3. 画面下部の **PUBLISH APP** ボタンをクリック
4. 確認ダイアログで **CONFIRM** をクリック
5. Non-sensitive スコープのみの場合: 即座に **In production** ステータスに変更される
6. Sensitive/Restricted スコープの場合: **Needs verification** ステータスに変更され、審査プロセスが開始される

---

## 5. Submit for Verification 手順

### 5.1 審査申請

1. **PUBLISH APP** 後、**Needs verification** ステータスが表示される
2. **PREPARE FOR VERIFICATION** ボタンをクリック
3. 以下の情報を入力する

| 入力項目 | 内容 |
|---------|------|
| Official Link to Privacy Policy | `https://your-domain.com/privacy` |
| YouTube Video | デモ動画の URL（unlisted） |
| Written explanation | セクション3のテンプレートを使用 |
| Contact Email | 開発者の連絡先メールアドレス |

4. すべての情報を入力後、**SUBMIT FOR VERIFICATION** をクリック
5. Google からの確認メールを待つ

### 5.2 審査中の注意事項

- 審査中もテストモードでの利用は可能（テストユーザー100人まで）
- OAuth consent screen の設定を変更すると、審査がリセットされる場合がある
- Google から追加情報のリクエストが来た場合は速やかに対応する

---

## 6. 審査タイムライン

| スコープ分類 | 審査期間目安 | 備考 |
|-------------|------------|------|
| Non-sensitive のみ | 不要（即時公開） | `openid`, `email`, `profile` のみ |
| Sensitive | 1 - 4 週間 | Calendar, Tasks 等 |
| Restricted | 4 - 6 週間以上 | Gmail, Drive 等。第三者セキュリティ評価が必要 |

### Restricted スコープの追加要件

- Letter of Assessment（LOA）: 第三者セキュリティ評価機関による評価レポート
- CASA（Cloud Application Security Assessment）: Google 指定のセキュリティ評価
- 年次再審査が必要

---

## 7. よくあるリジェクト理由と対策

| リジェクト理由 | 対策 |
|---------------|------|
| プライバシーポリシーが不十分 | Google API データの使用について明記する。データの保持期間、削除方法を記載する |
| スコープの使用理由が不明確 | Written explanation で各スコープの具体的な使用方法をスクリーンショット付きで説明する |
| デモ動画でスコープの使用が確認できない | すべてのスコープの使用箇所を動画内で明確に示す |
| ホームページがアクセス不可 | デプロイ先の URL が正しく設定されていることを確認する |
| ドメイン認証が未完了 | Google Search Console でドメインの所有権を確認する |
| 過剰なスコープのリクエスト | 実際に使用するスコープのみをリクエストする（最小権限の原則） |
| アプリ名とドメインの不一致 | 同意画面のアプリ名とウェブサイトのブランド名を一致させる |
| データの暗号化が不十分 | OAuth トークンの暗号化保存、SSL/TLS の使用を Written explanation に明記する |

---

## 8. Google からの追加質問への返信テンプレート

### 8.1 スコープの使用理由に関する質問

```
Subject: Re: OAuth Verification - Additional Information for [App Name]

Dear Google OAuth Verification Team,

Thank you for reviewing our application. Below is the additional
information you requested.

[Scope] Usage Explanation:
We use [scope] to [specific functionality]. This is essential for our
application because [reason].

Here is a screenshot showing how [scope] data is used in our application:
[Attach screenshot or provide link]

Users can revoke access to [scope] at any time through:
1. Our application's Settings page
2. Google Account permissions page

Please let us know if you need any further information.

Best regards,
[Your Name]
[Your Title]
[App Name]
```

### 8.2 セキュリティに関する質問

```
Subject: Re: OAuth Verification - Security Information for [App Name]

Dear Google OAuth Verification Team,

Thank you for your inquiry regarding our security practices.

Data Storage:
- User data is stored in Supabase PostgreSQL with Row Level Security (RLS).
- OAuth tokens are encrypted at rest using AES-256 encryption.
- All API communications use SSL/TLS encryption.

Access Control:
- Role-Based Access Control (RBAC) with OWNER/ADMIN/MEMBER roles.
- Row Level Security ensures data isolation between tenants.
- API rate limiting prevents abuse.

Data Retention:
- Account data is deleted within 30 days of account deletion request.
- Access logs are retained for 90 days for security purposes.
- Google API data is deleted when the user revokes access.

Security Practices:
- Regular dependency updates via Dependabot.
- Automated security scanning in CI/CD pipeline.
- Content Security Policy (CSP) headers.
- Input sanitization to prevent injection attacks.

Please let us know if you need any additional details.

Best regards,
[Your Name]
[Your Title]
[App Name]
```

---

## 9. 関連ドキュメント

- [Phase 50: OAuth Consent Screen Configuration](./OAUTH-CONSENT-SETUP.md)
- [Phase 51: Privacy Policy Page](../../app/(public)/privacy/page.tsx)
- [Phase 51: Terms of Service Page](../../app/(public)/terms/page.tsx)
- [Google OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)

---

**Last Updated**: 2026-03-05
**Phase**: 52
