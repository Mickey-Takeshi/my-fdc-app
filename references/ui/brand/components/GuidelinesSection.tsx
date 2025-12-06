/**
 * app/_components/brand/components/GuidelinesSection.tsx
 * ブランドガイドラインセクション（表示・編集）
 */

'use client';

import { Brand } from '@/lib/types/app-data';

/**
 * ブランド指針表示セクション
 */
export function GuidelinesDisplaySection({ brand }: { brand: Brand }) {
  const items = [
    { label: 'コアメッセージ', value: brand.coreMessage, color: 'var(--primary)' },
    { label: 'トーン＆マナー', value: brand.tone, color: 'var(--primary-alpha-80)' },
    { label: '使うキーワード', value: brand.wordsUse, color: 'var(--primary-alpha-60)' },
    { label: '避けるキーワード', value: brand.wordsAvoid, color: 'var(--primary-alpha-40)' },
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: '16px',
            background: 'var(--bg-gray)',
            borderRadius: '8px',
            borderLeft: `4px solid ${item.color}`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: item.color,
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              color: item.value ? 'var(--text-dark)' : 'var(--text-light)',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.value || '未設定'}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ブランド指針編集セクション
 */
export function GuidelinesEditSection({
  editBrand,
  onUpdate,
}: {
  editBrand: Brand;
  onUpdate: (field: keyof Brand, value: string) => void;
}) {
  const fields: { key: keyof Brand; label: string; placeholder: string; color: string }[] = [
    { key: 'coreMessage', label: 'コアメッセージ', placeholder: '例：「あなたの成長を加速する」', color: 'var(--primary)' },
    { key: 'tone', label: 'トーン＆マナー', placeholder: '例：親しみやすく、専門的で、誠実な印象', color: 'var(--primary-alpha-80)' },
    { key: 'wordsUse', label: '使うキーワード（カンマ区切り）', placeholder: '例：成長、支援、パートナー、共創', color: 'var(--primary-alpha-60)' },
    { key: 'wordsAvoid', label: '避けるキーワード（カンマ区切り）', placeholder: '例：最強、圧倒的、爆速、簡単', color: 'var(--primary-alpha-40)' },
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {fields.map((field) => (
        <div key={field.key}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: field.color,
            }}
          >
            {field.label}
          </label>
          <textarea
            value={editBrand[field.key]}
            onChange={(e) => onUpdate(field.key, e.target.value)}
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
    </div>
  );
}
