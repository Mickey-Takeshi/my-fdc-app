/**
 * lib/types/mvv.ts
 *
 * Phase 17: MVV 型定義
 */

// MVV エンティティ
export interface MVV {
  id: string;
  brandId: string;
  mission: string;
  vision: string;
  values: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 作成・更新用入力
export interface MVVInput {
  mission?: string;
  vision?: string;
  values?: string[];
}

// MVV セクション定義
export interface MVVSectionDefinition {
  key: 'mission' | 'vision' | 'values';
  label: string;
  description: string;
  placeholder: string;
  color: string;
  icon: string;
}

// セクション設定
export const MVV_SECTIONS: MVVSectionDefinition[] = [
  {
    key: 'mission',
    label: 'Mission（使命）',
    description: '企業・ブランドの存在意義。なぜ存在するのか？',
    placeholder: '例：テクノロジーで人々の生活を豊かにする',
    color: '#ef4444',
    icon: '🎯',
  },
  {
    key: 'vision',
    label: 'Vision（将来像）',
    description: '目指す未来の姿。どこに向かうのか？',
    placeholder: '例：すべての人がクリエイターになれる世界',
    color: '#8b5cf6',
    icon: '🔭',
  },
  {
    key: 'values',
    label: 'Values（価値観）',
    description: '大切にする価値観・行動指針',
    placeholder: '例：失敗を恐れずチャレンジする',
    color: '#22c55e',
    icon: '💎',
  },
];
