/**
 * app/_components/mvv/unified-mvv/LeanCanvasSectionContent.tsx
 *
 * Phase 14.35: リーンキャンバスセクションコンポーネント
 */

'use client';

import { memo } from 'react';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';
import {
  CustomerEssenceSection,
  LeanCanvasGrid,
  ProductsSection,
  CustomerJourneySection,
} from './components';

interface LeanCanvasSectionContentProps {
  vm: ReturnType<typeof useLeanCanvasViewModel>;
}

export const LeanCanvasSectionContent = memo(function LeanCanvasSectionContent({ vm }: LeanCanvasSectionContentProps) {
  const {
    leanCanvas, editLeanCanvas, leanEditMode, saving, toggleLeanEditMode, updateEditLeanCanvas, saveLeanCanvas,
    productsEditMode, toggleProductsEditMode, updateEditProduct, addProduct, deleteProduct, saveProducts,
    customerJourney, editJourney, journeyEditMode, toggleJourneyEditMode, updateEditJourneyPhase, saveJourney
  } = vm;

  return (
    <div>
      {/* 顧客の本質 */}
      <CustomerEssenceSection
        leanCanvas={leanCanvas}
        editLeanCanvas={editLeanCanvas}
        leanEditMode={leanEditMode}
        saving={saving}
        toggleLeanEditMode={toggleLeanEditMode}
        updateEditLeanCanvas={updateEditLeanCanvas}
        saveLeanCanvas={saveLeanCanvas}
      />

      {/* リーンキャンバス9要素 */}
      <LeanCanvasGrid
        leanCanvas={leanCanvas}
        editLeanCanvas={editLeanCanvas}
        leanEditMode={leanEditMode}
        updateEditLeanCanvas={updateEditLeanCanvas}
      />

      {/* 商品構造 */}
      <ProductsSection
        leanCanvas={leanCanvas}
        editLeanCanvas={editLeanCanvas}
        productsEditMode={productsEditMode}
        saving={saving}
        toggleProductsEditMode={toggleProductsEditMode}
        updateEditProduct={updateEditProduct}
        addProduct={addProduct}
        deleteProduct={deleteProduct}
        saveProducts={saveProducts}
      />

      {/* カスタマージャーニー */}
      <CustomerJourneySection
        customerJourney={customerJourney}
        editJourney={editJourney}
        journeyEditMode={journeyEditMode}
        saving={saving}
        toggleJourneyEditMode={toggleJourneyEditMode}
        updateEditJourneyPhase={updateEditJourneyPhase}
        saveJourney={saveJourney}
      />
    </div>
  );
});
