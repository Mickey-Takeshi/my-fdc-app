/**
 * lib/server/billing/feature-gate.ts
 *
 * 機能ゲーティング（Phase 49）
 * プランに応じた機能アクセス制御
 */

import type { PlanTier } from '@/lib/types/billing';
import { createServiceClient } from '@/lib/server/supabase';

// -- Feature Names ----------------------------------------------------------

export type FeatureName =
  | 'basic_tasks'
  | 'lead_tracking'
  | 'client_management'
  | 'action_maps'
  | 'okr'
  | 'api_access'
  | 'custom_branding'
  | 'audit_logs'
  | 'sso'
  | 'google_calendar'
  | 'google_tasks'
  | 'brand_strategy'
  | 'lean_canvas'
  | 'priority_support'
  | 'dedicated_support'
  | 'advanced_analytics'
  | 'export_data';

// -- Plan Limits (per feature) ----------------------------------------------

/**
 * プランごとの機能アクセス定義
 * true = アクセス可、false = アクセス不可
 */
export const PLAN_LIMITS: Record<PlanTier, Record<FeatureName, boolean>> = {
  free: {
    basic_tasks: true,
    lead_tracking: true,
    client_management: true,
    action_maps: true,
    okr: false,
    api_access: false,
    custom_branding: false,
    audit_logs: false,
    sso: false,
    google_calendar: false,
    google_tasks: false,
    brand_strategy: false,
    lean_canvas: false,
    priority_support: false,
    dedicated_support: false,
    advanced_analytics: false,
    export_data: false,
  },

  starter: {
    basic_tasks: true,
    lead_tracking: true,
    client_management: true,
    action_maps: true,
    okr: true,
    api_access: false,
    custom_branding: false,
    audit_logs: false,
    sso: false,
    google_calendar: true,
    google_tasks: true,
    brand_strategy: true,
    lean_canvas: true,
    priority_support: false,
    dedicated_support: false,
    advanced_analytics: false,
    export_data: true,
  },

  team: {
    basic_tasks: true,
    lead_tracking: true,
    client_management: true,
    action_maps: true,
    okr: true,
    api_access: true,
    custom_branding: true,
    audit_logs: true,
    sso: false,
    google_calendar: true,
    google_tasks: true,
    brand_strategy: true,
    lean_canvas: true,
    priority_support: true,
    dedicated_support: false,
    advanced_analytics: true,
    export_data: true,
  },

  yourSaas: {
    basic_tasks: true,
    lead_tracking: true,
    client_management: true,
    action_maps: true,
    okr: true,
    api_access: true,
    custom_branding: true,
    audit_logs: true,
    sso: true,
    google_calendar: true,
    google_tasks: true,
    brand_strategy: true,
    lean_canvas: true,
    priority_support: true,
    dedicated_support: true,
    advanced_analytics: true,
    export_data: true,
  },
} as const;

// -- Plan Hierarchy ---------------------------------------------------------

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  team: 2,
  yourSaas: 3,
};

// -- Functions --------------------------------------------------------------

/**
 * 指定プランで特定の機能にアクセスできるかチェック
 */
export function canAccessFeature(plan: PlanTier, feature: FeatureName): boolean {
  const planFeatures = PLAN_LIMITS[plan];
  return planFeatures[feature] ?? false;
}

/**
 * プラン階層の比較（planA >= planB なら true）
 */
export function isPlanAtLeast(currentPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * ユーザーが指定プラン以上を利用中か確認
 * サブスクリプション情報をDBから取得して判定
 *
 * @param userId - ユーザーID
 * @param requiredPlan - 必要なプランティア
 * @returns プラン要件を満たしている場合は現在のプランティアを返す、満たさない場合は null
 */
export async function requirePlan(
  userId: string,
  requiredPlan: PlanTier
): Promise<PlanTier | null> {
  // free プランなら常にOK
  if (requiredPlan === 'free') return 'free';

  const supabase = createServiceClient();

  // ユーザーが所属するワークスペースのサブスクリプションを取得
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const workspaceIds = memberships.map((m) => m.workspace_id);

  // アクティブなサブスクリプションの中で最も高いプランを取得
  const { data: subscriptions } = await supabase
    .from('workshop_subscriptions')
    .select('plan_tier, status')
    .in('workspace_id', workspaceIds)
    .in('status', ['active', 'trialing']);

  if (!subscriptions || subscriptions.length === 0) {
    return null;
  }

  // 最も高いプランを特定
  let highestPlan: PlanTier = 'free';
  for (const sub of subscriptions) {
    const tier = sub.plan_tier as PlanTier;
    if (PLAN_HIERARCHY[tier] > PLAN_HIERARCHY[highestPlan]) {
      highestPlan = tier;
    }
  }

  // 必要プラン以上かチェック
  if (isPlanAtLeast(highestPlan, requiredPlan)) {
    return highestPlan;
  }

  return null;
}

/**
 * 機能ゲートチェック結果
 */
export interface FeatureGateResult {
  allowed: boolean;
  currentPlan: PlanTier;
  requiredPlan: PlanTier;
  feature: FeatureName;
}

/**
 * ユーザーが特定の機能にアクセスできるかを包括的にチェック
 */
export async function checkFeatureAccess(
  userId: string,
  feature: FeatureName
): Promise<FeatureGateResult> {
  // まず free プランでアクセスできるか確認
  if (canAccessFeature('free', feature)) {
    return {
      allowed: true,
      currentPlan: 'free',
      requiredPlan: 'free',
      feature,
    };
  }

  // 必要な最小プランを特定
  const tiers: PlanTier[] = ['starter', 'team', 'yourSaas'];
  let requiredPlan: PlanTier = 'yourSaas';
  for (const tier of tiers) {
    if (canAccessFeature(tier, feature)) {
      requiredPlan = tier;
      break;
    }
  }

  // ユーザーのプランを確認
  const currentPlan = await requirePlan(userId, requiredPlan);

  return {
    allowed: currentPlan !== null,
    currentPlan: currentPlan ?? 'free',
    requiredPlan,
    feature,
  };
}
