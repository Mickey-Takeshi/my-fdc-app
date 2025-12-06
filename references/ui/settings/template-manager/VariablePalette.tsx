/**
 * 変数パレットコンポーネント
 */

'use client';

import { memo } from 'react';
import {
  VARIABLES_BY_CATEGORY,
  VARIABLE_CATEGORY_LABELS,
  type VariableCategory,
} from '@/lib/types/template-variables';

interface VariablePaletteProps {
  onInsert: (key: string) => void;
}

export const VariablePalette = memo(function VariablePalette({ onInsert }: VariablePaletteProps) {
  return (
    <div className="w-64 border-l pl-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        変数パレット
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        クリックで挿入
      </p>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {(Object.keys(VARIABLES_BY_CATEGORY) as VariableCategory[]).map((category) => {
          const variables = VARIABLES_BY_CATEGORY[category];
          if (variables.length === 0) return null;

          return (
            <div key={category}>
              <h5 className="text-xs font-medium text-gray-600 mb-1">
                {VARIABLE_CATEGORY_LABELS[category]}
              </h5>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => onInsert(v.key)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded transition-colors"
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-alpha-15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = ''}
                    title={v.label}
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
