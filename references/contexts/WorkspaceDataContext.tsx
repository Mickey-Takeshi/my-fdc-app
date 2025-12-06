/**
 * lib/contexts/WorkspaceDataContext.tsx
 *
 * ワークスペースデータをアプリ全体で共有するContext
 * - 1回のAPIコールで全データを取得
 * - 複数コンポーネントからの重複フェッチを防止
 * - localStorage キャッシュで即座に表示（Stale-While-Revalidate）
 *
 * Phase 16: コマンドベースの保存（409 Conflict根本解決）
 * - 従来: saveData({ tasks: [...] }) - キュー追加時点でデータ確定、並列操作で競合
 * - 新規: saveData({ command: { type: 'DELETE_TASK', taskId } }) - キュー実行時に最新データへ適用
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type { AppData } from '@/lib/types/app-data';
import type { Task } from '@/lib/types/todo';
import { checkClientVersion, VERSION_HEADER } from '@/lib/client/version-check';

// ========================================
// Phase 16: コマンド型定義
// ========================================

export type DataCommand =
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<Task> }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'UPDATE_TASKS'; tasks: Task[] }
  | { type: 'SET_TASK_EVENT_IDS'; eventMappings: Array<{ taskId: string; eventId: string }> };

export interface CommandPayload {
  command: DataCommand;
}

function isCommandPayload(data: Partial<AppData> | CommandPayload): data is CommandPayload {
  return 'command' in data && data.command !== undefined;
}

/**
 * Phase 16: コマンドを最新データに適用
 * キュー実行時に呼ばれ、最新のdataRefに対してコマンドを適用する
 *
 * 重要: 冪等性を保証する（同じコマンドを複数回適用しても結果が同じ）
 */
function applyCommand(currentData: AppData, command: DataCommand): AppData {
  switch (command.type) {
    case 'DELETE_TASK': {
      const tasks = currentData.tasks?.filter(t => t.id !== command.taskId) || [];
      return { ...currentData, tasks };
    }
    case 'UPDATE_TASK': {
      const tasks = currentData.tasks?.map(t =>
        t.id === command.taskId ? { ...t, ...command.updates, updatedAt: Date.now() } : t
      ) || [];
      return { ...currentData, tasks };
    }
    case 'CREATE_TASK': {
      // Phase 16 Fix: 冪等性を保証（既に同じIDのタスクがあれば追加しない）
      const existingTask = currentData.tasks?.find(t => t.id === command.task.id);
      if (existingTask) {
        // 既に存在する場合は何もしない（オプティミスティック更新済み）
        return currentData;
      }
      const tasks = [...(currentData.tasks || []), command.task];
      return { ...currentData, tasks };
    }
    case 'UPDATE_TASKS': {
      // 既存タスクの更新と新規タスクの追加を処理
      const existingIds = new Set(currentData.tasks?.map(t => t.id) || []);
      const updatedTasks = currentData.tasks?.map(t => {
        const update = command.tasks.find(u => u.id === t.id);
        return update ? { ...t, ...update } : t;
      }) || [];
      const newTasks = command.tasks.filter(t => !existingIds.has(t.id));
      return { ...currentData, tasks: [...updatedTasks, ...newTasks] };
    }
    case 'SET_TASK_EVENT_IDS': {
      // Google Calendar eventIdをタスクに設定
      const eventIdMap = new Map(command.eventMappings.map(m => [m.taskId, m.eventId]));
      const tasks = currentData.tasks?.map(t => {
        const eventId = eventIdMap.get(t.id);
        return eventId ? { ...t, googleCalendarEventId: eventId } : t;
      }) || [];
      return { ...currentData, tasks };
    }
    default:
      return currentData;
  }
}

// ========================================
// キャッシュユーティリティ
// ========================================

const CACHE_KEY_PREFIX = 'fd_workspace_data_';
const CACHE_VERSION_KEY_PREFIX = 'fd_workspace_version_';
const CACHE_TIMESTAMP_KEY_PREFIX = 'fd_workspace_ts_';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5分（データ鮮度向上のため短縮）

interface CachedData {
  data: AppData;
  version: number;
  timestamp: number;
}

function getCacheKey(workspaceId: string): string {
  return `${CACHE_KEY_PREFIX}${workspaceId}`;
}

function getVersionKey(workspaceId: string): string {
  return `${CACHE_VERSION_KEY_PREFIX}${workspaceId}`;
}

function getTimestampKey(workspaceId: string): string {
  return `${CACHE_TIMESTAMP_KEY_PREFIX}${workspaceId}`;
}

function loadFromCache(workspaceId: string): CachedData | null {
  if (typeof window === 'undefined') return null;

  try {
    const dataStr = localStorage.getItem(getCacheKey(workspaceId));
    const versionStr = localStorage.getItem(getVersionKey(workspaceId));
    const timestampStr = localStorage.getItem(getTimestampKey(workspaceId));

    if (!dataStr || !versionStr || !timestampStr) return null;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    // キャッシュが古すぎる場合は無効
    if (now - timestamp > CACHE_MAX_AGE_MS) {
      clearCache(workspaceId);
      return null;
    }

    const data = JSON.parse(dataStr) as AppData;
    const version = parseInt(versionStr, 10);

    return { data, version, timestamp };
  } catch (err) {
    console.warn('[Cache] Failed to load from cache:', err);
    return null;
  }
}

function saveToCache(workspaceId: string, data: AppData, version: number): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(getCacheKey(workspaceId), JSON.stringify(data));
    localStorage.setItem(getVersionKey(workspaceId), String(version));
    localStorage.setItem(getTimestampKey(workspaceId), String(Date.now()));
  } catch (err) {
    console.warn('[Cache] Failed to save to cache:', err);
    // localStorage quota exceeded - clear old data
    try {
      clearCache(workspaceId);
    } catch {
      // ignore
    }
  }
}

function clearCache(workspaceId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(getCacheKey(workspaceId));
    localStorage.removeItem(getVersionKey(workspaceId));
    localStorage.removeItem(getTimestampKey(workspaceId));
  } catch {
    // ignore
  }
}

// ========================================
// 型定義
// ========================================

export interface ConflictState {
  isOpen: boolean;
  serverVersion?: number;
  clientVersion?: number;
  pendingData?: AppData;
}

export interface SaveResult {
  success: boolean;
  version?: number;
  error?: string;
  conflict?: boolean;
}

export interface OptimisticSaveOptions {
  optimistic?: boolean;  // Phase 15.4: オプティミスティックUI更新を即座に実行
}

export interface WorkspaceDataContextValue {
  data: AppData | null;
  version: number | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  conflict: ConflictState;
  reload: () => Promise<void>;
  // Phase 16: コマンドベースの保存をサポート
  saveData: (newData: Partial<AppData> | CommandPayload, options?: OptimisticSaveOptions) => Promise<SaveResult>;
  forceSaveData: (newData: Partial<AppData>) => Promise<SaveResult>;
  resolveConflict: (action: 'reload' | 'overwrite' | 'cancel') => Promise<void>;
  updateData: <K extends keyof AppData>(key: K, value: AppData[K]) => void;
}

// ========================================
// Context
// ========================================

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

// ========================================
// Provider
// ========================================

interface WorkspaceDataProviderProps {
  children: ReactNode;
}

export function WorkspaceDataProvider({ children }: WorkspaceDataProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.workspaceId;

  // State
  const [data, setData] = useState<AppData | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState>({ isOpen: false });
  const [isStale, setIsStale] = useState(false); // キャッシュデータを表示中

  // Ref for pending data during conflict resolution
  const pendingDataRef = useRef<Partial<AppData> | null>(null);
  // 重複フェッチ防止
  const isFetchingRef = useRef(false);
  // キャッシュ初期化済みフラグ
  const cacheInitializedRef = useRef(false);

  // Phase 14.9-R: useRefで最新のdata/versionを追跡（stale closure対策）
  const dataRef = useRef<AppData | null>(null);
  const versionRef = useRef<number | null>(null);

  // Phase 15: 保存キュー（並列保存による競合を防止）
  const saveQueueRef = useRef<Promise<SaveResult>>(Promise.resolve({ success: true }));
  const isSavingRef = useRef(false);

  // Phase 15.3: グローバル削除タスクID追跡（並列操作での削除復活を防止）
  const deletedTaskIdsRef = useRef<Set<string>>(new Set());

  // Phase 14.9-R: useLayoutEffectでRefをstateと同期（レンダリング前に即座に更新）
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);

  useLayoutEffect(() => {
    versionRef.current = version;
  }, [version]);

  // ========================================
  // キャッシュからの初期ロード（無効化 - Phase 15.2）
  // 4象限ボードでリアルタイム同期が重要なため、キャッシュは使用しない
  // ========================================

  // useEffect(() => {
  //   if (cacheInitializedRef.current || !workspaceId) return;
  //   cacheInitializedRef.current = true;
  //
  //   const cached = loadFromCache(workspaceId);
  //   if (cached) {
  //     setData(cached.data);
  //     setVersion(cached.version);
  //     setIsStale(true); // キャッシュデータなので stale
  //     setLoading(false); // 即座に表示可能
  //     console.warn(`[Cache] Loaded cached data v${cached.version} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
  //   }
  // }, [workspaceId]);

  // ========================================
  // データ読み込み（バックグラウンドで最新取得）
  // ========================================

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    // 重複フェッチ防止
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    try {
      // キャッシュがない場合のみローディング表示
      if (!data) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/data`, {
        credentials: 'include',
      });

      checkClientVersion(response);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      setData(result.data);
      setVersion(result.version);
      setIsStale(false); // 最新データ

      // キャッシュに保存
      saveToCache(workspaceId, result.data, result.version);

      const serverAppVersion = response.headers.get(VERSION_HEADER);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[WorkspaceDataContext] Loaded fresh data v${result.version}, app v${serverAppVersion || 'unknown'}`);
      }
    } catch (err) {
      console.error('[WorkspaceDataContext] Load error:', err);
      // キャッシュデータがあればエラーを表示しない
      if (!data) {
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [workspaceId, data]);

  // 認証完了後にデータを読み込み（バックグラウンド）
  useEffect(() => {
    if (!authLoading) {
      if (workspaceId) {
        reload();
      } else {
        console.warn('[WorkspaceDataContext] No workspaceId available');
        setLoading(false);
        setError('ワークスペースが割り当てられていません。ページを再読み込みしてください。');
      }
    }
  }, [authLoading, workspaceId, reload]);

  // ========================================
  // データ保存
  // Phase 16: コマンドベースの保存をサポート
  // ========================================

  const saveData = useCallback(async (payload: Partial<AppData> | CommandPayload): Promise<SaveResult> => {
    // Phase 16: コマンドかデータかを判定
    const isCommand = isCommandPayload(payload);
    const command = isCommand ? payload.command : null;

    // Phase 16: オプティミスティックUI - コマンドの場合は即座にUIを更新
    if (command) {
      const currentData = dataRef.current;
      if (currentData) {
        const optimisticData = applyCommand(currentData, command);
        // 即座にUIを更新（体感速度向上）
        setData(optimisticData);
        // Phase 16 Fix: dataRefも即座に更新（saveOperation実行時に最新データを使用するため）
        dataRef.current = optimisticData;
        console.warn(`[WorkspaceDataContext] Optimistic UI update: ${command.type}`);

        // DELETE_TASKの場合は削除IDを追跡
        if (command.type === 'DELETE_TASK') {
          deletedTaskIdsRef.current.add(command.taskId);
        }
      }
    }

    // Phase 15: 保存処理をキューに入れて直列化（並列保存による競合を完全防止）
    const saveOperation = async (): Promise<SaveResult> => {
      // Phase 14.9-R: useRefから最新値を取得（stale closure対策）
      const currentData = dataRef.current;
      const currentVersion = versionRef.current;

      if (!workspaceId || !currentData) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      // Phase 15: 既に保存中の場合は、最新のstateを使ってマージ
      if (isSavingRef.current) {
        console.warn('[WorkspaceDataContext] Queuing save operation (another save in progress)');
      }

      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 50; // Phase 16: リトライ間隔を短縮

      // Phase 16: コマンドベースの場合は、キュー実行時の最新データに対してコマンドを適用
      let mergedData: AppData;
      if (command) {
        // Phase 16 Fix: 常にコマンドを再適用（並列操作やタイミングの問題を防ぐ）
        mergedData = applyCommand(currentData, command);
        console.warn(`[WorkspaceDataContext] Re-applying command in saveOperation: ${command.type}, tasks: ${mergedData.tasks?.length}`);
      } else {
        // 従来のアプローチ（後方互換）
        const newData = payload as Partial<AppData>;

        // Phase 15.3: 削除されたタスクIDをグローバルRefに追加（並列操作での復活防止）
        if (newData.tasks && currentData.tasks) {
          const newTaskIds = new Set(newData.tasks.map(t => t.id));
          currentData.tasks.forEach(t => {
            if (!newTaskIds.has(t.id)) {
              deletedTaskIdsRef.current.add(t.id);
            }
          });
        }

        // Phase 15.3: newData.tasks から削除済みタスクを除外
        let filteredNewData = newData;
        if (newData.tasks && deletedTaskIdsRef.current.size > 0) {
          filteredNewData = {
            ...newData,
            tasks: newData.tasks.filter(t => !deletedTaskIdsRef.current.has(t.id)),
          };
        }

        mergedData = { ...currentData, ...filteredNewData };
      }

      // Phase 16: 削除されたタスクを最終的にフィルタ
      if (mergedData.tasks && deletedTaskIdsRef.current.size > 0) {
        mergedData = {
          ...mergedData,
          tasks: mergedData.tasks.filter(t => !deletedTaskIdsRef.current.has(t.id)),
        };
      }

      // 内部リトライ関数
      const attemptSave = async (
        dataToSave: AppData,
        attemptVersion: number | null,
        attempt: number
      ): Promise<SaveResult> => {
        const response = await fetch(`/api/workspaces/${workspaceId}/data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ data: dataToSave, version: attemptVersion }),
        });

        if (response.status === 409) {
          // 競合発生 - 自動リトライ
          const errorBody = await response.json().catch(() => ({}));
          console.warn(`[WorkspaceDataContext] 409 Conflict (attempt ${attempt}/${MAX_RETRIES})`, {
            serverVersion: errorBody.currentVersion,
            clientVersion: attemptVersion,
          });

          if (attempt < MAX_RETRIES) {
            // 少し待機してから最新データを取得
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));

            const reloadResponse = await fetch(`/api/workspaces/${workspaceId}/data`, {
              credentials: 'include',
            });

            if (reloadResponse.ok) {
              const reloadResult = await reloadResponse.json();
              const latestData = reloadResult.data as AppData;
              const latestVersion = reloadResult.version;

              // Phase 16: コマンドベースなら最新データに再適用
              let reMergedData: AppData;
              if (command) {
                reMergedData = applyCommand(latestData, command);
              } else {
                reMergedData = { ...latestData, ...(payload as Partial<AppData>) };
              }

              // 削除されたタスクをフィルタ
              if (reMergedData.tasks && deletedTaskIdsRef.current.size > 0) {
                reMergedData = {
                  ...reMergedData,
                  tasks: reMergedData.tasks.filter(t => !deletedTaskIdsRef.current.has(t.id)),
                };
              }

              // 再帰的にリトライ
              return attemptSave(reMergedData, latestVersion, attempt + 1);
            }
          }

          // リトライ上限に達した場合のみ競合モーダルを表示
          console.warn(`[WorkspaceDataContext] Max retries (${MAX_RETRIES}) reached, showing conflict modal`);

          pendingDataRef.current = payload as Partial<AppData>;
          setConflict({
            isOpen: true,
            serverVersion: errorBody.currentVersion,
            clientVersion: attemptVersion ?? undefined,
            pendingData: dataToSave,
          });

          return {
            success: false,
            error: '他のユーザーが更新しました',
            conflict: true,
          };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `保存失敗: HTTP ${response.status}`);
        }

        const result = await response.json();

        // 成功時にstate更新（RefもuseLayoutEffectで同期される）
        setData(dataToSave);
        setVersion(result.version);
        saveToCache(workspaceId, dataToSave, result.version);

        // Phase 16: 保存成功後に削除タスクIDリストをクリア
        if (deletedTaskIdsRef.current.size > 0) {
          console.warn(`[WorkspaceDataContext] Clearing ${deletedTaskIdsRef.current.size} deleted task IDs after successful save`);
          deletedTaskIdsRef.current.clear();
        }

        if (attempt > 1) {
          console.warn(`[WorkspaceDataContext] Auto-retry succeeded after ${attempt} attempts, v${result.version}`);
        } else {
          console.warn(`[WorkspaceDataContext] Saved data v${result.version}`);
        }

        return {
          success: true,
          version: result.version,
        };
      };

      try {
        isSavingRef.current = true;
        setSaving(true);
        setError(null);

        return await attemptSave(mergedData, currentVersion, 1);
      } catch (err) {
        console.error('[WorkspaceDataContext] Save error:', err);
        const message = err instanceof Error ? err.message : '保存に失敗しました';
        setError(message);
        return { success: false, error: message };
      } finally {
        isSavingRef.current = false;
        setSaving(false);
      }
    };

    // Phase 15: キューに追加して直列化（前の保存が完了してから実行）
    const newPromise = saveQueueRef.current.then(saveOperation).catch(() => saveOperation());
    saveQueueRef.current = newPromise;
    return newPromise;
  }, [workspaceId]);  // Phase 14.9-R: data, versionをdepsから削除（refで最新値取得）

  // ========================================
  // 強制保存
  // ========================================

  const forceSaveData = useCallback(async (newData: Partial<AppData>): Promise<SaveResult> => {
    // Phase 14.9-R: useRefから最新値を取得（stale closure対策）
    const currentData = dataRef.current;

    if (!workspaceId || !currentData) {
      return { success: false, error: 'ワークスペースが選択されていません' };
    }

    try {
      setSaving(true);
      setError(null);

      const mergedData = { ...currentData, ...newData };

      const response = await fetch(`/api/workspaces/${workspaceId}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: mergedData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `保存失敗: HTTP ${response.status}`);
      }

      const result = await response.json();

      setData(mergedData);
      setVersion(result.version);
      saveToCache(workspaceId, mergedData, result.version);

      console.warn(`[WorkspaceDataContext] Force saved data v${result.version}`);

      return {
        success: true,
        version: result.version,
      };
    } catch (err) {
      console.error('[WorkspaceDataContext] Force save error:', err);
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }, [workspaceId]);  // Phase 14.9-R: dataをdepsから削除（refで最新値取得）

  // ========================================
  // 競合解決
  // ========================================

  const resolveConflict = useCallback(async (action: 'reload' | 'overwrite' | 'cancel') => {
    switch (action) {
      case 'reload':
        setConflict({ isOpen: false });
        pendingDataRef.current = null;
        await reload();
        break;

      case 'overwrite':
        setConflict({ isOpen: false });
        if (pendingDataRef.current) {
          const result = await forceSaveData(pendingDataRef.current);
          if (result.success) {
            pendingDataRef.current = null;
          }
        }
        break;

      case 'cancel':
        setConflict({ isOpen: false });
        pendingDataRef.current = null;
        break;
    }
  }, [reload, forceSaveData]);

  // ========================================
  // 部分更新ヘルパー
  // ========================================

  const updateData = useCallback(<K extends keyof AppData>(key: K, value: AppData[K]) => {
    setData(prev => prev ? { ...prev, [key]: value } : null);
  }, []);

  // ========================================
  // Return（useMemoでvalue再生成を防止）
  // ========================================

  const combinedLoading = loading || authLoading;

  const value: WorkspaceDataContextValue = useMemo(() => ({
    data,
    version,
    loading: combinedLoading,
    saving,
    error,
    conflict,
    reload,
    saveData,
    forceSaveData,
    resolveConflict,
    updateData,
  }), [data, version, combinedLoading, saving, error, conflict, reload, saveData, forceSaveData, resolveConflict, updateData]);

  return (
    <WorkspaceDataContext.Provider value={value}>
      {children}
    </WorkspaceDataContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useWorkspaceDataContext(): WorkspaceDataContextValue {
  const context = useContext(WorkspaceDataContext);
  if (!context) {
    throw new Error('useWorkspaceDataContext must be used within a WorkspaceDataProvider');
  }
  return context;
}
