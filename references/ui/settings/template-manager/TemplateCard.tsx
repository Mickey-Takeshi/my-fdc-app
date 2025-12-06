/**
 * テンプレートカードコンポーネント
 */

'use client';

import { memo } from 'react';
import { Pencil, Copy, Trash2 } from 'lucide-react';
import { getCategoryInfo } from '@/lib/types/template-categories';
import { extractVariables } from '@/lib/types/template-variables';
import type { TemplateCardProps } from './types';

export const TemplateCard = memo(function TemplateCard({ template, onEdit, onDelete, onDuplicate }: TemplateCardProps) {
  const categoryInfo = getCategoryInfo(template.category);
  const variables = extractVariables(template.content);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo?.icon}</span>
          <h4 className="font-medium text-gray-800">{template.name}</h4>
        </div>
        {template.isDefault && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            デフォルト
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-2">
        {categoryInfo?.label}
      </p>

      <p className="text-sm text-gray-500 line-clamp-3 mb-3">
        {template.content.substring(0, 100)}...
      </p>

      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {variables.slice(0, 3).map((v, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
            >
              {v}
            </span>
          ))}
          {variables.length > 3 && (
            <span className="text-xs text-gray-400">
              +{variables.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600"
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = ''}
        >
          <Pencil className="w-3 h-3" />
          編集
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600"
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = ''}
        >
          <Copy className="w-3 h-3" />
          複製
        </button>
        {!template.isDefault && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
            削除
          </button>
        )}
      </div>
    </div>
  );
});
