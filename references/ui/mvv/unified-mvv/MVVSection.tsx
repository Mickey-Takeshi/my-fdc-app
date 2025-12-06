/**
 * app/_components/mvv/unified-mvv/MVVSection.tsx
 *
 * Phase 14.35: MVVセクションコンポーネント
 */

'use client';

import { memo } from 'react';
import { Eye, Edit3, Save } from 'lucide-react';
import { MVVData } from '@/lib/hooks/useMVVViewModel';

interface MVVSectionProps {
  mvv: MVVData;
  editMVV: MVVData;
  editMode: boolean;
  saving: boolean;
  onToggleMode: () => void;
  onUpdateField: (field: keyof MVVData, value: string) => void;
  onSave: () => Promise<void>;
}

export const MVVSection = memo(function MVVSection({
  mvv,
  editMVV,
  editMode,
  saving,
  onToggleMode,
  onUpdateField,
  onSave,
}: MVVSectionProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={onToggleMode} className="btn btn-secondary" style={{ marginRight: '10px' }}>
          {editMode ? <Eye size={16} style={{ marginRight: '4px' }} /> : <Edit3 size={16} style={{ marginRight: '4px' }} />}
          {editMode ? '表示モード' : '編集モード'}
        </button>
        {editMode && (
          <button onClick={onSave} disabled={saving} className="btn btn-primary">
            <Save size={16} style={{ marginRight: '4px' }} />
            {saving ? '保存中...' : '保存'}
          </button>
        )}
      </div>

      {!editMode ? (
        <MVVDisplayView mvv={mvv} />
      ) : (
        <MVVEditForm editMVV={editMVV} onUpdateField={onUpdateField} />
      )}
    </div>
  );
});

// 表示ビュー
function MVVDisplayView({ mvv }: { mvv: MVVData }) {
  return (
    <div>
      {/* Mission */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--primary-alpha-25) 0%, var(--primary-alpha-35) 100%)',
        borderLeft: '5px solid var(--primary)',
        marginBottom: '16px',
        padding: '24px'
      }}>
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px', fontSize: '18px', fontWeight: 700 }}>
          Mission（使命）
        </h3>
        <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
          {mvv.mission || '未設定'}
        </div>
      </div>

      {/* Vision */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--primary-alpha-15) 0%, var(--primary-alpha-25) 100%)',
        borderLeft: '5px solid var(--primary-alpha-70)',
        marginBottom: '16px',
        padding: '24px'
      }}>
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
          Vision（ビジョン）
        </h3>
        <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
          {mvv.vision || '未設定'}
        </div>
      </div>

      {/* Value */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--primary-alpha-08) 0%, var(--primary-alpha-15) 100%)',
        borderLeft: '5px solid var(--primary-alpha-50)',
        padding: '24px'
      }}>
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
          Value（提供価値）
        </h3>
        <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
          {mvv.value || '未設定'}
        </div>
      </div>
    </div>
  );
}

// 編集フォーム
function MVVEditForm({
  editMVV,
  onUpdateField
}: {
  editMVV: MVVData;
  onUpdateField: (field: keyof MVVData, value: string) => void;
}) {
  return (
    <div>
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3>Mission（使命）</h3>
        <textarea
          value={editMVV.mission}
          onChange={(e) => onUpdateField('mission', e.target.value)}
          placeholder="なぜこのプロジェクトが存在するのか？"
          style={{ width: '100%', minHeight: '100px', boxSizing: 'border-box' }}
        />
      </div>
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3>Vision（ビジョン）</h3>
        <textarea
          value={editMVV.vision}
          onChange={(e) => onUpdateField('vision', e.target.value)}
          placeholder="どんな未来を実現したいのか？"
          style={{ width: '100%', minHeight: '100px', boxSizing: 'border-box' }}
        />
      </div>
      <div className="card">
        <h3>Value（提供価値）</h3>
        <textarea
          value={editMVV.value}
          onChange={(e) => onUpdateField('value', e.target.value)}
          placeholder="顧客に何を提供するのか？"
          style={{ width: '100%', minHeight: '100px', boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );
}
