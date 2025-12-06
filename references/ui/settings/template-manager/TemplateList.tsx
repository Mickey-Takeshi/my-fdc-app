/**
 * テンプレート一覧表示コンポーネント
 */

'use client';

import { memo } from 'react';
import { TemplateCard } from './TemplateCard';
import type { MessageTemplate } from '@/lib/types/template-categories';

interface TemplateListProps {
  templates: MessageTemplate[];
  onEdit: (template: MessageTemplate) => void;
  onDelete: (templateId: string) => void;
  onDuplicate: (template: MessageTemplate) => void;
}

export const TemplateList = memo(function TemplateList({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
}: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        テンプレートが見つかりません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template.id)}
          onDuplicate={() => onDuplicate(template)}
        />
      ))}
    </div>
  );
});
