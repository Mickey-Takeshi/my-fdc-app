export const FEATURE_FLAGS = {
  'crm:dashboard': true,
  'crm:tags': true,
  'forms:builder': true,
  'billing:gmail_monitor': false,
  'billing:auto_confirm': false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
