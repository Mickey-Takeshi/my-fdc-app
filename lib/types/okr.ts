/**
 * lib/types/okr.ts
 *
 * OKR (Objectives and Key Results) 型定義（Phase 11）
 * 3層アーキテクチャの戦略層
 */

/** Objective（アプリ用） */
export interface Objective {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  period: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  /** 計算値: KR の平均進捗 */
  progressRate?: number;
  /** 結合データ: Key Results */
  keyResults?: KeyResult[];
}

/** Key Result（アプリ用） */
export interface KeyResult {
  id: string;
  objectiveId: string;
  workspaceId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  /** 計算値: (currentValue / targetValue) * 100 */
  progressRate?: number;
  /** 結合データ: 紐付き ActionMap 数 */
  linkedActionMapCount?: number;
}

/** Objective DB行 */
export interface ObjectiveRow {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  period: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** Key Result DB行 */
export interface KeyResultRow {
  id: string;
  objective_id: string;
  workspace_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

/** DB行 → Objective 変換 */
export function toObjective(row: ObjectiveRow): Objective {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? '',
    period: row.period,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** DB行 → KeyResult 変換 */
export function toKeyResult(row: KeyResultRow): KeyResult {
  const targetValue = row.target_value || 100;
  const currentValue = row.current_value || 0;
  const progressRate = targetValue > 0
    ? Math.round((currentValue / targetValue) * 100)
    : 0;

  return {
    id: row.id,
    objectiveId: row.objective_id,
    workspaceId: row.workspace_id,
    title: row.title,
    targetValue,
    currentValue,
    unit: row.unit || '%',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progressRate,
  };
}
