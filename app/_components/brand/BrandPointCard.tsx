/**
 * app/_components/brand/BrandPointCard.tsx
 *
 * Phase 15: 個別ポイント編集カード
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Edit2, X } from 'lucide-react';
import { BrandPointType, BRAND_POINT_LABELS } from '@/lib/types/brand';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

interface BrandPointCardProps {
  pointType: BrandPointType;
  index: number;
}

export function BrandPointCard({ pointType, index }: BrandPointCardProps) {
  const { getPointContent, updatePoint, currentBrand } = useBrand();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const label = BRAND_POINT_LABELS[pointType];
  const currentContent = getPointContent(pointType);

  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = async () => {
    setSaving(true);
    await updatePoint(pointType, content);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setContent(currentContent);
    setEditing(false);
  };

  if (!currentBrand) return null;

  return (
    <GlassCard
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 番号バッジ */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        {index + 1}
      </div>

      <div style={{ marginLeft: '20px' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'white' }}>{label.label}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              {label.description}
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>

        {/* コンテンツ */}
        {editing ? (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${label.label}を入力...`}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={14} />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Save size={14} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              minHeight: '60px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              color: currentContent ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {currentContent || `${label.label}を入力してください...`}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
