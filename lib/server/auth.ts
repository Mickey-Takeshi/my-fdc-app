/**
 * lib/server/auth.ts
 *
 * サーバーサイド認証ヘルパー（Phase 5）
 * Cookie からユーザー情報を取得し、DB のユーザーレコードと紐づける
 * インメモリキャッシュで同一ユーザーの重複 DB クエリを削減
 */

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

// -- User Cache ---------------------------------------------------------------
// 同一プロセス内で email → user のルックアップ結果をキャッシュ
// API ルートの `getSessionUser()` は毎リクエスト呼ばれるため効果が大きい

interface CachedUser {
  user: SessionUser;
  expiresAt: number;
}

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 分
const USER_CACHE_MAX = 100; // 最大エントリ数
const userCache = new Map<string, CachedUser>();

function getCachedUser(email: string): SessionUser | null {
  const entry = userCache.get(email);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    userCache.delete(email);
    return null;
  }
  return entry.user;
}

function setCachedUser(email: string, user: SessionUser): void {
  // キャッシュサイズ上限チェック（古いエントリを削除）
  if (userCache.size >= USER_CACHE_MAX) {
    const firstKey = userCache.keys().next().value;
    if (firstKey) userCache.delete(firstKey);
  }
  userCache.set(email, { user, expiresAt: Date.now() + USER_CACHE_TTL });
}

// -- Default Workspace --------------------------------------------------------
// 新規ユーザーにデフォルトワークスペースを自動作成

async function ensureDefaultWorkspace(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // 既にワークスペースメンバーシップがあればスキップ
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) return;

    // デフォルトワークスペースを作成（slug は NOT NULL なので生成必須）
    const slug = `my-workspace-${Date.now().toString(36)}`;
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: 'マイワークスペース', slug })
      .select('id')
      .single();

    if (wsError || !ws) {
      console.error('Default workspace creation failed:', wsError);
      return;
    }

    // OWNER として追加
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: ws.id,
        user_id: userId,
        role: 'OWNER',
      });

    if (memberError) {
      console.error('Default workspace member addition failed:', memberError);
      // ワークスペースだけ残るのを防止
      await supabase.from('workspaces').delete().eq('id', ws.id);
    }
  } catch (err) {
    console.error('ensureDefaultWorkspace error:', err);
  }
}

// -- Main Function ------------------------------------------------------------

/**
 * リクエストの fdc_session Cookie からユーザー情報を取得
 * DB にユーザーが存在しない場合は自動作成（デモユーザー対応）
 * キャッシュにより同一ユーザーの連続リクエストを高速化
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

    // キャッシュチェック
    const cached = getCachedUser(email);
    if (cached) return cached;

    const supabase = createServiceClient();

    // DB でユーザーを検索
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (user) {
      // 既存ユーザーにもワークスペースが無ければ自動作成
      await ensureDefaultWorkspace(supabase, user.id);
      setCachedUser(email, user);
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

    if (newUser) {
      setCachedUser(email, newUser);
      // 新規ユーザーにデフォルトワークスペースを自動作成
      await ensureDefaultWorkspace(supabase, newUser.id);
    }

    return newUser;
  } catch {
    return null;
  }
}
