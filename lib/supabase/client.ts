/**
 * lib/supabase/client.ts
 *
 * Supabase クライアント初期化
 * Phase 3: 認証基盤構築
 * Phase 4: Google OAuth 対応
 */

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. Using mock mode.',
    '\nSet NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

/**
 * クライアントサイド用 Supabase クライアント
 * - anon key を使用（RLS 適用）
 * - ブラウザで使用
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * サーバーサイド用 Supabase 管理クライアント
 * - service_role key を使用（RLS バイパス）
 * - API ルートでのみ使用
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Supabase が利用可能かどうかをチェック
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * ブラウザ用 Supabase クライアント（OAuth 用）
 * - SSR 対応
 * - Cookie ベースのセッション管理
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
