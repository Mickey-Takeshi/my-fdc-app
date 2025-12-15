/**
 * lib/types/google-tasks.ts
 *
 * Phase 14: Google Tasks API の型定義
 */

/**
 * Google タスクリスト
 */
export interface GoogleTaskList {
  kind: string;
  id: string;
  etag: string;
  title: string;
  updated: string;
  selfLink: string;
}

/**
 * タスクリスト一覧レスポンス
 */
export interface GoogleTaskListsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: GoogleTaskList[];
}

/**
 * Google タスク
 */
export interface GoogleTask {
  kind: string;
  id: string;
  etag: string;
  title: string;
  updated: string;  // RFC3339 - 競合解決に使用
  selfLink: string;
  parent?: string;
  position: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;     // RFC3339 - 期限
  completed?: string; // RFC3339 - 完了日時
  deleted?: boolean;
  hidden?: boolean;
  links?: Array<{
    type: string;
    description?: string;
    link: string;
  }>;
}

/**
 * タスク一覧レスポンス
 */
export interface GoogleTasksResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items?: GoogleTask[];
}

/**
 * タスク作成/更新リクエスト
 */
export interface GoogleTaskRequest {
  title: string;
  notes?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
}

/**
 * 同期状態
 */
export interface SyncStatus {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  error?: string;
  syncedCount?: number;
}

/**
 * 同期結果
 */
export interface SyncResult {
  success: boolean;
  createdInFDC: number;
  updatedInFDC: number;
  createdInGoogle: number;
  updatedInGoogle: number;
  errors: string[];
  lastSyncAt: string;
}

/**
 * FDC タスクと Google Task のマッピング
 */
export interface TaskSyncMapping {
  fdcTaskId: string;
  googleTaskId: string;
  googleTaskListId: string;
  lastSyncedAt: string;
  syncDirection: 'fdc_to_google' | 'google_to_fdc' | 'bidirectional';
}
