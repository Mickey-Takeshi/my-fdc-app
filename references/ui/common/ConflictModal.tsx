/**
 * app/_components/common/ConflictModal.tsx
 *
 * Phase 10-A (BR-06): 楽観的排他制御の競合解決モーダル
 *
 * 409 Conflict エラー発生時にユーザーに選択肢を提示：
 * 1. リロードして最新化 - サーバーの最新データを取得
 * 2. 強制上書き - 自分の変更でサーバーを上書き
 */

'use client';

import { useCallback } from 'react';
import { AlertTriangle, RefreshCw, Upload } from 'lucide-react';

export interface ConflictModalProps {
  /** モーダルを表示するかどうか */
  isOpen: boolean;
  /** 現在のサーバーバージョン */
  serverVersion?: number;
  /** クライアントが持っていたバージョン */
  clientVersion?: number;
  /** リロード（最新化）を選択した時のコールバック */
  onReload: () => void;
  /** 強制上書きを選択した時のコールバック */
  onForceOverwrite: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

export function ConflictModal({
  isOpen,
  serverVersion,
  clientVersion,
  onReload,
  onForceOverwrite,
  onCancel,
}: ConflictModalProps) {
  const handleReload = useCallback(() => {
    onReload();
  }, [onReload]);

  const handleForceOverwrite = useCallback(() => {
    if (window.confirm('警告: サーバー上の変更が失われます。本当に上書きしますか？')) {
      onForceOverwrite();
    }
  }, [onForceOverwrite]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/30 px-6 py-4 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h2
              id="conflict-modal-title"
              className="text-lg font-semibold text-amber-800 dark:text-amber-200"
            >
              データの競合が発生しました
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            他のユーザーまたは別のタブでデータが更新されました。
            どのように解決しますか？
          </p>

          {/* Version info */}
          {(serverVersion !== undefined || clientVersion !== undefined) && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">あなたのバージョン:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">
                  v{clientVersion ?? '不明'}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600 dark:text-gray-400">サーバーのバージョン:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">
                  v{serverVersion ?? '不明'}
                </span>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {/* Option 1: Reload */}
            <button
              onClick={handleReload}
              className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  リロードして最新化
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  サーバーの最新データを取得します（推奨）
                </div>
              </div>
            </button>

            {/* Option 2: Force Overwrite */}
            <button
              onClick={handleForceOverwrite}
              className="w-full flex items-center gap-3 p-4 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left"
            >
              <Upload className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-800 dark:text-red-200">
                  自分の変更で上書き
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  サーバーの変更を破棄し、あなたの変更を保存します
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictModal;
