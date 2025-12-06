/**
 * lib/types/ai-settings.ts
 *
 * Phase 14.7: テナント別AI設定の型定義
 *
 * 【責務】
 * - テナント単位のAI設定型
 * - API リクエスト/レスポンス型
 * - UI コンポーネント用型
 */

import type { EncryptedData } from '@/lib/server/encryption';

// ========================================
// 基本型定義
// ========================================

/**
 * AIモデル識別子
 */
export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

/**
 * AI使用量クォータ設定
 */
export interface AIQuota {
  /** 月間最大リクエスト数 */
  maxRequestsPerMonth: number;
  /** 月間最大トークン数 */
  maxTokensPerMonth: number;
  /** 月間最大コスト（USD） */
  maxCostPerMonth: number;
}

/**
 * テナントAI設定（DB保存形式）
 *
 * @description
 * tenants.ai_settings カラムに保存される形式
 * APIキーは暗号化して保存
 */
export interface TenantAISettings {
  /** AI機能の有効/無効 */
  enabled: boolean;

  /** 暗号化されたAPIキー（null = 未設定） */
  api_key_encrypted: EncryptedData | null;

  /** 使用するAIモデル */
  model: AIModel;

  /** 使用量クォータ */
  quota: AIQuota;
}

/**
 * デフォルトAI設定
 */
export const DEFAULT_AI_SETTINGS: TenantAISettings = {
  enabled: false,
  api_key_encrypted: null,
  model: 'gpt-4o-mini',
  quota: {
    maxRequestsPerMonth: 1000,
    maxTokensPerMonth: 500_000,
    maxCostPerMonth: 10.0,
  },
};

// ========================================
// API用型定義
// ========================================

/**
 * AI設定取得レスポンス（クライアント向け）
 *
 * @description
 * APIキーは「設定済み」かどうかのみ返す（暗号文は返さない）
 */
export interface AISettingsResponse {
  enabled: boolean;
  hasApiKey: boolean;
  model: AIModel;
  quota: AIQuota;
}

/**
 * AI設定更新リクエスト
 */
export interface AISettingsUpdateRequest {
  /** AI機能の有効/無効 */
  enabled?: boolean;

  /** APIキー（平文、サーバーで暗号化） */
  apiKey?: string;

  /** APIキー削除フラグ */
  removeApiKey?: boolean;

  /** 使用するAIモデル */
  model?: AIModel;

  /** 使用量クォータ */
  quota?: Partial<AIQuota>;
}

/**
 * APIキー検証リクエスト
 */
export interface ValidateApiKeyRequest {
  apiKey: string;
}

/**
 * APIキー検証レスポンス
 */
export interface ValidateApiKeyResponse {
  valid: boolean;
  error?: string;
  models?: string[];
}

// ========================================
// UI用型定義
// ========================================

/**
 * AI設定フォーム状態
 */
export interface AISettingsFormState {
  enabled: boolean;
  apiKey: string;
  hasExistingKey: boolean;
  model: AIModel;
  quota: AIQuota;
  isValidating: boolean;
  validationResult: ValidateApiKeyResponse | null;
}

/**
 * AI機能の有効状態（コンポーネント用）
 */
export interface AIFeatureState {
  /** テナントでAI機能が有効か */
  enabled: boolean;
  /** APIキーが設定されているか */
  hasApiKey: boolean;
  /** 実際に利用可能か（enabled && hasApiKey） */
  available: boolean;
  /** 無効の理由 */
  disabledReason?: 'tenant_disabled' | 'no_api_key' | 'quota_exceeded';
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * AI機能が利用可能かどうかを判定
 */
export function isAIAvailable(settings: AISettingsResponse): boolean {
  return settings.enabled && settings.hasApiKey;
}

/**
 * AI無効の理由を取得
 */
export function getAIDisabledReason(
  settings: AISettingsResponse
): AIFeatureState['disabledReason'] | undefined {
  if (!settings.enabled) {
    return 'tenant_disabled';
  }
  if (!settings.hasApiKey) {
    return 'no_api_key';
  }
  return undefined;
}

/**
 * AIFeatureState を生成
 */
export function buildAIFeatureState(settings: AISettingsResponse): AIFeatureState {
  const available = isAIAvailable(settings);
  const disabledReason = getAIDisabledReason(settings);

  return {
    enabled: settings.enabled,
    hasApiKey: settings.hasApiKey,
    available,
    disabledReason,
  };
}
