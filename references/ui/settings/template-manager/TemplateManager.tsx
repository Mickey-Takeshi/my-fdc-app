/**
 * app/_components/settings/template-manager/TemplateManager.tsx
 *
 * Phase 14.6-D: テンプレート管理UI
 * リファクタリング: 560行 → 約80行（コンテナのみ）
 */

'use client';

import { memo } from 'react';
import { Plus } from 'lucide-react';
import { TemplateSearchBar } from './TemplateSearchBar';
import { TemplateList } from './TemplateList';
import { TemplateEditorModal } from './TemplateEditorModal';
import { useTemplateManager } from './hooks/useTemplateManager';
import type { TemplateManagerProps } from './types';

export const TemplateManager = memo(function TemplateManager({
  initialTemplates = [],
}: TemplateManagerProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    editor,
    setEditor,
    showVariablePalette,
    setShowVariablePalette,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleSave,
    insertVariable,
  } = useTemplateManager(initialTemplates);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">テンプレート管理</h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg"
          style={{ background: 'var(--primary)' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {/* 検索・フィルタ */}
      <TemplateSearchBar
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />

      {/* テンプレート一覧 */}
      <TemplateList
        templates={filteredTemplates()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* エディタモーダル */}
      {editor.isOpen && (
        <TemplateEditorModal
          editor={editor}
          setEditor={setEditor}
          onSave={handleSave}
          onCancel={() => {
            setEditor({ isOpen: false, mode: 'create', template: {} });
            setShowVariablePalette(false);
          }}
          showVariablePalette={showVariablePalette}
          setShowVariablePalette={setShowVariablePalette}
          insertVariable={insertVariable}
        />
      )}
    </div>
  );
});

export default TemplateManager;
