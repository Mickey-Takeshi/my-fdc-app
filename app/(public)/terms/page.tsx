/**
 * app/(public)/terms/page.tsx
 *
 * Terms of Service page (Japanese).
 * Required for Google OAuth consent screen configuration.
 * Phase 51: OAuth Authorization - Public Pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - FDC Modular',
  description: 'FDC Modular Terms of Service. Service definition, eligibility, account responsibility, and usage rules.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>

      <p className="mb-6 text-sm text-gray-500">
        最終更新日: 2026年3月5日
      </p>

      <p className="mb-8 leading-relaxed">
        本利用規約（以下「本規約」）は、FDC Modular（以下「本サービス」）の利用に関する
        条件を定めるものです。本サービスをご利用になる前に、本規約をよくお読みください。
        本サービスを利用することにより、本規約に同意したものとみなされます。
      </p>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. サービスの定義</h2>
        <p className="mb-4 leading-relaxed">
          本サービスは、起業家・経営者向けの統合ビジネス管理ツールです。
          以下の機能を提供します。
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>タスク管理（アイゼンハワーマトリクス）</li>
          <li>OKR（Objectives and Key Results）管理</li>
          <li>Action Map（施策管理）</li>
          <li>CRM（リード管理・クライアント管理）</li>
          <li>Brand Strategy / Lean Canvas / MVV</li>
          <li>Google Calendar / Google Tasks との連携</li>
          <li>ワークスペース管理（マルチテナント）</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          本サービスは、Web アプリケーションとして提供されます。
          利用にはインターネット接続および対応するWebブラウザが必要です。
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. 利用資格</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>本サービスの利用には、Google アカウントによる認証が必要です。</li>
          <li>
            18歳未満の方は、保護者の同意を得た上で本サービスをご利用ください。
          </li>
          <li>
            法人としてご利用の場合、本規約に同意する権限を有する方が
            同意を行ってください。
          </li>
          <li>
            本規約に違反した場合、または本サービスの利用が不適切と判断された場合、
            サービス提供者はアカウントを停止または削除する権利を有します。
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. アカウント責任</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            ユーザーは、自身のアカウントで行われるすべての活動について
            責任を負います。
          </li>
          <li>
            アカウントの認証情報（Google アカウント）の管理は
            ユーザー自身の責任において行ってください。
          </li>
          <li>
            アカウントの不正利用が疑われる場合は、速やかにサービス提供者に
            報告してください。
          </li>
          <li>
            ワークスペースの管理者（OWNER / ADMIN）は、招待したメンバーの
            アクセス権限の適切な管理に責任を負います。
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. 禁止事項</h2>
        <p className="mb-4 leading-relaxed">
          本サービスの利用にあたり、以下の行為を禁止します。
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>法令または公序良俗に反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>本サービスのサーバーまたはネットワークに過度な負荷をかける行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>他のユーザーの情報を不正に収集する行為</li>
          <li>他のユーザーになりすます行為</li>
          <li>本サービスを利用した不正な営利活動</li>
          <li>本サービスのリバースエンジニアリング、逆コンパイル、逆アセンブル</li>
          <li>本サービスの脆弱性を悪用する行為</li>
          <li>自動化ツールを用いた大量アクセス（スクレイピング等）</li>
          <li>その他、サービス提供者が不適切と判断する行為</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. 知的財産権</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            本サービスに関する知的財産権（著作権、商標権、特許権等）は、
            サービス提供者またはそのライセンサーに帰属します。
          </li>
          <li>
            ユーザーが本サービスに入力したデータの知的財産権は、
            ユーザーに帰属します。
          </li>
          <li>
            サービス提供者は、サービスの提供・改善に必要な範囲で、
            ユーザーデータを利用する権利を有します（個人を特定しない統計データ等）。
          </li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. 免責事項</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            本サービスは「現状有姿」で提供されます。サービス提供者は、
            本サービスの完全性、正確性、信頼性、適合性について、
            明示的または黙示的な保証を行いません。
          </li>
          <li>
            本サービスの利用により生じた損害（データの消失、業務上の損失、
            逸失利益等を含む）について、サービス提供者は責任を負いません。
          </li>
          <li>
            Google API との連携に起因する障害やデータの不整合について、
            サービス提供者は責任を負いません。
          </li>
          <li>
            天災、システム障害、第三者による攻撃等の不可抗力により
            サービスが中断した場合、サービス提供者は責任を負いません。
          </li>
          <li>
            有料プランの利用に関する返金は、サービス提供者の返金ポリシーに
            従うものとします。
          </li>
        </ul>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. サービス変更・終了</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            サービス提供者は、事前の通知なく、本サービスの機能を変更、
            追加、または削除する権利を有します。
          </li>
          <li>
            本サービスの全部または一部の提供を終了する場合、
            合理的な期間の事前通知を行うよう努めます。
          </li>
          <li>
            サービス終了時には、ユーザーがデータをエクスポートするための
            十分な期間を設けるよう努めます。
          </li>
        </ul>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. 解約・終了</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            ユーザーは、いつでも本サービスの利用を終了することができます。
          </li>
          <li>
            アカウントの削除を希望する場合は、設定ページから削除をリクエストするか、
            サポートにお問い合わせください。
          </li>
          <li>
            アカウント削除後、ユーザーのデータはプライバシーポリシーに
            定める期間内に削除されます。
          </li>
          <li>
            有料プランの解約は、サブスクリプション管理画面（Stripe Customer Portal）
            から行うことができます。解約後も現在の請求期間の終了まで
            サービスを利用できます。
          </li>
          <li>
            本規約に違反した場合、サービス提供者は予告なくアカウントを
            停止または削除する権利を有します。
          </li>
        </ul>
      </section>

      {/* Section 9 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">9. 準拠法・管轄裁判所</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            本規約は、日本法に準拠し、日本法に従って解釈されるものとします。
          </li>
          <li>
            本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mb-10 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">お問い合わせ</h2>
        <p className="leading-relaxed">
          本規約に関するご質問は、以下のメールアドレスまでお問い合わせください。
        </p>
        <p className="mt-4">
          <strong>メール</strong>: support@example.com
        </p>
      </section>
    </div>
  );
}
