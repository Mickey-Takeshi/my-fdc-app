/**
 * lib/contexts/TenantContext.tsx
 *
 * 【Phase 14.4】テナントコンテキスト（クライアント側）
 * 【Phase 14.6.6】テーマカラー適用機能追加
 *
 * 【責務】
 * - サーバーから取得したテナント情報をクライアントに提供
 * - useTenant() フックでコンポーネントからアクセス可能
 * - テナント固有のテーマカラーをCSSカスタムプロパティとして適用
 */

'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';

// ========================================
// 型定義
// ========================================

export type ClientTenant = {
  id: string;
  subdomain: string;
  name: string;
  plan: string;
  theme: Record<string, unknown>;
  features: Record<string, boolean>;
};

// ========================================
// コンテキスト
// ========================================

const TenantContext = createContext<ClientTenant | null>(null);

// ========================================
// テーマカラーユーティリティ
// ========================================

/**
 * HEXカラーをRGB配列に変換
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * RGB配列をHEXに変換
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * プライマリカラーからダークバージョンを計算（25%暗く）
 */
function calculateDarkColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#008A94';
  return rgbToHex(
    rgb[0] * 0.75,
    rgb[1] * 0.75,
    rgb[2] * 0.75
  );
}

/**
 * プライマリカラーからライトバージョンを計算（20%明るく）
 */
function calculateLightColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#00E5F5';
  return rgbToHex(
    rgb[0] + (255 - rgb[0]) * 0.2,
    rgb[1] + (255 - rgb[1]) * 0.2,
    rgb[2] + (255 - rgb[2]) * 0.2
  );
}

/**
 * テーマカラーをCSSカスタムプロパティとしてdocument.documentElementに適用
 * ログインページなど、TenantProvider外からも利用可能
 */
export function applyThemeColors(theme: Record<string, unknown>) {
  const primaryColor = (theme.primaryColor as string) || '#00B8C4';
  // 空文字の場合も自動計算にフォールバック
  const primaryDarkRaw = theme.primaryDark as string;
  const primaryLightRaw = theme.primaryLight as string;
  const primaryDark = (primaryDarkRaw && primaryDarkRaw.length > 0) ? primaryDarkRaw : calculateDarkColor(primaryColor);
  const primaryLight = (primaryLightRaw && primaryLightRaw.length > 0) ? primaryLightRaw : calculateLightColor(primaryColor);

  const rgb = hexToRgb(primaryColor);
  const rgbDark = hexToRgb(primaryDark);

  if (!rgb || !rgbDark) return;

  const root = document.documentElement;

  // プライマリカラー
  root.style.setProperty('--primary', primaryColor);
  root.style.setProperty('--primary-dark', primaryDark);
  root.style.setProperty('--primary-light', primaryLight);

  // RGB形式（透明度計算用）
  root.style.setProperty('--primary-rgb', rgb.join(', '));
  root.style.setProperty('--primary-dark-rgb', rgbDark.join(', '));

  // 各透明度バリアント
  const alphaLevels = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 85];
  alphaLevels.forEach(alpha => {
    const alphaValue = alpha / 100;
    root.style.setProperty(
      `--primary-alpha-${alpha.toString().padStart(2, '0')}`,
      `rgba(${rgb.join(', ')}, ${alphaValue})`
    );
  });

  // シャドウ
  root.style.setProperty('--shadow-primary-sm', `0 4px 12px rgba(${rgb.join(', ')}, 0.3)`);
  root.style.setProperty('--shadow-primary-md', `0 8px 24px rgba(${rgb.join(', ')}, 0.25)`);
  root.style.setProperty('--shadow-primary-lg', `0 12px 32px rgba(${rgb.join(', ')}, 0.35)`);
  root.style.setProperty('--shadow-primary-xl', `0 20px 60px rgba(${rgb.join(', ')}, 0.15)`);

  // 背景グラデーション
  root.style.setProperty('--bg-gradient', `linear-gradient(135deg, rgba(${rgb.join(', ')}, 0.02) 0%, rgba(${rgb.join(', ')}, 0.05) 100%)`);
}

// ========================================
// Provider
// ========================================

type TenantProviderProps = {
  tenant: ClientTenant;
  children: ReactNode;
};

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  // テナントのテーマカラーを適用
  useEffect(() => {
    if (tenant.theme && Object.keys(tenant.theme).length > 0) {
      applyThemeColors(tenant.theme);
    }
  }, [tenant.theme]);

  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

// ========================================
// Hook
// ========================================

/**
 * 現在のテナント情報を取得
 *
 * @throws Error TenantProvider の外で使用した場合
 */
export function useTenant(): ClientTenant {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return ctx;
}

/**
 * テナント情報を取得（null許容版）
 */
export function useTenantOptional(): ClientTenant | null {
  return useContext(TenantContext);
}

/**
 * 特定機能が有効かどうかを判定するフック
 */
export function useFeatureFlag(feature: string): boolean {
  const tenant = useTenantOptional();
  return tenant?.features[feature] ?? false;
}
