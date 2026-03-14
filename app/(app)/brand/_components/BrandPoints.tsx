'use client';

/**
 * app/(app)/brand/_components/BrandPoints.tsx
 *
 * 10ポイントブランド戦略 編集コンポーネント（Phase 15）
 */

import { useState } from 'react';
import { Save, ChevronDown, ChevronRight } from 'lucide-react';
import {
  ALL_BRAND_POINT_TYPES,
  BRAND_POINT_LABELS,
  BRAND_POINT_DESCRIPTIONS,
  type BrandPoint,
  type BrandPointType,
} from '@/lib/types/brand';

interface BrandPointsProps {
  brandId: string;
  points: BrandPoint[];
  onSave: (pointType: BrandPointType, content: string) => Promise<boolean>;
}

export default function BrandPoints({ points, onSave }: BrandPointsProps) {
  const [expandedType, setExpandedType] = useState<BrandPointType | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [saving, setSaving] = useState(false);

  const getPointContent = (type: BrandPointType): string => {
    const point = points.find((p) => p.pointType === type);
    return point?.content ?? '';
  };

  const handleExpand = (type: BrandPointType) => {
    if (expandedType === type) {
      setExpandedType(null);
    } else {
      setExpandedType(type);
      setEditingContent(getPointContent(type));
    }
  };

  const handleSave = async (type: BrandPointType) => {
    setSaving(true);
    const ok = await onSave(type, editingContent);
    if (ok) {
      setExpandedType(null);
    }
    setSaving(false);
  };

  const filledCount = ALL_BRAND_POINT_TYPES.filter(
    (type) => getPointContent(type).trim().length > 0
  ).length;

  return (
    <div className="glass-card brand-points">
      <div className="brand-points-header">
        <h3>10-Point Brand Strategy</h3>
        <span className="brand-points-count">
          {filledCount} / {ALL_BRAND_POINT_TYPES.length}
        </span>
      </div>

      <div className="brand-points-list">
        {ALL_BRAND_POINT_TYPES.map((type, index) => {
          const content = getPointContent(type);
          const isExpanded = expandedType === type;
          const isFilled = content.trim().length > 0;

          return (
            <div
              key={type}
              className={`brand-point-item ${isFilled ? 'filled' : ''} ${isExpanded ? 'expanded' : ''}`}
            >
              <button
                className="brand-point-toggle"
                onClick={() => handleExpand(type)}
              >
                <span className="brand-point-number">{index + 1}</span>
                <div className="brand-point-info">
                  <span className="brand-point-label">
                    {BRAND_POINT_LABELS[type]}
                  </span>
                  <span className="brand-point-desc">
                    {BRAND_POINT_DESCRIPTIONS[type]}
                  </span>
                </div>
                {isFilled && !isExpanded && (
                  <span className="brand-point-preview">
                    {content.substring(0, 40)}
                    {content.length > 40 ? '...' : ''}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              {isExpanded && (
                <div className="brand-point-editor">
                  <textarea
                    className="form-input"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    placeholder={`${BRAND_POINT_LABELS[type]}を入力...`}
                    rows={4}
                    autoFocus
                  />
                  <div className="brand-point-actions">
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => setExpandedType(null)}
                    >
                      キャンセル
                    </button>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleSave(type)}
                      disabled={saving}
                    >
                      <Save size={14} />
                      {saving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
