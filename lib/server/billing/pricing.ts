/**
 * lib/server/billing/pricing.ts
 *
 * サーバーサイド価格計算ユーティリティ（Phase 48）
 * ワークスペース・組織・標準の3段階で価格優先度を決定
 */

import type { BillingCycle } from '@/lib/types/billing';
import { createServiceClient } from '@/lib/server/supabase';

// -- Standard Prices --------------------------------------------------------

/** 標準月額料金（円） */
export const STANDARD_MONTHLY_PRICE = 2980;

/** 標準半年額料金（円） */
export const STANDARD_HALF_YEARLY_PRICE = 14880;

// -- Price Priority ---------------------------------------------------------

interface PriceSource {
  source: 'workspace' | 'organization' | 'standard';
  monthlyPrice: number;
  halfYearlyPrice: number;
}

interface WorkspacePricing {
  custom_monthly_price: number | null;
  custom_half_yearly_price: number | null;
}

interface OrganizationPricing {
  custom_monthly_price: number | null;
  custom_half_yearly_price: number | null;
  volume_discount_percent: number;
}

/**
 * 適用される実効価格を取得
 * 優先順位: ワークスペース個別設定 > 組織設定 > 標準料金
 *
 * @param workspaceId - ワークスペースID
 * @returns 実効価格情報
 */
export async function getEffectivePrice(workspaceId: string): Promise<PriceSource> {
  const supabase = createServiceClient();

  // 1. ワークスペース個別価格を確認
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('custom_monthly_price, custom_half_yearly_price, organization_id')
    .eq('id', workspaceId)
    .single();

  if (workspace) {
    const wsPricing = workspace as unknown as WorkspacePricing & { organization_id: string | null };

    // ワークスペースにカスタム価格が設定されている場合
    if (wsPricing.custom_monthly_price !== null) {
      return {
        source: 'workspace',
        monthlyPrice: wsPricing.custom_monthly_price,
        halfYearlyPrice: wsPricing.custom_half_yearly_price ?? wsPricing.custom_monthly_price * 5,
      };
    }

    // 2. 組織価格を確認
    if (wsPricing.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('custom_monthly_price, custom_half_yearly_price, volume_discount_percent')
        .eq('id', wsPricing.organization_id)
        .single();

      if (org) {
        const orgPricing = org as unknown as OrganizationPricing;

        if (orgPricing.custom_monthly_price !== null) {
          const discount = orgPricing.volume_discount_percent / 100;
          return {
            source: 'organization',
            monthlyPrice: Math.round(orgPricing.custom_monthly_price * (1 - discount)),
            halfYearlyPrice: Math.round(
              (orgPricing.custom_half_yearly_price ?? orgPricing.custom_monthly_price * 5) *
                (1 - discount)
            ),
          };
        }
      }
    }
  }

  // 3. 標準料金
  return {
    source: 'standard',
    monthlyPrice: STANDARD_MONTHLY_PRICE,
    halfYearlyPrice: STANDARD_HALF_YEARLY_PRICE,
  };
}

/**
 * 請求サイクルに応じた金額を取得
 */
export function getPriceForCycle(
  priceSource: PriceSource,
  cycle: BillingCycle
): number {
  return cycle === 'monthly' ? priceSource.monthlyPrice : priceSource.halfYearlyPrice;
}

/**
 * 半年契約の月額換算額を取得
 */
export function getMonthlyEquivalentFromSource(priceSource: PriceSource): number {
  if (priceSource.halfYearlyPrice > 0) {
    return Math.round(priceSource.halfYearlyPrice / 6);
  }
  return priceSource.monthlyPrice;
}
