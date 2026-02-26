/**
 * app/_components/settings/ExportSection.tsx
 *
 * データエクスポートセクション
 */

'use client';

import React from 'react';
import { Download, FileJson } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface ExportSectionProps {
  onExport: () => void;
}

export function ExportSection({ onExport }: ExportSectionProps) {
  return (
    <SectionCard
      title="データのエクスポート"
      icon={<Download size={24} color="var(--primary, #6366f1)" />}
      description="すべてのデータをJSONファイルとしてダウンロードします"
    >
      <div
        style={{
          padding: '20px',
          background: 'var(--bg-gray, #f9fafb)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <FileJson size={32} color="var(--primary, #6366f1)" />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-dark, #1f2937)',
              }}
            >
              エクスポート内容
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: 'var(--text-light, #9ca3af)',
              }}
            >
              プロフィール、設定、タスクデータ
            </p>
          </div>
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '13px',
            color: 'var(--text-medium, #6b7280)',
          }}
        >
          <li>プロフィール情報（名前、メール、SNSリンク等）</li>
          <li>アプリ設定（テーマ、言語、通知設定）</li>
          <li>すべてのタスクデータ</li>
        </ul>
      </div>

      <button
        onClick={onExport}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--primary, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Download size={16} />
        JSONファイルをダウンロード
      </button>
    </SectionCard>
  );
}

export default ExportSection;
