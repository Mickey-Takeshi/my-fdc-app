/**
 * UnifiedCSVSection の型定義
 */

export type ImportType = 'business' | 'sales' | null;

export interface ImportResult {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export interface CSVCardProps {
  type: 'business' | 'sales';
  importing: boolean;
  copiedPrompt: ImportType;
  onCopyPrompt: (type: 'business' | 'sales') => void;
  onDownloadTemplate: () => void;
  onImport: (file: File) => void;
}
