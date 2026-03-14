/**
 * app/api/contact/route.ts
 *
 * 汎用お問い合わせフォーム処理
 * Resendを使用してメール送信
 *
 * 使用方法:
 * 1. npm install resend
 * 2. 環境変数を設定:
 *    - RESEND_API_KEY: ResendのAPIキー
 *    - CONTACT_NOTIFY_EMAIL: 通知先メールアドレス
 *    - RESEND_FROM_EMAIL: 送信元メールアドレス（Resendで認証済みドメイン）
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
}

/**
 * HTML 特殊文字をエスケープして XSS を防止
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // バリデーション
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: '必須項目が入力されていません（name, email, message）' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }

    // Resend APIキーのチェック
    const apiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

    if (!apiKey) {
      console.error('[contact API] RESEND_API_KEY is not set');
      return NextResponse.json(
        { error: 'メール設定が不正です（RESEND_API_KEY未設定）' },
        { status: 500 }
      );
    }

    if (!notifyEmail) {
      console.error('[contact API] CONTACT_NOTIFY_EMAIL is not set');
      return NextResponse.json(
        { error: 'メール設定が不正です（CONTACT_NOTIFY_EMAIL未設定）' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // XSS 防止: ユーザー入力をエスケープ
    const safeName = escapeHtml(body.name);
    const safeEmail = escapeHtml(body.email);
    const safeCompany = body.company ? escapeHtml(body.company) : '';
    const safePhone = body.phone ? escapeHtml(body.phone) : '';
    const safeSubject = body.subject ? escapeHtml(body.subject) : '';
    const safeMessage = escapeHtml(body.message);

    const { error } = await resend.emails.send({
      from: `お問い合わせ <${fromEmail}>`,
      to: notifyEmail,
      subject: body.subject
        ? `【お問い合わせ】${safeSubject}`
        : `【お問い合わせ】${safeName}様より`,
      html: `
        <h2>お問い合わせがありました</h2>

        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold; width: 150px;">
              お名前
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${safeName}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;">
              メールアドレス
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${safeEmail}
            </td>
          </tr>
          ${safeCompany ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;">
              会社名
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${safeCompany}
            </td>
          </tr>
          ` : ''}
          ${safePhone ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;">
              電話番号
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${safePhone}
            </td>
          </tr>
          ` : ''}
          ${safeSubject ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;">
              件名
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${safeSubject}
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold; vertical-align: top;">
              お問い合わせ内容
            </td>
            <td style="padding: 12px; border: 1px solid #ddd; white-space: pre-wrap;">
              ${safeMessage}
            </td>
          </tr>
        </table>

        <p style="margin-top: 24px; color: #666;">
          このメールはお問い合わせフォームから自動送信されました。
        </p>
      `,
      text: `
お問い合わせがありました

■ お名前
${body.name}

■ メールアドレス
${body.email}
${body.company ? `
■ 会社名
${body.company}` : ''}
${body.phone ? `
■ 電話番号
${body.phone}` : ''}
${body.subject ? `
■ 件名
${body.subject}` : ''}

■ お問い合わせ内容
${body.message}
      `,
    });

    if (error) {
      console.error('[contact API] Resend error:', error);
      return NextResponse.json(
        { error: 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact API] Error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
