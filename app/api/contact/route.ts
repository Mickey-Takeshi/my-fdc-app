import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  companyName: z.string().optional(),
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  message: z.string().min(1, 'お問い合わせ内容は必須です'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // メール送信（Resend/SendGrid設定時に有効化）
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: process.env.CONTACT_NOTIFY_EMAIL,
    //   subject: '【お問い合わせ】新規お問い合わせがありました',
    //   html: `<h2>新規お問い合わせ</h2><p>会社名: ${data.companyName || '未入力'}</p><p>お名前: ${data.name}</p><p>メール: ${data.email}</p><p>内容: ${data.message}</p>`,
    // });

    console.log('[Contact] New inquiry:', {
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      message: data.message.substring(0, 100),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
