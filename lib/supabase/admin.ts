import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient<any, any, any> | null = null;

export function getAdminClient(): SupabaseClient<any, any, any> {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
