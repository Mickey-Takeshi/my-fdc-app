'use client';

import { memo } from 'react';
import { Eye, Edit3, DollarSign, Trash2 } from 'lucide-react';
import type { LeanCanvasViewModel, ProductType, Product } from './types';
import { PRODUCT_ICONS } from './icons';

interface ProductsSectionProps {
  vm: LeanCanvasViewModel;
}

export const ProductsSection = memo(function ProductsSection({ vm }: ProductsSectionProps) {
  const {
    leanCanvas,
    editLeanCanvas,
    productsEditMode,
    saving,
    toggleProductsEditMode,
    updateEditProduct,
    addProduct,
    deleteProduct,
    saveProducts,
  } = vm;

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 20px 0' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={28} /> 商品構造 + アップセル・ダウンセル導線
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleProductsEditMode}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {productsEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
            {productsEditMode ? '表示モード' : '編集モード'}
          </button>
        </div>
      </div>

      {/* 表示モード */}
      {!productsEditMode && (
        <div className="card" style={{
          marginBottom: '30px',
          background: 'linear-gradient(135deg, var(--primary-alpha-05) 0%, var(--primary-alpha-12) 100%)',
          borderLeft: '5px solid var(--primary-alpha-50)',
          padding: '30px',
        }}>
          {/* Front商品表示 */}
          <ProductDisplaySection
            label="Front商品（無料〜低価格）"
            icon="gift"
            products={leanCanvas.products.front || []}
            borderColor="var(--primary-alpha-40)"
            textColor="var(--primary-dark)"
          />

          {/* アップセル導線 */}
          <UpsellArrow text="アップセル：共感→体験→参加" gradient="var(--primary-alpha-40), var(--primary-alpha-60)" />

          {/* Middle商品表示 */}
          <ProductDisplaySection
            label="Middle商品（メイン収益）"
            icon="fire"
            products={leanCanvas.products.middle || []}
            borderColor="var(--primary-alpha-70)"
            textColor="var(--primary-dark)"
          />

          {/* アップセル導線 */}
          <UpsellArrow text="アップセル：共創→変容→伴走" gradient="var(--primary-alpha-70), var(--primary)" />

          {/* Back商品表示 */}
          <ProductDisplaySection
            label="Back商品（プレミアム）"
            icon="star"
            products={leanCanvas.products.back || []}
            borderColor="var(--primary)"
            textColor="var(--primary-dark)"
            premium
          />

          {/* ダウンセル導線 */}
          <DownsellArrow text="ダウンセル：Back断念→Middle提案／Middle断念→Front継続" />
        </div>
      )}

      {/* 編集モード */}
      {productsEditMode && (
        <div className="card" style={{ marginBottom: '30px' }}>
          {/* Front商品編集 */}
          <ProductEditSection
            type="front"
            label="Front商品（無料〜低価格）"
            icon="gift"
            products={editLeanCanvas.products.front || []}
            bgColor="var(--primary-alpha-10)"
            borderColor="var(--primary-alpha-40)"
            textColor="var(--primary-dark)"
            buttonBg="var(--primary-alpha-15)"
            buttonBorder="var(--primary-alpha-40)"
            buttonText="var(--primary-dark)"
            onUpdate={updateEditProduct}
            onDelete={deleteProduct}
            onAdd={addProduct}
          />

          {/* アップセル導線 */}
          <UpsellArrow text="アップセル：共感→体験→参加" gradient="var(--primary-alpha-40), var(--primary-alpha-60)" />

          {/* Middle商品編集 */}
          <ProductEditSection
            type="middle"
            label="Middle商品（メイン収益）"
            icon="fire"
            products={editLeanCanvas.products.middle || []}
            bgColor="var(--primary-alpha-25)"
            borderColor="var(--primary-alpha-70)"
            textColor="var(--primary-dark)"
            buttonBg="var(--primary-alpha-30)"
            buttonBorder="var(--primary-alpha-70)"
            buttonText="white"
            onUpdate={updateEditProduct}
            onDelete={deleteProduct}
            onAdd={addProduct}
          />

          {/* アップセル導線 */}
          <UpsellArrow text="アップセル：共創→変容→伴走" gradient="var(--primary-alpha-70), var(--primary)" />

          {/* Back商品編集 */}
          <ProductEditSection
            type="back"
            label="Back商品（プレミアム）"
            icon="star"
            products={editLeanCanvas.products.back || []}
            bgColor="var(--primary-alpha-45)"
            borderColor="var(--primary)"
            textColor="white"
            buttonBg="var(--primary-alpha-60)"
            buttonBorder="var(--primary)"
            buttonText="white"
            onUpdate={updateEditProduct}
            onDelete={deleteProduct}
            onAdd={addProduct}
            premium
          />

          {/* ダウンセル導線 */}
          <DownsellArrow text="ダウンセル：Back断念→Middle提案／Middle断念→Front継続" />

          {/* 保存ボタン */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={saveProducts} disabled={saving} className="btn btn-primary">
              {saving ? '保存中...' : '商品構造を保存'}
            </button>
            <button onClick={toggleProductsEditMode} disabled={saving} className="btn btn-secondary">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// アップセル矢印コンポーネント
function UpsellArrow({ text, gradient }: { text: string; gradient: string }) {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <div style={{
        display: 'inline-block',
        background: `linear-gradient(135deg, ${gradient})`,
        color: 'white',
        padding: '12px 24px',
        borderRadius: '20px',
        fontWeight: '600',
        boxShadow: '0 2px 8px var(--primary-alpha-30)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
        {text}
      </div>
    </div>
  );
}

// ダウンセル矢印コンポーネント
function DownsellArrow({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <div style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-alpha-40) 100%)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '20px',
        fontWeight: '600',
        boxShadow: '0 2px 8px var(--primary-alpha-30)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
        {text}
      </div>
    </div>
  );
}

// 商品表示セクション
function ProductDisplaySection({
  label,
  icon,
  products,
  borderColor,
  textColor,
  premium = false,
}: {
  label: string;
  icon: string;
  products: Product[];
  borderColor: string;
  textColor: string;
  premium?: boolean;
}) {
  const IconComponent = PRODUCT_ICONS[icon];
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: premium ? '0 4px 12px var(--primary-alpha-20)' : '0 2px 8px var(--primary-alpha-10)',
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: textColor, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {IconComponent && <IconComponent size={18} color={textColor} />} {label}
      </h4>
      {products.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', fontSize: '14px' }}>商品が未登録です</p>
      ) : (
        products.map((product, index) => (
          <ProductDisplayCard key={index} product={product} index={index} />
        ))
      )}
    </div>
  );
}

// 商品編集セクション
function ProductEditSection({
  type,
  label,
  icon,
  products,
  bgColor,
  borderColor,
  textColor,
  buttonBg,
  buttonBorder,
  buttonText,
  onUpdate,
  onDelete,
  onAdd,
  premium = false,
}: {
  type: ProductType;
  label: string;
  icon: string;
  products: Product[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  onUpdate: (type: ProductType, index: number, field: keyof Product, value: string) => void;
  onDelete: (type: ProductType, index: number) => void;
  onAdd: (type: ProductType) => void;
  premium?: boolean;
}) {
  const IconComponent = PRODUCT_ICONS[icon];
  return (
    <div style={{
      background: bgColor,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      borderLeft: `4px solid ${borderColor}`,
      boxShadow: premium ? '0 4px 12px var(--primary-alpha-20)' : 'none',
    }}>
      <h4 style={{
        margin: '0 0 15px 0',
        color: textColor,
        textShadow: premium ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {IconComponent && <IconComponent size={18} color={textColor} />} {label}
      </h4>
      {products.map((product, index) => (
        <ProductEditCard
          key={index}
          product={product}
          index={index}
          type={type}
          color={borderColor}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
      <button
        onClick={() => onAdd(type)}
        className="btn btn-secondary btn-small"
        style={{
          marginTop: '10px',
          background: buttonBg,
          border: `1px solid ${buttonBorder}`,
          color: buttonText,
          fontWeight: premium ? '600' : '400',
        }}
      >
        + {type.charAt(0).toUpperCase() + type.slice(1)}商品追加
      </button>
    </div>
  );
}

function ProductEditCard({
  product,
  index,
  type,
  color,
  onUpdate,
  onDelete,
}: {
  product: Product;
  index: number;
  type: ProductType;
  color: string;
  onUpdate: (type: ProductType, index: number, field: keyof Product, value: string) => void;
  onDelete: (type: ProductType, index: number) => void;
}) {
  return (
    <div style={{
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '12px',
      border: `2px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <input
          type="text"
          value={product.name}
          onChange={(e) => onUpdate(type, index, 'name', e.target.value)}
          placeholder="商品名"
          style={{
            flex: 1,
            marginRight: '10px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            fontWeight: '600',
          }}
        />
        <button
          onClick={() => onDelete(type, index)}
          className="btn btn-secondary btn-small"
          style={{ color: 'var(--error)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <input
        type="text"
        value={product.price}
        onChange={(e) => onUpdate(type, index, 'price', e.target.value)}
        placeholder="価格"
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
      />
      <textarea
        value={product.description}
        onChange={(e) => onUpdate(type, index, 'description', e.target.value)}
        placeholder="商品説明"
        rows={2}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          marginBottom: '10px',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <input
        type="text"
        value={product.emotion}
        onChange={(e) => onUpdate(type, index, 'emotion', e.target.value)}
        placeholder="感動ポイント（例：「この発想、面白い」共鳴）"
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function ProductDisplayCard({ product, index }: { product: Product; index: number }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '12px',
      borderLeft: `3px solid rgba(var(--primary-rgb), ${0.3 + index * 0.1})`,
    }}>
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
  );
}
