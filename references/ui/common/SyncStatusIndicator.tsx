/**
 * app/_components/common/SyncStatusIndicator.tsx
 *
 * Phase 14.3-A: 同期ステータス表示コンポーネント
 *
 * 【責務】
 * - 非同期同期ジョブのステータス表示
 * - 進行状況のインジケーター
 * - エラー表示とリトライ
 */

'use client';

import { useCallback } from 'react';
import type { SyncStatus, SyncResult } from '@/lib/hooks/useAsyncGoogleSync';

// ========================================
// 型定義
// ========================================

interface SyncStatusIndicatorProps {
  /** 現在のステータス */
  status: SyncStatus;
  /** 同期結果（完了時） */
  result?: SyncResult | null;
  /** エラーメッセージ */
  error?: string | null;
  /** リトライコールバック */
  onRetry?: () => void;
  /** 閉じるコールバック */
  onDismiss?: () => void;
  /** コンパクトモード */
  compact?: boolean;
}

// ========================================
// ステータス設定
// ========================================

const STATUS_CONFIG: Record<SyncStatus, {
  icon: string;
  text: string;
  color: string;
  bgColor: string;
  animate?: boolean;
}> = {
  idle: {
    icon: '⏸️',
    text: '待機中',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  queued: {
    icon: '⏳',
    text: 'キュー待ち...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    animate: true,
  },
  processing: {
    icon: '🔄',
    text: '同期中...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    animate: true,
  },
  completed: {
    icon: '✅',
    text: '完了',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  failed: {
    icon: '❌',
    text: '失敗',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

// ========================================
// コンポーネント
// ========================================

export function SyncStatusIndicator({
  status,
  result,
  error,
  onRetry,
  onDismiss,
  compact = false,
}: SyncStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  // フックは条件分岐の前に呼ぶ必要がある
  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // idle状態では表示しない
  if (status === 'idle') {
    return null;
  }

  // コンパクトモード
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color} ${config.bgColor}`}
      >
        <span className={config.animate ? 'animate-spin' : ''}>
          {config.icon}
        </span>
        <span>{config.text}</span>
      </span>
    );
  }

  // フルモード
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor} border border-opacity-20`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* アイコン */}
        <span
          className={`text-xl ${config.animate ? 'animate-spin' : ''}`}
          aria-hidden="true"
        >
          {config.icon}
        </span>

        {/* テキスト */}
        <div className="flex flex-col">
          <span className={`font-medium ${config.color}`}>
            {config.text}
          </span>

          {/* 結果詳細（完了時） */}
          {status === 'completed' && result && (
            <span className="text-xs text-gray-600">
              {result.tasksSync && (
                <>
                  タスク: {result.tasksSync.synced}件同期
                  {result.tasksSync.conflicts > 0 && `, ${result.tasksSync.conflicts}件競合`}
                </>
              )}
              {result.calendarSync && result.calendarSync.created + result.calendarSync.updated > 0 && (
                <> / カレンダー: {result.calendarSync.created + result.calendarSync.updated}件</>
              )}
            </span>
          )}

          {/* エラー詳細（失敗時） */}
          {status === 'failed' && error && (
            <span className="text-xs text-red-500">
              {error}
            </span>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center gap-2">
        {/* リトライボタン（失敗時） */}
        {status === 'failed' && onRetry && (
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
          >
            再試行
          </button>
        )}

        {/* 閉じるボタン（完了/失敗時） */}
        {(status === 'completed' || status === 'failed') && onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ========================================
// エクスポート
// ========================================

export type { SyncStatusIndicatorProps };
