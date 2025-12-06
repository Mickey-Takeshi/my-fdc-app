/**
 * CSVインポート・エクスポート共通UIコンポーネント
 * Phase 14.1
 */

'use client';

import { useState, useRef, useCallback } from 'react';

// ========================================
// CSVImportButton
// ========================================

interface CSVImportButtonProps {
  onImport: (file: File) => Promise<{ success: boolean; imported?: number; error?: string }>;
  importing?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function CSVImportButton({
  onImport,
  importing = false,
  disabled = false,
  label = 'CSVインポート',
  className = '',
}: CSVImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);

    const importResult = await onImport(file);

    if (importResult.success) {
      setResult({
        success: true,
        message: `${importResult.imported || 0}件をインポートしました`,
      });
    } else {
      setResult({
        success: false,
        message: importResult.error || 'インポートに失敗しました',
      });
    }

    // ファイル選択をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={disabled || importing}
        className={`
          px-3 py-1.5 text-sm rounded border
          ${disabled || importing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
          }
          transition-colors
        `}
      >
        {importing ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            インポート中...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {label}
          </span>
        )}
      </button>
      {result && (
        <span className={`mt-1 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </span>
      )}
    </div>
  );
}

// ========================================
// CSVExportButton
// ========================================

interface CSVExportButtonProps {
  onExport: () => void;
  exporting?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function CSVExportButton({
  onExport,
  exporting = false,
  disabled = false,
  label = 'CSVエクスポート',
  className = '',
}: CSVExportButtonProps) {
  return (
    <button
      onClick={onExport}
      disabled={disabled || exporting}
      className={`
        px-3 py-1.5 text-sm rounded border
        ${disabled || exporting
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        }
        transition-colors
        ${className}
      `}
    >
      {exporting ? (
        <span className="flex items-center gap-1">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          エクスポート中...
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label}
        </span>
      )}
    </button>
  );
}

// ========================================
// CSVTemplateButton
// ========================================

interface CSVTemplateButtonProps {
  onDownload: () => void;
  label?: string;
  className?: string;
}

export function CSVTemplateButton({
  onDownload,
  label = 'テンプレート',
  className = '',
}: CSVTemplateButtonProps) {
  return (
    <button
      onClick={onDownload}
      className={`
        px-3 py-1.5 text-sm rounded border
        bg-white hover:bg-gray-50 text-gray-600 border-gray-200
        transition-colors
        ${className}
      `}
    >
      <span className="flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {label}
      </span>
    </button>
  );
}

// ========================================
// CSVButtonGroup（インポート・エクスポート・テンプレートをまとめて表示）
// ========================================

interface CSVButtonGroupProps {
  onImport: (file: File) => Promise<{ success: boolean; imported?: number; error?: string }>;
  onExport: () => void;
  onDownloadTemplate: () => void;
  importing?: boolean;
  exporting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CSVButtonGroup({
  onImport,
  onExport,
  onDownloadTemplate,
  importing = false,
  exporting = false,
  disabled = false,
  className = '',
}: CSVButtonGroupProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CSVImportButton
        onImport={onImport}
        importing={importing}
        disabled={disabled}
      />
      <CSVExportButton
        onExport={onExport}
        exporting={exporting}
        disabled={disabled}
      />
      <CSVTemplateButton
        onDownload={onDownloadTemplate}
      />
    </div>
  );
}

// ========================================
// CSVImportModal（詳細なインポート設定用）
// ========================================

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ success: boolean; imported?: number; error?: string }>;
  title?: string;
  description?: string;
  templateUrl?: string;
}

export function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  title = 'CSVインポート',
  description,
  templateUrl,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const importResult = await onImport(file);

      if (importResult.success) {
        setResult({
          success: true,
          message: `${importResult.imported || 0}件をインポートしました`,
        });
        setTimeout(() => {
          onClose();
          setFile(null);
          setResult(null);
        }, 1500);
      } else {
        setResult({
          success: false,
          message: importResult.error || 'インポートに失敗しました',
        });
      }
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>

        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {/* Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center
            ${file ? 'border-green-400 bg-green-50' : 'border-gray-300'}
            transition-colors
          `}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          {file ? (
            <div>
              <svg className="h-8 w-8 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                クリックして別のファイルを選択
              </p>
            </div>
          ) : (
            <div>
              <svg className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">
                ここにCSVファイルをドロップ
              </p>
              <p className="text-xs text-gray-500 mt-1">
                または クリックしてファイルを選択
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {result.message}
          </div>
        )}

        {/* Template Link */}
        {templateUrl && (
          <p className="mt-4 text-sm text-gray-500">
            <a href={templateUrl} className="text-blue-600 hover:underline" download>
              テンプレートをダウンロード
            </a>
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className={`
              px-4 py-2 text-sm rounded
              ${!file || importing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {importing ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// CSVErrorList（インポートエラー表示用）
// ========================================

interface CSVErrorListProps {
  errors: string[];
  onClear?: () => void;
  className?: string;
}

export function CSVErrorList({ errors, onClear, className = '' }: CSVErrorListProps) {
  if (errors.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded p-3 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-red-700">インポートエラー</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <ul className="mt-2 text-sm text-red-600 list-disc list-inside space-y-1">
        {errors.slice(0, 5).map((error, index) => (
          <li key={index}>{error}</li>
        ))}
        {errors.length > 5 && (
          <li className="text-red-500">...他 {errors.length - 5} 件のエラー</li>
        )}
      </ul>
    </div>
  );
}
