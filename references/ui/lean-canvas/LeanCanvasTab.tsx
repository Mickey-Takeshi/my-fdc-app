/**
 * app/_components/lean-canvas/LeanCanvasTab.tsx
 *
 * Phase 9.92-6: リーンキャンバスタブコンポーネント
 *
 * 【機能】
 * - リーンキャンバス9要素の表示・編集
 * - 顧客の本質（customerWants, valueProvided, emotionPoints）の管理
 * - 商品構造（Front/Middle/Back）の管理
 * - カスタマージャーニーの管理
 *
 * 【Legacy実装からの移行】
 * - archive/phase9-legacy-js/tabs/leanCanvas.ts の機能をReactで再実装
 */

'use client';

import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';
import { Eye, Edit3 } from 'lucide-react';
import {
  CustomerEssenceSection,
  LeanCanvas9Elements,
  ProductsSection,
  CustomerJourneySection,
} from './lean-canvas';

export function LeanCanvasTab() {
  const vm = useLeanCanvasViewModel();

  if (vm.loading) {
    return (
      <div className="section">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          リーンキャンバス
        </h2>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      {/* メインヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            リーンキャンバス
          </h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)' }}>
            ビジネスモデルを1枚で可視化。Front/Middle/Back商品構造とアップセル・ダウンセル導線を明確にします。
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={vm.toggleLeanEditMode}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {vm.leanEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
            {vm.leanEditMode ? '表示モード' : '編集モード'}
          </button>
          {vm.leanEditMode && (
            <button
              onClick={vm.saveLeanCanvas}
              disabled={vm.saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              {vm.saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* 顧客の本質セクション */}
      <CustomerEssenceSection vm={vm} />

      {/* リーンキャンバス9要素 */}
      <LeanCanvas9Elements vm={vm} />

      {/* 商品構造セクション */}
      <ProductsSection vm={vm} />

      {/* カスタマージャーニーセクション */}
      <CustomerJourneySection vm={vm} />
    </div>
  );
}

export default LeanCanvasTab;
