/**
 * TemplateManager の型定義
 */

import type { MessageTemplate } from '@/lib/types/template-categories';

export interface TemplateManagerProps {
  workspaceId: string;
  initialTemplates?: MessageTemplate[];
  onSave?: (templates: MessageTemplate[]) => Promise<void>;
}

export interface TemplateEditorState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  template: Partial<MessageTemplate>;
}

export interface TemplateCardProps {
  template: MessageTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export interface TemplateEditorModalProps {
  editor: TemplateEditorState;
  setEditor: React.Dispatch<React.SetStateAction<TemplateEditorState>>;
  onSave: () => void;
  onCancel: () => void;
  showVariablePalette: boolean;
  setShowVariablePalette: (show: boolean) => void;
  insertVariable: (key: string) => void;
}
