/**
 * 統合CSVセクション（Phase 14.2）
 * 2ファイル構成のシンプルなCSVインポート・エクスポート
 *
 * リファクタリング: 589行 → 約100行（コンテナのみ）
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { downloadUnifiedBusinessCSV, downloadUnifiedSalesCSV } from '@/lib/csv';
import { UsageGuide } from './UsageGuide';
import { ImportResultDisplay } from './ImportResultDisplay';
import { CSVCard } from './CSVCard';
import { useCSVImport } from './hooks/useCSVImport';
import { BUSINESS_PROMPT, SALES_PROMPT } from './constants';
import type { ImportType, ImportResult } from './types';

export const UnifiedCSVSection = memo(function UnifiedCSVSection() {
  const [importing, setImporting] = useState<ImportType>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<ImportType>(null);

  const { importBusinessCSV, importSalesCSV } = useCSVImport();

  // プロンプトをコピー
  const copyPrompt = useCallback((type: 'business' | 'sales') => {
    const prompt = type === 'business' ? BUSINESS_PROMPT : SALES_PROMPT;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(type);
    setTimeout(() => setCopiedPrompt(null), 2000);
  }, []);

  // ビジネス編CSVのインポート
  const handleBusinessImport = useCallback(
    async (file: File) => {
      setImporting('business');
      setImportResult(null);

      const result = await importBusinessCSV(file);
      setImportResult(result);
      setImporting(null);
    },
    [importBusinessCSV]
  );

  // 営業編CSVのインポート
  const handleSalesImport = useCallback(
    async (file: File) => {
      setImporting('sales');
      setImportResult(null);

      const result = await importSalesCSV(file);
      setImportResult(result);
      setImporting(null);
    },
    [importSalesCSV]
  );

  return (
    <div
      className="settings-section"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <FileSpreadsheet size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            CSV初期設定
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-medium)' }}>
            2つのCSVファイルで初期設定が完了します。AIでCSVを生成してインポート。
          </p>
        </div>
      </div>

      <UsageGuide />
      <ImportResultDisplay result={importResult} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <CSVCard
          type="business"
          importing={importing === 'business'}
          copiedPrompt={copiedPrompt}
          onCopyPrompt={copyPrompt}
          onDownloadTemplate={downloadUnifiedBusinessCSV}
          onImport={handleBusinessImport}
        />

        <CSVCard
          type="sales"
          importing={importing === 'sales'}
          copiedPrompt={copiedPrompt}
          onCopyPrompt={copyPrompt}
          onDownloadTemplate={downloadUnifiedSalesCSV}
          onImport={handleSalesImport}
        />
      </div>

      <p
        style={{
          margin: '16px 0 0',
          fontSize: '12px',
          color: 'var(--text-medium)',
          lineHeight: 1.6,
        }}
      >
        ※ インポートは既存データに追加されます。重複データは手動で削除してください。
        <br />※ CSVファイルはUTF-8で保存してください（Excelの場合は「CSV UTF-8」形式で保存）。
      </p>
    </div>
  );
});
