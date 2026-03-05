'use client';

/**
 * app/(app)/mvv/page.tsx
 *
 * MVV (Mission/Vision/Value) 管理ページ（Phase 17）
 * - Brand + MVV 統合表示
 * - 折り畳み式レイアウト
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Save,
  Compass,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { Brand } from '@/lib/types/brand';
import type { MVV } from '@/lib/types/mvv';

export default function MVVPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [mvv, setMvv] = useState<MVV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 編集状態
  const [editingSection, setEditingSection] = useState<'mission' | 'vision' | 'values' | null>(null);
  const [editMission, setEditMission] = useState('');
  const [editVision, setEditVision] = useState('');
  const [editValues, setEditValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  // 折り畳み状態
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mission: true,
    vision: true,
    values: true,
  });

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/brands?workspace_id=${currentWorkspace.id}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await res.json();
      if (res.ok) {
        const brandList: Brand[] = json.brands ?? [];
        setBrands(brandList);
        if (brandList.length > 0 && !selectedBrand) {
          setSelectedBrand(brandList[0]);
        }
      }
    } catch {
      setError('ブランドの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const fetchMVV = useCallback(async () => {
    if (!selectedBrand) return;
    try {
      const res = await fetch(
        `/api/mvv?brand_id=${selectedBrand.id}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await res.json();
      if (res.ok) {
        setMvv(json.mvv);
        if (json.mvv) {
          setEditMission(json.mvv.mission);
          setEditVision(json.mvv.vision);
          setEditValues(json.mvv.values);
        }
      }
    } catch {
      // silent
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (currentWorkspace) fetchData();
  }, [currentWorkspace, fetchData]);

  useEffect(() => {
    if (selectedBrand) fetchMVV();
  }, [selectedBrand, fetchMVV]);

  const handleCreateMVV = async () => {
    if (!selectedBrand) return;
    try {
      const res = await fetch('/api/mvv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: selectedBrand.id,
          mission: '',
          vision: '',
          values: [],
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMvv(json.mvv);
        setEditMission('');
        setEditVision('');
        setEditValues([]);
      } else {
        setError(json.error || '作成に失敗しました');
      }
    } catch {
      setError('ネットワークエラー');
    }
  };

  const handleSave = async (section: 'mission' | 'vision' | 'values') => {
    if (!mvv) return;
    setSaving(true);

    const data: Record<string, string | string[]> = {};
    if (section === 'mission') data.mission = editMission;
    if (section === 'vision') data.vision = editVision;
    if (section === 'values') data.values = editValues;

    try {
      const res = await fetch(`/api/mvv/${mvv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setMvv(json.mvv);
        setEditingSection(null);
      } else {
        setError(json.error || '更新に失敗しました');
      }
    } catch {
      setError('ネットワークエラー');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addValue = () => {
    if (newValue.trim()) {
      setEditValues((prev) => [...prev, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setEditValues((prev) => prev.filter((_, i) => i !== index));
  };

  if (wsLoading || !currentWorkspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  if (!loading && brands.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <Compass size={64} className="empty-state-icon" />
          <p>ブランドが登録されていません</p>
          <p style={{ fontSize: 14 }}>先にブランドページでブランドを作成してください</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ブランド選択 */}
      {brands.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '200px' }}
            value={selectedBrand?.id || ''}
            onChange={(e) => {
              const b = brands.find((br) => br.id === e.target.value);
              if (b) { setSelectedBrand(b); setMvv(null); }
            }}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              x
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !mvv ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ marginBottom: '16px' }}>MVV (Mission/Vision/Value) を定義しましょう</p>
          <button className="btn btn-primary" onClick={handleCreateMVV}>
            <Plus size={16} /> MVV を作成
          </button>
        </div>
      ) : (
        <div className="mvv-layout">
          {/* Mission */}
          <div className="glass-card mvv-section">
            <button className="mvv-section-toggle" onClick={() => toggleSection('mission')}>
              {expandedSections.mission ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="mvv-section-label">Mission</span>
              <span className="mvv-section-sub">存在意義・使命</span>
            </button>
            {expandedSections.mission && (
              <div className="mvv-section-content">
                {editingSection === 'mission' ? (
                  <div>
                    <textarea
                      className="form-input"
                      value={editMission}
                      onChange={(e) => setEditMission(e.target.value)}
                      rows={3}
                      placeholder="企業の存在意義・使命を記述..."
                      autoFocus
                    />
                    <div className="mvv-section-actions">
                      <button className="btn btn-outline btn-small" onClick={() => setEditingSection(null)}>
                        キャンセル
                      </button>
                      <button className="btn btn-primary btn-small" onClick={() => handleSave('mission')} disabled={saving}>
                        <Save size={14} /> {saving ? '...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setEditingSection('mission'); setEditMission(mvv.mission); }} style={{ cursor: 'pointer' }}>
                    {mvv.mission ? (
                      <p className="mvv-text">{mvv.mission}</p>
                    ) : (
                      <p className="mvv-empty">クリックして入力...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vision */}
          <div className="glass-card mvv-section">
            <button className="mvv-section-toggle" onClick={() => toggleSection('vision')}>
              {expandedSections.vision ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="mvv-section-label">Vision</span>
              <span className="mvv-section-sub">実現したい将来像</span>
            </button>
            {expandedSections.vision && (
              <div className="mvv-section-content">
                {editingSection === 'vision' ? (
                  <div>
                    <textarea
                      className="form-input"
                      value={editVision}
                      onChange={(e) => setEditVision(e.target.value)}
                      rows={3}
                      placeholder="実現したい将来像を記述..."
                      autoFocus
                    />
                    <div className="mvv-section-actions">
                      <button className="btn btn-outline btn-small" onClick={() => setEditingSection(null)}>
                        キャンセル
                      </button>
                      <button className="btn btn-primary btn-small" onClick={() => handleSave('vision')} disabled={saving}>
                        <Save size={14} /> {saving ? '...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setEditingSection('vision'); setEditVision(mvv.vision); }} style={{ cursor: 'pointer' }}>
                    {mvv.vision ? (
                      <p className="mvv-text">{mvv.vision}</p>
                    ) : (
                      <p className="mvv-empty">クリックして入力...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Values */}
          <div className="glass-card mvv-section">
            <button className="mvv-section-toggle" onClick={() => toggleSection('values')}>
              {expandedSections.values ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="mvv-section-label">Values</span>
              <span className="mvv-section-sub">価値観・行動指針</span>
              {mvv.values.length > 0 && (
                <span className="mvv-values-count">{mvv.values.length}</span>
              )}
            </button>
            {expandedSections.values && (
              <div className="mvv-section-content">
                {editingSection === 'values' ? (
                  <div>
                    <div className="mvv-values-edit">
                      {editValues.map((v, i) => (
                        <div key={i} className="mvv-value-item-edit">
                          <span>{v}</span>
                          <button onClick={() => removeValue(i)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mvv-value-add">
                      <input
                        className="form-input"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="価値観を追加..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addValue(); }
                        }}
                      />
                      <button className="btn btn-outline btn-small" onClick={addValue} disabled={!newValue.trim()}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="mvv-section-actions">
                      <button className="btn btn-outline btn-small" onClick={() => setEditingSection(null)}>
                        キャンセル
                      </button>
                      <button className="btn btn-primary btn-small" onClick={() => handleSave('values')} disabled={saving}>
                        <Save size={14} /> {saving ? '...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setEditingSection('values'); setEditValues([...mvv.values]); }} style={{ cursor: 'pointer' }}>
                    {mvv.values.length > 0 ? (
                      <ul className="mvv-values-list">
                        {mvv.values.map((v, i) => (
                          <li key={i} className="mvv-value-item">{v}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mvv-empty">クリックして追加...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
