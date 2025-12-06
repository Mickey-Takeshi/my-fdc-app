/**
 * TemplateManager のロジックフック
 */

import { useState, useCallback, useRef } from 'react';
import type { MessageTemplate, TemplateCategory } from '@/lib/types/template-categories';
import { DEFAULT_TEMPLATES, filterTemplatesByCategory, searchTemplates } from '@/lib/types/template-categories';
import type { TemplateEditorState } from '../types';

export function useTemplateManager(initialTemplates: MessageTemplate[] = []) {
  const idCounterRef = useRef(0);
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `custom-${idCounterRef.current}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const [templates, setTemplates] = useState<MessageTemplate[]>([
    ...DEFAULT_TEMPLATES,
    ...initialTemplates,
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  const [editor, setEditor] = useState<TemplateEditorState>({
    isOpen: false,
    mode: 'create',
    template: {},
  });

  const [showVariablePalette, setShowVariablePalette] = useState(false);

  // フィルタ適用
  const filteredTemplates = useCallback(() => {
    let result = templates;

    if (selectedCategory !== 'all') {
      result = filterTemplatesByCategory(result, selectedCategory);
    }

    if (searchQuery) {
      result = searchTemplates(result, searchQuery);
    }

    return result;
  }, [templates, selectedCategory, searchQuery]);

  // テンプレート作成
  const handleCreate = useCallback(() => {
    setEditor({
      isOpen: true,
      mode: 'create',
      template: {
        name: '',
        category: 'other',
        content: '',
        tags: [],
      },
    });
    setShowVariablePalette(true);
  }, []);

  // テンプレート編集
  const handleEdit = useCallback((template: MessageTemplate) => {
    if (template.isDefault) {
      setEditor({
        isOpen: true,
        mode: 'create',
        template: {
          ...template,
          id: undefined,
          name: `${template.name}（コピー）`,
          isDefault: false,
        },
      });
    } else {
      setEditor({
        isOpen: true,
        mode: 'edit',
        template: { ...template },
      });
    }
    setShowVariablePalette(true);
  }, []);

  // テンプレート削除
  const handleDelete = useCallback((templateId: string) => {
    if (confirm('このテンプレートを削除しますか？')) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  }, []);

  // テンプレート複製
  const handleDuplicate = useCallback((template: MessageTemplate) => {
    const now = new Date().toISOString();
    const newTemplate: MessageTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name}（コピー）`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    setTemplates((prev) => [...prev, newTemplate]);
  }, [generateId]);

  // エディタ保存
  const handleSave = useCallback(() => {
    const { mode, template } = editor;

    if (!template.name || !template.content) {
      alert('名前と内容は必須です');
      return;
    }

    const now = new Date().toISOString();

    if (mode === 'create') {
      const newTemplate: MessageTemplate = {
        id: generateId(),
        name: template.name,
        category: template.category || 'other',
        content: template.content,
        description: template.description,
        tags: template.tags,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      setTemplates((prev) => [...prev, newTemplate]);
    } else {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id
            ? { ...t, ...template, updatedAt: now }
            : t
        )
      );
    }

    setEditor({ isOpen: false, mode: 'create', template: {} });
    setShowVariablePalette(false);
  }, [editor, generateId]);

  // 変数挿入
  const insertVariable = useCallback((variableKey: string) => {
    setEditor((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        content: (prev.template.content || '') + variableKey,
      },
    }));
  }, []);

  return {
    templates,
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
  };
}
