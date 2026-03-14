/**
 * lib/types/settings.ts
 *
 * 設定の型定義（Phase 2）
 */

import type { Task } from './task';

export interface Settings {
  profileName: string;
  email?: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  settings: Settings;
  tasks: Task[];
}
