/**
 * テンプレート編集モーダル
 */

'use client';

import { memo } from 'react';
import { X, Check } from 'lucide-react';
import { TEMPLATE_CATEGORIES, type TemplateCategory, type MessageTemplate } from '@/lib/types/template-categories';
import { VariablePalette } from './VariablePalette';
import type { TemplateEditorModalProps } from './types';

export const TemplateEditorModal = memo(function TemplateEditorModal({
  editor,
  setEditor,
  onSave,
  onCancel,
  showVariablePalette,
  setShowVariablePalette,
  insertVariable,
}: TemplateEditorModalProps) {
  const { template } = editor;

  const updateTemplate = (updates: Partial<MessageTemplate>) => {
    setEditor((prev) => ({
      ...prev,
      template: { ...prev.template, ...updates },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {editor.mode === 'create' ? 'テンプレート作成' : 'テンプレート編集'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4">
            {/* 左: フォーム */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名 *
                </label>
                <input
                  type="text"
                  value={template.name || ''}
                  onChange={(e) => updateTemplate({ name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  placeholder="例: 初回コンタクト（展示会）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={template.category || 'other'}
                  onChange={(e) => updateTemplate({ category: e.target.value as TemplateCategory })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={template.description || ''}
                  onChange={(e) => updateTemplate({ description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  placeholder="テンプレートの用途を簡潔に"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    内容 *
                  </label>
                  <button
                    onClick={() => setShowVariablePalette(!showVariablePalette)}
                    className="text-sm"
                    style={{ color: 'var(--primary)' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-dark)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  >
                    {showVariablePalette ? '変数パレットを閉じる' : '変数を挿入'}
                  </button>
                </div>
                <textarea
                  value={template.content || ''}
                  onChange={(e) => updateTemplate({ content: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono text-sm"
                  style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  placeholder="テンプレート本文を入力...&#10;&#10;変数は {{変数名}} の形式で挿入できます。&#10;例: {{顧客名}}様、{{会社名}}のご担当者様"
                />
              </div>
            </div>

            {/* 右: 変数パレット */}
            {showVariablePalette && <VariablePalette onInsert={insertVariable} />}
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg"
            style={{ background: 'var(--primary)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
});
