/**
 * app/_components/settings/ImportSection.tsx
 *
 * データインポートセクション
 */

'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface ImportSectionProps {
  onImport: (file: File) => Promise<{ success: boolean; error?: string }>;
}

export function ImportSection({ onImport }: ImportSectionProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirm(true);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setShowConfirm(false);

    const importResult = await onImport(selectedFile);
    setResult(importResult);
    setImporting(false);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (importResult.success) {
      // 成功時、3秒後にページリロード
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <SectionCard
      title="データのインポート"
      icon={<Upload size={24} color="var(--primary, #6366f1)" />}
      description="JSONファイルからデータを復元します"
    >
      {/* 結果表示 */}
      {result && (
        <div
          style={{
            padding: '12px',
            background: result.success ? '#ecfdf5' : '#fef2f2',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {result.success ? (
            <>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '14px' }}>
                インポートが完了しました。ページを再読み込みします...
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ color: '#dc2626', fontSize: '14px' }}>
                {result.error || 'インポートに失敗しました'}
              </span>
            </>
          )}
        </div>
      )}

      {/* 確認ダイアログ */}
      {showConfirm && (
        <div
          style={{
            padding: '16px',
            background: '#fef3c7',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#92400e',
            }}
          >
            ⚠️ 現在のデータは上書きされます
          </p>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '13px',
              color: '#a16207',
            }}
          >
            ファイル: {selectedFile?.name}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleImport}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              インポートする
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#92400e',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ファイル選択 */}
      <div
        style={{
          padding: '32px',
          border: '2px dashed var(--border, #e5e7eb)',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={32} color="var(--text-light, #9ca3af)" style={{ marginBottom: '12px' }} />
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '14px',
            color: 'var(--text-dark, #1f2937)',
          }}
        >
          クリックしてJSONファイルを選択
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--text-light, #9ca3af)',
          }}
        >
          またはドラッグ＆ドロップ
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={importing}
        />
      </div>
    </SectionCard>
  );
}

export default ImportSection;
