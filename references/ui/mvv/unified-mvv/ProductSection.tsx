/**
 * app/_components/mvv/unified-mvv/ProductSection.tsx
 *
 * Phase 14.35: 商品セクションコンポーネント
 */

'use client';

import { memo } from 'react';
import { Trash2, DollarSign } from 'lucide-react';
import { Product } from '@/lib/types/app-data';

interface ProductSectionProps {
  type: 'front' | 'middle' | 'back';
  label: string;
  icon: React.ReactNode;
  products: Product[];
  borderColor: string;
  textColor: string;
  editMode: boolean;
  onUpdate: (type: 'front' | 'middle' | 'back', index: number, field: keyof Product, value: string) => void;
  onDelete: (type: 'front' | 'middle' | 'back', index: number) => void;
  onAdd: (type: 'front' | 'middle' | 'back') => void;
  premium?: boolean;
}

export const ProductSection = memo(function ProductSection({
  type,
  label,
  icon,
  products,
  borderColor,
  textColor,
  editMode,
  onUpdate,
  onDelete,
  onAdd,
  premium = false,
}: ProductSectionProps) {
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: premium ? '0 4px 12px var(--primary-alpha-20)' : '0 2px 8px var(--primary-alpha-10)',
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: textColor, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon} {label}
      </h4>
      {products?.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', fontSize: '14px' }}>商品が未登録です</p>
      ) : (
        products?.map((product, index) => (
          <ProductCard
            key={index}
            product={product}
            index={index}
            type={type}
            editMode={editMode}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))
      )}
      {editMode && (
        <button onClick={() => onAdd(type)} className="btn btn-secondary btn-small" style={{ marginTop: '10px' }}>
          + {type.charAt(0).toUpperCase() + type.slice(1)}商品追加
        </button>
      )}
    </div>
  );
});

// 商品カード
function ProductCard({
  product,
  index,
  type,
  editMode,
  onUpdate,
  onDelete,
}: {
  product: Product;
  index: number;
  type: 'front' | 'middle' | 'back';
  editMode: boolean;
  onUpdate: (type: 'front' | 'middle' | 'back', index: number, field: keyof Product, value: string) => void;
  onDelete: (type: 'front' | 'middle' | 'back', index: number) => void;
}) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '12px',
      borderLeft: `3px solid rgba(var(--primary-rgb), ${0.3 + index * 0.1})`,
    }}>
      {editMode ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
            <input
              type="text"
              value={product.name}
              onChange={(e) => onUpdate(type, index, 'name', e.target.value)}
              placeholder="商品名"
              style={{ flex: 1, marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: '600' }}
            />
            <button onClick={() => onDelete(type, index)} className="btn btn-secondary btn-small" style={{ color: 'var(--error)' }}>
              <Trash2 size={14} />
            </button>
          </div>
          <input
            type="text"
            value={product.price}
            onChange={(e) => onUpdate(type, index, 'price', e.target.value)}
            placeholder="価格"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <textarea
            value={product.description}
            onChange={(e) => onUpdate(type, index, 'description', e.target.value)}
            placeholder="商品説明"
            rows={2}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      ) : (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--primary-dark)', marginBottom: '8px', fontSize: '15px' }}>
            {product.name || '未設定'}
          </div>
          <div style={{ fontSize: '14px', color: '#546e7a', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} /> {product.price || '未設定'}
          </div>
          <div style={{ fontSize: '13px', color: '#607d8b', lineHeight: '1.5' }}>
            {product.description || '未設定'}
          </div>
        </div>
      )}
    </div>
  );
}
