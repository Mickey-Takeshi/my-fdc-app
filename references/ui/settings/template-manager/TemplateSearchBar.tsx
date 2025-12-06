/**
 * テンプレート検索・フィルタバー
 */

'use client';

import { memo } from 'react';
import { Search, Filter } from 'lucide-react';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types/template-categories';

interface TemplateSearchBarProps {
  searchQuery: string;
  selectedCategory: TemplateCategory | 'all';
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: TemplateCategory | 'all') => void;
}

export const TemplateSearchBar = memo(function TemplateSearchBar({
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
}: TemplateSearchBarProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="テンプレートを検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
        />
      </div>
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as TemplateCategory | 'all')}
          className="appearance-none pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
        >
          <option value="all">すべてのカテゴリ</option>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
});
