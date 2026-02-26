/**
 * app/api/auth/demo/route.ts
 *
 * デモログイン API
 * パスワード "fdc" でデモユーザーとしてセッションを作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertUser, createSession } from '@/lib/server/auth';

const DEMO_PASSWORD = 'fdc';
const SESSION_COOKIE_NAME = 'fdc_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7日

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: 'パスワードが違います' },
        { status: 401 }
      );
    }

    // デモユーザーを upsert
    const userId = await upsertUser(
      'demo@example.com',
      'Demo User'
    );

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザー作成に失敗しました' },
        { status: 500 }
      );
    }

    // セッション作成
    const token = await createSession(userId);

    if (!token) {
      return NextResponse.json(
        { error: 'セッション作成に失敗しました' },
        { status: 500 }
      );
    }

    // クッキーにセッションをセット
    const response = NextResponse.json({
      user: { id: userId, email: 'demo@example.com', name: 'Demo User' },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('[Demo Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
