/**
 * app/_components/brand/components/TonmanaCheckSection.tsx
 * トンマナチェックセクション
 */

'use client';

import {
  Search,
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { TonmanaCheckResult } from '@/lib/hooks/useBrandViewModel';

interface TonmanaCheckSectionProps {
  text: string;
  results: TonmanaCheckResult[];
  onTextChange: (text: string) => void;
  onCheck: () => void;
  onClear: () => void;
}

export function TonmanaCheckSection({
  text,
  results,
  onTextChange,
  onCheck,
  onClear,
}: TonmanaCheckSectionProps) {
  const getIcon = (type: TonmanaCheckResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} style={{ color: 'var(--primary)' }} />;
      case 'error':
        return <AlertCircle size={16} color="#f44336" />;
      case 'warning':
        return <AlertTriangle size={16} color="#FF9800" />;
      case 'info':
        return <Info size={16} style={{ color: 'var(--primary-alpha-60)' }} />;
    }
  };

  const getColor = (type: TonmanaCheckResult['type']) => {
    switch (type) {
      case 'success':
        return 'var(--primary)';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#FF9800';
      case 'info':
        return 'var(--primary-alpha-60)';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="チェックしたいテキストを入力してください..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '14px',
            minHeight: '120px',
            resize: 'vertical',
            lineHeight: '1.6',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={onCheck}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <Search size={16} />
          チェック実行
        </button>
        {results.length > 0 && (
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <Trash2 size={16} />
            クリア
          </button>
        )}
      </div>

      {/* 結果表示 */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                background: 'var(--bg-gray)',
                borderRadius: '6px',
                borderLeft: `4px solid ${getColor(result.type)}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: getColor(result.type),
                }}
              >
                {getIcon(result.type)}
                {result.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-medium)' }}>
                {result.items.map((item, idx) => (
                  <span key={idx} style={{ marginRight: '8px' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
