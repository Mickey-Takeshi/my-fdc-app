/**
 * lib/types/settings.ts
 *
 * 設定関連の型定義
 */

import type { Task } from './task';

// ========================================
// プロフィール
// ========================================

export interface SocialLinks {
  x?: string;
  facebook?: string;
  instagram?: string;
  note?: string;
}

export interface Profile {
  name: string;
  email: string;
  bio: string;
  company?: string;
  website?: string;
  socialLinks: SocialLinks;
}

// ========================================
// アプリ設定
// ========================================

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'ja' | 'en';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  reminder: boolean;
}

export interface AppSettings {
  projectName: string;
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
}

// ========================================
// 全設定データ（Export/Import用）
// ========================================

export interface AllData {
  profile: Profile;
  settings: AppSettings;
  tasks: Task[];
  exportedAt: string;
  version: string;
}

// ========================================
// デフォルト値
// ========================================

export const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  bio: '',
  socialLinks: {},
};

export const DEFAULT_SETTINGS: AppSettings = {
  projectName: 'My Project',
  theme: 'system',
  language: 'ja',
  notifications: {
    email: true,
    push: true,
    reminder: true,
  },
};

// ========================================
// バリデーション
// ========================================

export function validateProfile(profile: Partial<Profile>): string[] {
  const errors: string[] = [];

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push('メールアドレスの形式が正しくありません');
  }

  if (profile.website && !/^https?:\/\/.+/.test(profile.website)) {
    errors.push('WebサイトURLはhttp://またはhttps://で始めてください');
  }

  return errors;
}

export function validateImportData(data: unknown): data is AllData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;
  return (
    'profile' in d &&
    'settings' in d &&
    'tasks' in d &&
    'exportedAt' in d &&
    'version' in d
  );
}

// ========================================
// ユーティリティ
// ========================================

export function formatExportFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `fdc-backup-${year}-${month}-${day}.json`;
}
