/**
 * lib/types/lean-canvas.ts
 *
 * Phase 16: Lean Canvas 型定義
 */

// 9ブロックタイプ
export type LeanCanvasBlockType =
  | 'customer_segments'
  | 'problem'
  | 'unique_value'
  | 'solution'
  | 'channels'
  | 'revenue_streams'
  | 'cost_structure'
  | 'key_metrics'
  | 'unfair_advantage';

// ブロック定義
export interface LeanCanvasBlockDefinition {
  type: LeanCanvasBlockType;
  label: string;
  description: string;
  placeholder: string;
  gridArea: string;
  color: string;
}

// 9ブロック設定
export const LEAN_CANVAS_BLOCKS: LeanCanvasBlockDefinition[] = [
  {
    type: 'problem',
    label: '課題',
    description: '顧客が抱える上位3つの課題',
    placeholder: '例：時間がかかる、コストが高い、複雑すぎる',
    gridArea: 'problem',
    color: '#ef4444',
  },
  {
    type: 'customer_segments',
    label: '顧客セグメント',
    description: 'ターゲット顧客とアーリーアダプター',
    placeholder: '例：中小企業の経営者、スタートアップ創業者',
    gridArea: 'segments',
    color: '#3b82f6',
  },
  {
    type: 'unique_value',
    label: '独自の価値提案',
    description: '顧客に提供する明確なメッセージ',
    placeholder: '例：〇〇を△△で解決する唯一のソリューション',
    gridArea: 'value',
    color: '#8b5cf6',
  },
  {
    type: 'solution',
    label: 'ソリューション',
    description: '各課題に対する解決策',
    placeholder: '例：自動化ツール、ワンクリック操作',
    gridArea: 'solution',
    color: '#22c55e',
  },
  {
    type: 'channels',
    label: 'チャネル',
    description: '顧客にリーチする経路',
    placeholder: '例：SNS、紹介、コンテンツマーケティング',
    gridArea: 'channels',
    color: '#f59e0b',
  },
  {
    type: 'revenue_streams',
    label: '収益の流れ',
    description: '収益モデルと価格設定',
    placeholder: '例：サブスクリプション月額¥X、従量課金',
    gridArea: 'revenue',
    color: '#06b6d4',
  },
  {
    type: 'cost_structure',
    label: 'コスト構造',
    description: '主要なコスト項目',
    placeholder: '例：開発費、マーケティング費、人件費',
    gridArea: 'cost',
    color: '#ec4899',
  },
  {
    type: 'key_metrics',
    label: '主要指標',
    description: '成功を測定するKPI',
    placeholder: '例：MAU、コンバージョン率、LTV',
    gridArea: 'metrics',
    color: '#14b8a6',
  },
  {
    type: 'unfair_advantage',
    label: '圧倒的な優位性',
    description: '簡単に真似できない強み',
    placeholder: '例：特許技術、独自のネットワーク、専門知識',
    gridArea: 'advantage',
    color: '#f97316',
  },
];

// ブロックタイプからブロック定義を取得
export const getBlockDefinition = (type: LeanCanvasBlockType): LeanCanvasBlockDefinition => {
  const block = LEAN_CANVAS_BLOCKS.find((b) => b.type === type);
  if (!block) throw new Error(`Unknown block type: ${type}`);
  return block;
};

// Lean Canvas エンティティ
export interface LeanCanvas {
  id: string;
  workspaceId: string;
  brandId: string | null;
  title: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Lean Canvas ブロック
export interface LeanCanvasBlock {
  id: string;
  canvasId: string;
  blockType: LeanCanvasBlockType;
  content: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

// Lean Canvas with blocks
export interface LeanCanvasWithBlocks extends LeanCanvas {
  blocks: LeanCanvasBlock[];
}

// API レスポンス型
export interface LeanCanvasListResponse {
  canvases: LeanCanvas[];
}

export interface LeanCanvasDetailResponse {
  canvas: LeanCanvasWithBlocks;
}

// 作成・更新用
export interface CreateLeanCanvasInput {
  title: string;
  description?: string;
  brandId?: string;
}

export interface UpdateLeanCanvasInput {
  title?: string;
  description?: string;
  brandId?: string | null;
}

export interface UpdateBlockInput {
  content?: string;
  items?: string[];
}
