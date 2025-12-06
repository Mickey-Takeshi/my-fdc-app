/**
 * app/_components/mvv/unified-mvv/components/ProductsSection.tsx
 * 商品構造セクション
 */

'use client';

import { Eye, Edit3, DollarSign, Gift, Flame, Star } from 'lucide-react';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';
import { ProductSection } from '../ProductSection';

interface ProductsSectionProps {
  leanCanvas: ReturnType<typeof useLeanCanvasViewModel>['leanCanvas'];
  editLeanCanvas: ReturnType<typeof useLeanCanvasViewModel>['editLeanCanvas'];
  productsEditMode: boolean;
  saving: boolean;
  toggleProductsEditMode: () => void;
  updateEditProduct: ReturnType<typeof useLeanCanvasViewModel>['updateEditProduct'];
  addProduct: ReturnType<typeof useLeanCanvasViewModel>['addProduct'];
  deleteProduct: ReturnType<typeof useLeanCanvasViewModel>['deleteProduct'];
  saveProducts: () => Promise<void>;
}

export function ProductsSection({
  leanCanvas,
  editLeanCanvas,
  productsEditMode,
  saving,
  toggleProductsEditMode,
  updateEditProduct,
  addProduct,
  deleteProduct,
  saveProducts,
}: ProductsSectionProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={20} /> 商品構造 + アップセル・ダウンセル導線
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleProductsEditMode} className="btn btn-secondary btn-small">
            {productsEditMode ? <Eye size={14} /> : <Edit3 size={14} />}
            {productsEditMode ? '表示' : '編集'}
          </button>
          {productsEditMode && (
            <button onClick={saveProducts} disabled={saving} className="btn btn-primary btn-small">
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary-alpha-05) 0%, var(--primary-alpha-12) 100%)',
        borderLeft: '5px solid var(--primary-alpha-50)',
        padding: '30px',
        borderRadius: '8px',
      }}>
        <ProductSection
          type="front"
          label="Front商品（無料〜低価格）"
          icon={<Gift size={20} />}
          products={productsEditMode ? editLeanCanvas.products.front : leanCanvas.products.front}
          borderColor="var(--primary-alpha-40)"
          textColor="var(--primary-dark)"
          editMode={productsEditMode}
          onUpdate={updateEditProduct}
          onDelete={deleteProduct}
          onAdd={addProduct}
        />

        <UpsellArrow text="↑ アップセル：共感→体験→参加" gradient="var(--primary-alpha-40), var(--primary-alpha-60)" />

        <ProductSection
          type="middle"
          label="Middle商品（メイン収益）"
          icon={<Flame size={20} />}
          products={productsEditMode ? editLeanCanvas.products.middle : leanCanvas.products.middle}
          borderColor="var(--primary-alpha-70)"
          textColor="var(--primary-dark)"
          editMode={productsEditMode}
          onUpdate={updateEditProduct}
          onDelete={deleteProduct}
          onAdd={addProduct}
        />

        <UpsellArrow text="↑ アップセル：共創→変容→伴走" gradient="var(--primary-alpha-70), var(--primary)" />

        <ProductSection
          type="back"
          label="Back商品（プレミアム）"
          icon={<Star size={20} />}
          products={productsEditMode ? editLeanCanvas.products.back : leanCanvas.products.back}
          borderColor="var(--primary)"
          textColor="var(--primary-dark)"
          editMode={productsEditMode}
          onUpdate={updateEditProduct}
          onDelete={deleteProduct}
          onAdd={addProduct}
          premium
        />

        <DownsellArrow text="↓ ダウンセル：Back断念→Middle提案／Middle断念→Front継続" />
      </div>
    </div>
  );
}

// アップセル矢印
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
        {text}
      </div>
    </div>
  );
}

// ダウンセル矢印
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
        {text}
      </div>
    </div>
  );
}
