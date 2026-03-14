/**
 * lib/types/lean-canvas.ts
 *
 * Lean Canvas の型定義（Phase 16）
 * 9ブロックモデル
 */

/** Lean Canvas ブロックタイプ */
export type LeanCanvasBlockType =
  | 'problem'
  | 'solution'
  | 'unique_value'
  | 'unfair_advantage'
  | 'customer_segments'
  | 'key_metrics'
  | 'channels'
  | 'cost_structure'
  | 'revenue_streams';

/** 全ブロックタイプ */
export const ALL_BLOCK_TYPES: LeanCanvasBlockType[] = [
  'problem',
  'solution',
  'unique_value',
  'unfair_advantage',
  'customer_segments',
  'key_metrics',
  'channels',
  'cost_structure',
  'revenue_streams',
];

/** ブロックタイプラベル */
export const BLOCK_TYPE_LABELS: Record<LeanCanvasBlockType, string> = {
  problem: '課題',
  solution: '解決策',
  unique_value: '独自の価値提案',
  unfair_advantage: '圧倒的な優位性',
  customer_segments: '顧客セグメント',
  key_metrics: '主要指標',
  channels: 'チャネル',
  cost_structure: 'コスト構造',
  revenue_streams: '収益の流れ',
};

/** Lean Canvas（アプリ用） */
export interface LeanCanvas {
  id: string;
  workspaceId: string;
  brandId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Lean Canvas DB行 */
export interface LeanCanvasRow {
  id: string;
  workspace_id: string;
  brand_id: string;
  title: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toLeanCanvas(row: LeanCanvasRow): LeanCanvas {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    brandId: row.brand_id,
    title: row.title ?? '',
    description: row.description ?? '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Lean Canvas ブロック（アプリ用） */
export interface LeanCanvasBlock {
  id: string;
  canvasId: string;
  blockType: LeanCanvasBlockType;
  content: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

/** Lean Canvas ブロックDB行 */
export interface LeanCanvasBlockRow {
  id: string;
  canvas_id: string;
  block_type: string;
  content: string | null;
  items: string[] | null;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toLeanCanvasBlock(row: LeanCanvasBlockRow): LeanCanvasBlock {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    blockType: row.block_type as LeanCanvasBlockType,
    content: row.content ?? '',
    items: (row.items ?? []) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
