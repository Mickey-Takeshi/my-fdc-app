/**
 * lib/types/mvv.ts
 *
 * MVV (Mission/Vision/Value) の型定義（Phase 17）
 */

/** MVV（アプリ用） */
export interface MVV {
  id: string;
  brandId: string;
  mission: string;
  vision: string;
  values: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** MVV DB行 */
export interface MVVRow {
  id: string;
  brand_id: string;
  mission: string | null;
  vision: string | null;
  values: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toMVV(row: MVVRow): MVV {
  return {
    id: row.id,
    brandId: row.brand_id,
    mission: row.mission ?? '',
    vision: row.vision ?? '',
    values: (row.values ?? []) as string[],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
