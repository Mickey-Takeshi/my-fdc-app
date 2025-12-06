/**
 * CSV カード（ビジネス編・営業編）
 * ドラッグ&ドロップ対応
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { Copy, Check, Download, Upload, FileText } from 'lucide-react';
import type { CSVCardProps } from './types';

export const CSVCard = memo(function CSVCard({
  type,
  importing,
  copiedPrompt,
  onCopyPrompt,
  onDownloadTemplate,
  onImport,
}: CSVCardProps) {
  const [dragOver, setDragOver] = useState(false);

  const isBusinessCard = type === 'business';
  const stepColor = 'var(--primary)';
  const stepLabel = isBusinessCard ? 'STEP 1' : 'STEP 2';
  const title = isBusinessCard ? 'ビジネス編' : '営業編';
  const subtitle = isBusinessCard
    ? 'MVV・OKR・ActionMap・LeanCanvas'
    : '見込み客・既存客・営業テンプレート';

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onImport(file);
    }
  }, [onImport]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  }, [onImport]);

  return (
    <div
      style={{
        padding: '20px',
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: stepColor,
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {stepLabel}
          </span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
            {title}
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)' }}>
          {subtitle}
        </p>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          position: 'relative',
          padding: '20px',
          marginBottom: '12px',
          border: `2px dashed ${dragOver ? stepColor : '#D1D5DB'}`,
          borderRadius: '8px',
          background: dragOver ? 'var(--primary-alpha-10)' : 'white',
          textAlign: 'center',
          cursor: importing ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          type="file"
          accept=".csv"
          disabled={importing}
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: importing ? 'wait' : 'pointer',
          }}
        />
        {importing ? (
          <div style={{ color: 'var(--text-medium)' }}>
            <Upload size={24} style={{ marginBottom: '8px', animation: 'pulse 1s infinite' }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>インポート中...</p>
          </div>
        ) : (
          <div style={{ color: 'var(--text-medium)' }}>
            <FileText size={24} style={{ marginBottom: '8px', color: stepColor }} />
            <p style={{ margin: 0, fontSize: '13px' }}>
              CSVをドロップ or <span style={{ color: stepColor, fontWeight: 600 }}>クリック</span>
            </p>
          </div>
        )}
      </div>

      {/* ボタン群 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onCopyPrompt(type)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: copiedPrompt === type ? 'var(--primary-dark)' : stepColor,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'background 0.2s',
          }}
        >
          {copiedPrompt === type ? <Check size={14} /> : <Copy size={14} />}
          {copiedPrompt === type ? 'コピー済' : 'AIプロンプト'}
        </button>

        <button
          onClick={onDownloadTemplate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'white',
            color: 'var(--text-dark)',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <Download size={14} />
          テンプレート
        </button>
      </div>
    </div>
  );
});
