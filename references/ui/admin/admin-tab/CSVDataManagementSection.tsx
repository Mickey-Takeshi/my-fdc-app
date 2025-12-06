'use client';

import { memo } from 'react';
import { Database, Download, Upload } from 'lucide-react';

// CSV関連コンポーネントとフック
import { CSVImportButton, CSVExportButton, CSVTemplateButton } from '@/app/_components/common/CSVImportExport';
import { useMVVViewModel } from '@/lib/hooks/useMVVViewModel';
import { useOKRViewModel } from '@/lib/hooks/useOKRViewModel';
import { useActionMapViewModel } from '@/lib/hooks/useActionMapViewModel';
import { useTaskViewModel } from '@/lib/hooks/useTaskViewModel';
import { useLeadsViewModel } from '@/lib/hooks/useLeadsViewModel';
import { useClientsViewModel } from '@/lib/hooks/useClientsViewModel';
import { useTemplatesViewModel } from '@/lib/hooks/useTemplatesViewModel';
import { useSettingsViewModel } from '@/lib/hooks/useSettingsViewModel';

/**
 * CSVデータ管理セクション（Phase 14.1）
 * 全タブのCSVインポート・エクスポート・テンプレートダウンロードを集約
 */
export const CSVDataManagementSection = memo(function CSVDataManagementSection() {
  // 各ViewModelからCSV機能を取得
  const mvv = useMVVViewModel();
  const okr = useOKRViewModel();
  const actionMap = useActionMapViewModel();
  const tasks = useTaskViewModel();
  const leads = useLeadsViewModel();
  const clients = useClientsViewModel();
  const templates = useTemplatesViewModel();
  const settings = useSettingsViewModel(); // exportData用

  // CSVカテゴリ定義（1タブ = 1CSV）
  const csvCategories: Array<{
    tab: string;
    name: string;
    description?: string;
    import: (file: File) => Promise<{ success: boolean; imported?: number; error?: string }>;
    export: () => void;
    template: () => void;
    importing: boolean;
    exporting: boolean;
    disabled?: boolean;
  }> = [
    // MVVタブ
    {
      tab: 'MVV',
      name: 'MVV（ミッション・ビジョン・バリュー）',
      description: 'type: mission/vision/value',
      import: mvv.importCSV,
      export: mvv.exportCSV,
      template: mvv.downloadTemplate,
      importing: mvv.csvImporting,
      exporting: mvv.csvExporting,
    },
    // OKRタブ
    {
      tab: 'OKR',
      name: 'OKR（目標・成果指標）',
      description: 'Objective→KeyResultの順でインポート',
      import: okr.importObjectivesCSV,
      export: okr.exportObjectivesCSV,
      template: okr.downloadObjectivesTemplate,
      importing: okr.csvImporting,
      exporting: okr.csvExporting,
    },
    // ActionMapタブ
    {
      tab: 'ActionMap',
      name: 'ActionMap（マップ・アイテム）',
      description: 'Map→Itemの順でインポート',
      import: actionMap.importActionMapsCSV,
      export: actionMap.exportActionMapsCSV,
      template: actionMap.downloadActionMapsTemplate,
      importing: actionMap.csvImporting,
      exporting: actionMap.csvExporting,
    },
    // タスクタブ
    {
      tab: 'タスク',
      name: 'タスク（4象限TODO）',
      description: 'suit: spade/heart/diamond/club',
      import: tasks.importTasksCSV,
      export: tasks.exportTasksCSV,
      template: tasks.downloadTasksTemplate,
      importing: tasks.csvTasksImporting,
      exporting: tasks.csvTasksExporting,
    },
    // 見込み客タブ
    {
      tab: '見込み客',
      name: '見込み客（Prospect）',
      description: 'status: new/contacted/meeting/proposal/negotiation',
      import: async (file: File) => {
        const result = await leads.importCSV(file);
        return { success: result.imported > 0, imported: result.imported };
      },
      export: leads.exportProspectsCSV,
      template: leads.downloadProspectsTemplate,
      importing: leads.csvProspectsImporting,
      exporting: leads.csvProspectsExporting,
    },
    // 既存客タブ
    {
      tab: '既存客',
      name: '既存客（Client）',
      description: 'status: active/inactive/churned',
      import: clients.importClientsCSV,
      export: clients.exportClientsCSV,
      template: clients.downloadClientsTemplate,
      importing: clients.csvClientsImporting,
      exporting: clients.csvClientsExporting,
    },
    // テンプレートタブ
    {
      tab: 'テンプレート',
      name: 'テンプレート（スクリプト）',
      description: 'type: messenger/email/proposal/closing',
      import: templates.importTemplatesCSV,
      export: templates.exportTemplatesCSV,
      template: templates.downloadTemplatesTemplate,
      importing: templates.csvTemplatesImporting,
      exporting: templates.csvTemplatesExporting,
    },
  ];

  return (
    <div
      className="settings-section"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <Database size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            CSVデータ管理
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-medium)' }}>
            初期設定やデータ移行用。各タブのデータをCSVでインポート・エクスポートできます。
          </p>
        </div>
      </div>

      {/* インフォメーションボックス */}
      <div
        style={{
          padding: '16px',
          background: 'var(--primary-alpha-10)',
          borderLeft: '4px solid var(--primary)',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '14px', color: 'var(--text-dark)', lineHeight: 1.6 }}>
          <strong>💡 使い方のヒント</strong>
          <br />
          1. <strong>テンプレート</strong>をダウンロードしてCSVフォーマットを確認
          <br />
          2. GPTやClaudeに「このCSVフォーマットに沿ってデータを作って」と依頼
          <br />
          3. <strong>インポート</strong>でデータを一括登録
        </div>
      </div>

      {/* CSVカテゴリ一覧 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {csvCategories.map((category, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: category.disabled ? '#F3F4F6' : '#F9FAFB',
              borderRadius: '8px',
              flexWrap: 'wrap',
              gap: '12px',
              opacity: category.disabled ? 0.6 : 1,
            }}
          >
            <div style={{ flex: '1 1 280px', minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: 'var(--primary-alpha-15)',
                    color: 'var(--primary)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {category.tab}
                </span>
                <span style={{ fontWeight: 600, color: category.disabled ? 'var(--text-medium)' : 'var(--text-dark)', fontSize: '14px' }}>
                  {category.name}
                </span>
              </div>
              {category.description && (
                <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                  {category.description}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <CSVTemplateButton
                onDownload={category.template}
                label="テンプレート"
              />
              <CSVImportButton
                onImport={category.import}
                importing={category.importing}
                disabled={category.disabled}
                label="インポート"
              />
              <CSVExportButton
                onExport={category.export}
                exporting={category.exporting}
                disabled={category.disabled}
                label="エクスポート"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 全データバックアップ/リストア */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)' }}>
            全データバックアップ
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={settings.exportData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <Download size={16} />
            JSONエクスポート（全データ）
          </button>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <Upload size={16} />
            JSONからリストア
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (confirm('バックアップからリストアすると、現在のデータが上書きされます。続行しますか？')) {
                    settings.importData(file);
                  }
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-medium)' }}>
          ※ 全データをJSON形式でバックアップ/リストアできます。CSVインポート前にバックアップを推奨。
        </p>
      </div>
    </div>
  );
});
