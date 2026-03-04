'use client';

/**
 * app/(app)/settings/page.tsx
 *
 * 設定ページ（Phase 2）
 * プロフィール編集、データExport/Import、リセット
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  User,
  Database,
  X,
} from 'lucide-react';
import type { Settings, ExportData } from '@/lib/types/settings';
import type { Task } from '@/lib/types/task';

const SETTINGS_KEY = 'fdc_settings';
const TASKS_KEY = 'fdc_tasks';

function loadSettings(): Settings {
  if (typeof window === 'undefined') return { profileName: '' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {
    // ignore
  }
  return { profileName: '' };
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {
    // ignore
  }
  return [];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ profileName: '' });
  const [saveMessage, setSaveMessage] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // プロフィール保存
  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaveMessage('saved');
    setTimeout(() => setSaveMessage(''), 2000);
  }, [settings]);

  // JSON エクスポート
  const handleExport = useCallback(() => {
    const tasks = loadTasks();
    const exportData: ExportData = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      settings,
      tasks,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fdc-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  // JSON インポート
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;

        if (!data.version || !data.exportedAt) {
          setImportMessage('error');
          setTimeout(() => setImportMessage(''), 3000);
          return;
        }

        // 設定を復元
        if (data.settings) {
          saveSettings(data.settings);
          setSettings(data.settings);
        }

        // タスクを復元
        if (Array.isArray(data.tasks)) {
          localStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks));
        }

        setImportMessage('success');
        setTimeout(() => setImportMessage(''), 3000);
      } catch {
        setImportMessage('error');
        setTimeout(() => setImportMessage(''), 3000);
      }
    };
    reader.readAsText(file);

    // 同じファイルを再選択できるようにリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // データリセット
  const handleReset = useCallback(() => {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(TASKS_KEY);
    setSettings({ profileName: '' });
    setShowResetDialog(false);
    setSaveMessage('reset');
    setTimeout(() => setSaveMessage(''), 2000);
  }, []);

  const taskCount = loadTasks().length;

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <User size={24} style={{ color: 'var(--primary)' }} />
        Settings
      </h2>

      {/* プロフィール編集 */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} style={{ color: 'var(--primary)' }} />
          Profile
        </h3>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={settings.profileName}
            onChange={(e) => setSettings({ ...settings, profileName: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            placeholder="your@email.com"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} />
            Save
          </button>

          {saveMessage === 'saved' && (
            <span style={{ color: 'var(--success)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} />
              Saved
            </span>
          )}

          {saveMessage === 'reset' && (
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} />
              Reset complete
            </span>
          )}
        </div>
      </div>

      {/* データ管理 */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} style={{ color: 'var(--primary)' }} />
          Data Management
        </h3>

        <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '20px' }}>
          Current data: {taskCount} task{taskCount !== 1 ? 's' : ''}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          {/* Export */}
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            Export JSON
          </button>

          {/* Import */}
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>

        {importMessage === 'success' && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              Import successful. Reload the page to see updated tasks.
            </div>
          </div>
        )}

        {importMessage === 'error' && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              Import failed. Invalid file format.
            </div>
          </div>
        )}

        {/* リセット */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          marginTop: '8px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
            Danger Zone: This will permanently delete all your data.
          </p>
          <button
            className="btn btn-danger btn-small"
            onClick={() => setShowResetDialog(true)}
          >
            <Trash2 size={14} />
            Reset All Data
          </button>
        </div>
      </div>

      {/* リセット確認ダイアログ */}
      {showResetDialog && (
        <div className="modal-overlay" onClick={() => setShowResetDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={22} style={{ color: 'var(--error)' }} />
                Confirm Reset
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowResetDialog(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-light)', marginBottom: '8px' }}>
              Are you sure you want to reset all data?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              This will delete all tasks, settings, and profile data. This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResetDialog(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                <Trash2 size={16} />
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
