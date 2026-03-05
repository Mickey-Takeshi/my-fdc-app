/**
 * lib/types/brand.ts
 *
 * ブランド戦略の型定義（Phase 15）
 * 10ポイントブランド戦略
 */

/** ブランドポイントタイプ（10ポイント） */
export type BrandPointType =
  | 'mission'
  | 'vision'
  | 'target_audience'
  | 'unique_value'
  | 'brand_personality'
  | 'tone_voice'
  | 'visual_identity'
  | 'key_messages'
  | 'competitors'
  | 'differentiators';

/** 全ポイントタイプ */
export const ALL_BRAND_POINT_TYPES: BrandPointType[] = [
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

/** ポイントタイプラベル */
export const BRAND_POINT_LABELS: Record<BrandPointType, string> = {
  mission: 'Mission',
  vision: 'Vision',
  target_audience: 'Target Audience',
  unique_value: 'Unique Value',
  brand_personality: 'Brand Personality',
  tone_voice: 'Tone & Voice',
  visual_identity: 'Visual Identity',
  key_messages: 'Key Messages',
  competitors: 'Competitors',
  differentiators: 'Differentiators',
};

/** ポイントタイプ説明 */
export const BRAND_POINT_DESCRIPTIONS: Record<BrandPointType, string> = {
  mission: '存在意義・使命',
  vision: '実現したい将来像',
  target_audience: 'ターゲット顧客像',
  unique_value: '独自の価値提案',
  brand_personality: 'ブランドの人格・個性',
  tone_voice: 'コミュニケーションのトーン',
  visual_identity: '視覚的アイデンティティ',
  key_messages: '核心メッセージ',
  competitors: '競合分析',
  differentiators: '差別化ポイント',
};

/** ブランド（アプリ用） */
export interface Brand {
  id: string;
  workspaceId: string;
  name: string;
  tagline: string;
  story: string;
  logoUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** ブランドDB行 */
export interface BrandRow {
  id: string;
  workspace_id: string;
  name: string;
  tagline: string | null;
  story: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    tagline: row.tagline ?? '',
    story: row.story ?? '',
    logoUrl: row.logo_url ?? '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** ブランドポイント（アプリ用） */
export interface BrandPoint {
  id: string;
  brandId: string;
  pointType: BrandPointType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** ブランドポイントDB行 */
export interface BrandPointRow {
  id: string;
  brand_id: string;
  point_type: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toBrandPoint(row: BrandPointRow): BrandPoint {
  return {
    id: row.id,
    brandId: row.brand_id,
    pointType: row.point_type as BrandPointType,
    content: row.content ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
