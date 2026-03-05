/**
 * lib/server/auth.ts
 *
 * サーバーサイド認証ヘルパー（Phase 5）
 * Cookie からユーザー情報を取得し、DB のユーザーレコードと紐づける
 */

import type { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * リクエストの fdc_session Cookie からユーザー情報を取得
 * DB にユーザーが存在しない場合は自動作成（デモユーザー対応）
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const fdcSession = request.cookies.get('fdc_session');
  if (!fdcSession?.value) return null;

  try {
    const session = JSON.parse(decodeURIComponent(fdcSession.value));
    const { email, name } = session.user;

    if (!email) return null;

    const supabase = createServiceClient();

    // DB でユーザーを検索
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (user) {
      return user;
    }

    // ユーザーが存在しない場合は作成（デモユーザーなど）
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        name: name || email.split('@')[0],
      })
      .select('id, email, name')
      .single();

    if (error) {
      console.error('User auto-creation failed:', error);
      return null;
    }

    return newUser;
  } catch {
    return null;
  }
}
