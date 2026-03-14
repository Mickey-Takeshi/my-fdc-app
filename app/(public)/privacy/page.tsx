/**
 * app/(public)/privacy/page.tsx
 *
 * Privacy Policy page (Japanese).
 * Required for Google OAuth consent screen configuration.
 * Phase 51: OAuth Authorization - Public Pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - FDC Modular',
  description: 'FDC Modular Privacy Policy. Information about data collection, usage, sharing, and user rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <p className="mb-6 text-sm text-gray-500">
        最終更新日: 2026年3月5日
      </p>

      <p className="mb-8 leading-relaxed">
        FDC Modular（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
        個人情報の保護に努めます。本プライバシーポリシーは、本サービスが収集する情報、
        その使用目的、および情報の管理方法について説明します。
      </p>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. 収集する情報</h2>
        <p className="mb-4 leading-relaxed">
          本サービスは、以下の情報を収集する場合があります。
        </p>

        <h3 className="text-lg font-medium mb-2">1.1 Google アカウント情報</h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>氏名</li>
          <li>メールアドレス</li>
          <li>プロフィール画像 URL</li>
          <li>Google アカウント ID</li>
        </ul>

        <h3 className="text-lg font-medium mb-2">1.2 Google サービスデータ</h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Google Calendar のイベント情報（タイトル、日時、説明）</li>
          <li>Google Tasks のタスク情報（タイトル、期日、ステータス）</li>
        </ul>

        <h3 className="text-lg font-medium mb-2">1.3 自動的に収集される情報</h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Cookie およびセッション情報</li>
          <li>アクセスログ（IP アドレス、ブラウザ種別、アクセス日時）</li>
          <li>デバイス情報（OS、画面解像度）</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. 情報の使用目的</h2>
        <p className="mb-4 leading-relaxed">
          収集した情報は、以下の目的で使用します。
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>ユーザー認証およびアカウント管理</li>
          <li>本サービスの提供・運営・維持</li>
          <li>Google Calendar / Google Tasks との連携機能の提供</li>
          <li>本サービスの改善およびユーザー体験の向上</li>
          <li>セキュリティの確保および不正利用の防止</li>
          <li>法令に基づく対応</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. 情報の共有</h2>
        <p className="mb-4 leading-relaxed">
          本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
        </p>

        <h3 className="text-lg font-medium mb-2">3.1 サービス提供に必要な第三者</h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong>Supabase</strong> - データベースおよび認証基盤として使用。
            ユーザー情報およびアプリケーションデータを保存します。
          </li>
          <li>
            <strong>Stripe</strong> - 決済処理に使用。
            決済に必要な情報のみを共有します。
          </li>
          <li>
            <strong>Vercel</strong> - アプリケーションのホスティングに使用。
            アクセスログが保存される場合があります。
          </li>
        </ul>

        <h3 className="text-lg font-medium mb-2">3.2 法的要件</h3>
        <p className="leading-relaxed">
          法令に基づく要請、裁判所の命令、またはその他の法的手続きに従い、
          情報を開示する場合があります。
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. データ保持期間</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>アカウントデータ</strong>: アカウント削除のリクエストを受領後、
            30日以内にすべての個人データを削除します。
          </li>
          <li>
            <strong>アクセスログ</strong>: セキュリティ目的で最大90日間保持し、
            その後自動的に削除されます。
          </li>
          <li>
            <strong>バックアップデータ</strong>: データベースバックアップは最大30日間保持し、
            その後自動的に削除されます。
          </li>
          <li>
            <strong>Google 連携データ</strong>: Google アカウントの連携解除時、
            またはアカウント削除時に、保存されたトークンおよび同期データを削除します。
          </li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. ユーザーの権利</h2>
        <p className="mb-4 leading-relaxed">
          ユーザーは、以下の権利を有します。
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>データアクセス権</strong>: 本サービスが保持するご自身のデータの開示を請求する権利
          </li>
          <li>
            <strong>データ削除権</strong>: ご自身のデータの削除を請求する権利
          </li>
          <li>
            <strong>データ訂正権</strong>: ご自身のデータの訂正を請求する権利
          </li>
          <li>
            <strong>同意撤回権</strong>: データ収集・使用に関する同意をいつでも撤回する権利
          </li>
          <li>
            <strong>Google アクセス権の取消</strong>:{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google アカウント設定
            </a>
            {' '}から、本サービスへのアクセス許可をいつでも取り消すことができます。
          </li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. セキュリティ対策</h2>
        <p className="mb-4 leading-relaxed">
          本サービスは、ユーザーの情報を保護するために以下のセキュリティ対策を実施しています。
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>SSL/TLS による通信の暗号化</li>
          <li>データベース内の機密データの暗号化（OAuth トークン等）</li>
          <li>Row Level Security（RLS）によるデータアクセス制御</li>
          <li>Content Security Policy（CSP）ヘッダーの設定</li>
          <li>入力データのサニタイズによるインジェクション攻撃の防止</li>
          <li>API レート制限による不正アクセスの防止</li>
          <li>定期的なセキュリティ監査の実施</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. 連絡先</h2>
        <p className="leading-relaxed">
          本プライバシーポリシーに関するご質問やデータに関するリクエストは、
          以下のメールアドレスまでお問い合わせください。
        </p>
        <p className="mt-4">
          <strong>メール</strong>: support@example.com
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. ポリシー更新</h2>
        <p className="mb-4 leading-relaxed">
          本プライバシーポリシーは、法令の変更やサービス内容の変更に伴い、
          予告なく更新される場合があります。重要な変更がある場合は、
          本サービス上での通知またはメールにてお知らせします。
        </p>
        <p className="leading-relaxed">
          最新のプライバシーポリシーは、常に本ページで確認することができます。
          本ポリシーへの同意後に本サービスの利用を継続された場合、
          変更後のポリシーに同意したものとみなします。
        </p>
      </section>
    </div>
  );
}
