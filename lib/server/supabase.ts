/**
 * lib/server/supabase.ts
 *
 * Supabase クライアント（サーバー用）
 * Phase 3: Service Role Key で RLS をバイパスして管理者操作を行う
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service Role Key を使用するサーバー用クライアント
 * RLS をバイパスするため、サーバーサイドでのみ使用すること
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
