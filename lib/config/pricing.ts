/**
 * lib/config/pricing.ts
 *
 * プラン定義と価格設定（Phase 48）
 * クライアント・サーバー両方で使用可能な定数定義
 */

import type { PlanTier } from '@/lib/types/billing';

// -- Support Level ----------------------------------------------------------

export type SupportLevel = 'community' | 'email' | 'priority' | 'dedicated';

// -- Plan Definition --------------------------------------------------------

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;       // 円単位（税抜）
  halfYearlyPrice: number;    // 円単位（税抜）
  limits: PlanLimits;
  features: readonly string[];
  recommended?: boolean;
}

export interface PlanLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxLeads: number;
  maxClients: number;
  maxActionMaps: number;
  maxOKRObjectives: number;
  storageGB: number;
  supportLevel: SupportLevel;
  apiAccess: boolean;
  customBranding: boolean;
  auditLogs: boolean;
  sso: boolean;
}

// -- Pricing Plans ----------------------------------------------------------

export const PRICING_PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    name: 'Free',
    description: 'Start with the essentials',
    monthlyPrice: 0,
    halfYearlyPrice: 0,
    limits: {
      maxUsers: 1,
      maxWorkspaces: 1,
      maxLeads: 50,
      maxClients: 10,
      maxActionMaps: 3,
      maxOKRObjectives: 3,
      storageGB: 1,
      supportLevel: 'community',
      apiAccess: false,
      customBranding: false,
      auditLogs: false,
      sso: false,
    },
    features: [
      'Basic task management',
      'Lead tracking (up to 50)',
      'Client management (up to 10)',
      'Community support',
    ],
  },

  starter: {
    tier: 'starter',
    name: 'Starter',
    description: 'For growing teams',
    monthlyPrice: 2980,
    halfYearlyPrice: 14880,   // 2480/month equivalent
    limits: {
      maxUsers: 5,
      maxWorkspaces: 3,
      maxLeads: 500,
      maxClients: 100,
      maxActionMaps: 20,
      maxOKRObjectives: 10,
      storageGB: 10,
      supportLevel: 'email',
      apiAccess: false,
      customBranding: false,
      auditLogs: false,
      sso: false,
    },
    features: [
      'Up to 5 team members',
      'Expanded lead tracking (500)',
      'Client management (100)',
      'Action Maps & OKR',
      'Email support',
    ],
  },

  team: {
    tier: 'team',
    name: 'Team',
    description: 'For professional teams',
    monthlyPrice: 7980,
    halfYearlyPrice: 39900,   // 6650/month equivalent
    recommended: true,
    limits: {
      maxUsers: 20,
      maxWorkspaces: 10,
      maxLeads: 5000,
      maxClients: 1000,
      maxActionMaps: 100,
      maxOKRObjectives: 50,
      storageGB: 50,
      supportLevel: 'priority',
      apiAccess: true,
      customBranding: true,
      auditLogs: true,
      sso: false,
    },
    features: [
      'Up to 20 team members',
      'Unlimited lead tracking',
      'Full CRM features',
      'API access',
      'Custom branding',
      'Audit logs',
      'Priority support',
    ],
  },

  yourSaas: {
    tier: 'yourSaas',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 19800,
    halfYearlyPrice: 99000,   // 16500/month equivalent
    limits: {
      maxUsers: 9999,
      maxWorkspaces: 9999,
      maxLeads: 9999,
      maxClients: 9999,
      maxActionMaps: 9999,
      maxOKRObjectives: 9999,
      storageGB: 500,
      supportLevel: 'dedicated',
      apiAccess: true,
      customBranding: true,
      auditLogs: true,
      sso: true,
    },
    features: [
      'Unlimited team members',
      'Unlimited everything',
      'SSO / SAML',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
} as const;

// -- Helper Functions -------------------------------------------------------

/**
 * プランの月額料金を取得（半年契約の場合は月額換算）
 */
export function getMonthlyEquivalent(plan: PlanDefinition, cycle: 'monthly' | 'half_yearly'): number {
  if (cycle === 'half_yearly' && plan.halfYearlyPrice > 0) {
    return Math.round(plan.halfYearlyPrice / 6);
  }
  return plan.monthlyPrice;
}

/**
 * プラン一覧を配列として取得
 */
export function getPlanList(): PlanDefinition[] {
  return Object.values(PRICING_PLANS);
}

/**
 * プランティアからプラン定義を取得
 */
export function getPlanByTier(tier: PlanTier): PlanDefinition {
  return PRICING_PLANS[tier];
}
