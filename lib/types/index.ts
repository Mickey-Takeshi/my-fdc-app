/**
 * lib/types/index.ts
 *
 * 型定義（Phase 0: 最小限）
 * Phase 1 で Task, AppData を追加します
 */

// ユーザー情報
export interface User {
  id: string;
  email: string;
  name: string;
}

// Phase 1 で追加:
// export interface Task { ... }
// export interface AppData { ... }
// export const DEFAULT_APP_DATA: AppData = { ... }
