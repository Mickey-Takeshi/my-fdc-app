/**
 * lib/types/approach.ts
 *
 * アプローチ（接触記録）の型定義（Phase 8）
 * DB テーブル: approaches
 */

/** アプローチ種別 */
export type ApproachType = 'call' | 'email' | 'meeting' | 'visit' | 'other';

/** アプローチ種別の表示ラベル */
export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  call: '電話',
  email: 'メール',
  meeting: 'ミーティング',
  visit: '訪問',
  other: 'その他',
};

/** 全アプローチ種別 */
export const ALL_APPROACH_TYPES: ApproachType[] = [
  'call',
  'email',
  'meeting',
  'visit',
  'other',
];

/** アプローチ結果 */
export type ApproachResult = 'positive' | 'neutral' | 'negative' | '';

/** 結果ラベル */
export const APPROACH_RESULT_LABELS: Record<string, string> = {
  positive: '好感触',
  neutral: '普通',
  negative: '反応薄い',
  '': '未記入',
};

/** アプローチデータ */
export interface Approach {
  id: string;
  workspaceId: string;
  leadId: string;
  userId: string;
  type: ApproachType;
  content: string;
  result: ApproachResult;
  resultNote: string;
  approachedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** DB の approaches テーブルの行データ */
export interface ApproachRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  user_id: string;
  type: string;
  content: string;
  result: string;
  result_note: string;
  approached_at: string;
  created_at: string;
  updated_at: string;
}

/** DB 行からフロントエンド型への変換 */
export function toApproach(row: ApproachRow): Approach {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    userId: row.user_id,
    type: (row.type as ApproachType) ?? 'other',
    content: row.content ?? '',
    result: (row.result as ApproachResult) ?? '',
    resultNote: row.result_note ?? '',
    approachedAt: row.approached_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** アプローチ統計 */
export interface ApproachStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  byType: Record<ApproachType, number>;
}
