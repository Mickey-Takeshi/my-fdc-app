/**
 * lib/types/google-tasks.ts
 *
 * Google Tasks 連携用型定義（Phase 14）
 */

/** Google Tasks リスト（API レスポンス） */
export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

/** Google Task（API レスポンス） */
export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
}

/** 同期ステータス */
export interface SyncStatus {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  error?: string;
  syncedCount?: number;
}

/** 同期結果 */
export interface SyncResult {
  createdInFdc: number;
  updatedInFdc: number;
  createdInGoogle: number;
  updatedInGoogle: number;
  errors: string[];
  lastSyncAt: string;
}
