'use client';

/**
 * app/(app)/brand/page.tsx
 *
 * ブランド戦略ページ（Phase 15）
 * - ブランド作成・選択
 * - 基本情報編集
 * - 10ポイントブランド戦略
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Sparkles,
  Loader,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { Brand, BrandPoint, BrandPointType } from '@/lib/types/brand';
import BrandProfile from './_components/BrandProfile';
import BrandPoints from './_components/BrandPoints';
import AddBrandForm from './_components/AddBrandForm';

export default function BrandPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [points, setPoints] = useState<BrandPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchBrands = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `/api/brands?workspace_id=${currentWorkspace.id}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'ブランドの取得に失敗しました');
        return;
      }
      const brandList: Brand[] = json.brands ?? [];
      setBrands(brandList);

      if (brandList.length > 0 && !selectedBrand) {
        setSelectedBrand(brandList[0]);
      }
    } catch {
      setError('ネットワークエラー');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const fetchPoints = useCallback(async () => {
    if (!selectedBrand) return;
    try {
      const res = await fetch(
        `/api/brands/${selectedBrand.id}/points`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await res.json();
      if (res.ok) {
        setPoints(json.points ?? []);
      }
    } catch {
      // silent
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (currentWorkspace) fetchBrands();
  }, [currentWorkspace, fetchBrands]);

  useEffect(() => {
    if (selectedBrand) fetchPoints();
  }, [selectedBrand, fetchPoints]);

  const handleCreate = async (data: {
    name: string;
    tagline: string;
    story: string;
  }): Promise<boolean> => {
    if (!currentWorkspace) return false;
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '作成に失敗しました');
        return false;
      }
      setBrands((prev) => [json.brand, ...prev]);
      setSelectedBrand(json.brand);
      return true;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  const handleUpdateBrand = async (
    data: { name?: string; tagline?: string; story?: string }
  ): Promise<boolean> => {
    if (!selectedBrand) return false;
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '更新に失敗しました');
        return false;
      }
      setSelectedBrand(json.brand);
      setBrands((prev) =>
        prev.map((b) => (b.id === json.brand.id ? json.brand : b))
      );
      return true;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  const handleSavePoint = async (
    pointType: BrandPointType,
    content: string
  ): Promise<boolean> => {
    if (!selectedBrand) return false;
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ point_type: pointType, content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '保存に失敗しました');
        return false;
      }
      setPoints((prev) => {
        const existing = prev.findIndex((p) => p.pointType === pointType);
        if (existing >= 0) {
          return prev.map((p, i) => (i === existing ? json.point : p));
        }
        return [...prev, json.point];
      });
      return true;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    if (!window.confirm(`"${selectedBrand.name}" を削除しますか？`)) return;

    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setBrands((prev) => prev.filter((b) => b.id !== selectedBrand.id));
        setSelectedBrand(brands.length > 1 ? brands.find((b) => b.id !== selectedBrand.id) || null : null);
        setPoints([]);
      }
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (wsLoading || !currentWorkspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {brands.length > 1 && (
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedBrand?.id || ''}
              onChange={(e) => {
                const b = brands.find((br) => br.id === e.target.value);
                if (b) setSelectedBrand(b);
              }}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          {selectedBrand && (
            <button
              className="btn btn-outline btn-small"
              onClick={handleDeleteBrand}
              style={{ color: 'var(--red)' }}
              title="ブランドを削除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          ブランドを作成
        </button>
      </div>

      {/* エラー */}
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

      {/* コンテンツ */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : selectedBrand ? (
        <div className="brand-layout">
          <BrandProfile brand={selectedBrand} onUpdate={handleUpdateBrand} />
          <BrandPoints
            brandId={selectedBrand.id}
            points={points}
            onSave={handleSavePoint}
          />
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Sparkles size={64} className="empty-state-icon" />
            <p>ブランドが登録されていません</p>
            <p style={{ fontSize: 14 }}>上のボタンからブランドを作成しましょう</p>
          </div>
        </div>
      )}

      {/* モーダル */}
      {showAddForm && (
        <AddBrandForm
          onSubmit={handleCreate}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
