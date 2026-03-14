import { createAdminClient } from '@/lib/supabase/admin';

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  'crm:dashboard': true,
  'crm:tags': true,
  'forms:builder': true,
  'billing:gmail_monitor': false,
  'billing:auto_confirm': false,
};

export async function isFeatureEnabled(
  workspaceId: string,
  featureKey: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('workspace_feature_flags')
    .select('is_enabled')
    .eq('workspace_id', workspaceId)
    .eq('feature_key', featureKey)
    .single();

  if (data) {
    return data.is_enabled;
  }

  return DEFAULT_FEATURE_FLAGS[featureKey] ?? false;
}
