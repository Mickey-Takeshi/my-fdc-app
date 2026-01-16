/**
 * lib/types/brand.ts
 *
 * Phase 15: ブランド戦略の型定義
 */

/**
 * 10ポイントの種類
 */
export type BrandPointType =
  | 'mission'           // ミッション（存在意義）
  | 'vision'            // ビジョン（将来像）
  | 'target_audience'   // ターゲット顧客
  | 'unique_value'      // 独自の価値提案
  | 'brand_personality' // ブランドパーソナリティ
  | 'tone_voice'        // トーン&ボイス
  | 'visual_identity'   // ビジュアルアイデンティティ
  | 'key_messages'      // キーメッセージ
  | 'competitors'       // 競合分析
  | 'differentiators';  // 差別化要因

/**
 * 10ポイントのラベル定義
 */
export const BRAND_POINT_LABELS: Record<BrandPointType, { label: string; description: string }> = {
  mission: {
    label: 'ミッション',
    description: '企業・ブランドの存在意義。なぜ存在するのか？',
  },
  vision: {
    label: 'ビジョン',
    description: '目指す将来像。どんな世界を実現したいか？',
  },
  target_audience: {
    label: 'ターゲット顧客',
    description: '理想的な顧客像。誰に届けたいか？',
  },
  unique_value: {
    label: '独自の価値提案',
    description: '顧客に提供する独自の価値。なぜ選ばれるか？',
  },
  brand_personality: {
    label: 'ブランドパーソナリティ',
    description: 'ブランドを人に例えたときの性格・特徴',
  },
  tone_voice: {
    label: 'トーン&ボイス',
    description: 'コミュニケーションの声のトーンと話し方',
  },
  visual_identity: {
    label: 'ビジュアルアイデンティティ',
    description: 'ロゴ、色、フォント、画像スタイルなど',
  },
  key_messages: {
    label: 'キーメッセージ',
    description: '一貫して伝えたい主要なメッセージ',
  },
  competitors: {
    label: '競合分析',
    description: '主要な競合と市場でのポジション',
  },
  differentiators: {
    label: '差別化要因',
    description: '競合と比べたときの明確な違い',
  },
};

/**
 * 10ポイントの順序
 */
export const BRAND_POINT_ORDER: BrandPointType[] = [
  'mission',
  'vision',
  'target_audience',
  'unique_value',
  'brand_personality',
  'tone_voice',
  'visual_identity',
  'key_messages',
  'competitors',
  'differentiators',
];

/**
 * ブランド
 */
export interface Brand {
  id: string;
  workspaceId: string;
  name: string;
  tagline: string | null;
  story: string | null;
  logoUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ブランドポイント
 */
export interface BrandPoint {
  id: string;
  brandId: string;
  pointType: BrandPointType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ブランドと全ポイントを含む
 */
export interface BrandWithPoints extends Brand {
  points: BrandPoint[];
}

/**
 * ブランド作成リクエスト
 */
export interface CreateBrandRequest {
  name: string;
  tagline?: string;
  story?: string;
}

/**
 * ブランド更新リクエスト
 */
export interface UpdateBrandRequest {
  name?: string;
  tagline?: string;
  story?: string;
  logoUrl?: string;
}

/**
 * ポイント更新リクエスト
 */
export interface UpdateBrandPointRequest {
  pointType: BrandPointType;
  content: string;
}

/**
 * トーン&マナーチェック結果
 */
export interface TonmanaCheckResult {
  isConsistent: boolean;
  score: number; // 0-100
  suggestions: string[];
  checkedAt: string;
}
