/**
 * lib/contexts/SettingsContext.tsx
 *
 * 設定管理用Context（localStorage永続化）
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { Profile, AppSettings, AllData } from '@/lib/types/settings';
import type { Task } from '@/lib/types/task';
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  validateImportData,
  formatExportFileName,
} from '@/lib/types/settings';

// ========================================
// Context 型定義
// ========================================

interface SettingsContextValue {
  profile: Profile;
  settings: AppSettings;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  exportAllData: () => void;
  importAllData: (file: File) => Promise<{ success: boolean; error?: string }>;
  resetAll: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ========================================
// localStorage キー
// ========================================

const PROFILE_KEY = 'fdc_profile';
const SETTINGS_KEY = 'fdc_settings';
const TASKS_KEY = 'fdc_tasks';

// ========================================
// ストレージユーティリティ
// ========================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[SettingsContext] Failed to save ${key}`);
  }
}

// ========================================
// Provider
// ========================================

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 初期化（localStorage から読み込み）
  useEffect(() => {
    setProfile(loadFromStorage(PROFILE_KEY, DEFAULT_PROFILE));
    setSettings(loadFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS));
    setLoading(false);
  }, []);

  // 永続化（profile 変更時）
  useEffect(() => {
    if (!loading) {
      saveToStorage(PROFILE_KEY, profile);
    }
  }, [profile, loading]);

  // 永続化（settings 変更時）
  useEffect(() => {
    if (!loading) {
      saveToStorage(SETTINGS_KEY, settings);
    }
  }, [settings, loading]);

  // プロフィール更新
  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // 設定更新
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // エクスポート
  const exportAllData = useCallback(() => {
    const tasks = loadFromStorage<Task[]>(TASKS_KEY, []);

    const exportData: AllData = {
      profile,
      settings,
      tasks,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatExportFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [profile, settings]);

  // インポート
  const importAllData = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!validateImportData(data)) {
          return { success: false, error: 'ファイル形式が正しくありません' };
        }

        // データを復元
        setProfile(data.profile);
        setSettings(data.settings);
        saveToStorage(TASKS_KEY, data.tasks);

        return { success: true };
      } catch (err) {
        console.error('[SettingsContext] Import error:', err);
        return { success: false, error: 'ファイルの読み込みに失敗しました' };
      }
    },
    []
  );

  // リセット
  const resetAll = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        profile,
        settings,
        loading,
        updateProfile,
        updateSettings,
        exportAllData,
        importAllData,
        resetAll,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
