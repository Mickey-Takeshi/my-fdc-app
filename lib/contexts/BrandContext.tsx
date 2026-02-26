/**
 * lib/contexts/BrandContext.tsx
 *
 * Phase 15: ブランド戦略の状態管理
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  Brand,
  BrandPoint,
  BrandWithPoints,
  BrandPointType,
} from '@/lib/types/brand';

interface BrandContextType {
  brands: Brand[];
  currentBrand: BrandWithPoints | null;
  loading: boolean;
  error: string | null;

  // ブランド操作
  fetchBrands: () => Promise<void>;
  selectBrand: (brandId: string) => Promise<void>;
  createBrand: (name: string, tagline?: string, story?: string) => Promise<Brand | null>;
  updateBrand: (brandId: string, data: Partial<Brand>) => Promise<boolean>;
  deleteBrand: (brandId: string) => Promise<boolean>;

  // ポイント操作
  updatePoint: (pointType: BrandPointType, content: string) => Promise<boolean>;
  getPointContent: (pointType: BrandPointType) => string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<BrandWithPoints | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブランドを選択（ポイント含む）
  const selectBrand = useCallback(async (brandId: string) => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch brand');

      const data = await res.json();
      setCurrentBrand(data.brand);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ブランド一覧を取得
  const fetchBrands = useCallback(async () => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands`);
      if (!res.ok) throw new Error('Failed to fetch brands');

      const data = await res.json();
      setBrands(data.brands || []);

      // 最初のブランドを自動選択
      if (data.brands?.length > 0 && !currentBrand) {
        await selectBrand(data.brands[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [workspace, currentBrand, selectBrand]);

  // ブランドを作成
  const createBrand = useCallback(async (
    name: string,
    tagline?: string,
    story?: string
  ): Promise<Brand | null> => {
    if (!workspace) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tagline, story }),
      });

      if (!res.ok) throw new Error('Failed to create brand');

      const data = await res.json();
      setBrands(prev => [...prev, data.brand]);
      await selectBrand(data.brand.id);

      return data.brand;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspace, selectBrand]);

  // ブランドを更新
  const updateBrand = useCallback(async (
    brandId: string,
    data: Partial<Brand>
  ): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update brand');

      const result = await res.json();

      // 一覧を更新
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ...result.brand } : b));

      // 現在のブランドを更新
      if (currentBrand?.id === brandId) {
        setCurrentBrand(prev => prev ? { ...prev, ...result.brand } : null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ブランドを削除
  const deleteBrand = useCallback(async (brandId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete brand');

      setBrands(prev => prev.filter(b => b.id !== brandId));

      if (currentBrand?.id === brandId) {
        setCurrentBrand(null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ポイントを更新
  const updatePoint = useCallback(async (
    pointType: BrandPointType,
    content: string
  ): Promise<boolean> => {
    if (!workspace || !currentBrand) return false;

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/points`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointType, content }),
        }
      );

      if (!res.ok) throw new Error('Failed to update point');

      const data = await res.json();

      // 現在のブランドのポイントを更新
      setCurrentBrand(prev => {
        if (!prev) return null;

        const existingIndex = prev.points.findIndex(p => p.pointType === pointType);
        const newPoints = [...prev.points];

        if (existingIndex >= 0) {
          newPoints[existingIndex] = data.point;
        } else {
          newPoints.push(data.point);
        }

        return { ...prev, points: newPoints };
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return false;
    }
  }, [workspace, currentBrand]);

  // ポイントの内容を取得
  const getPointContent = useCallback((pointType: BrandPointType): string => {
    if (!currentBrand) return '';
    const point = currentBrand.points.find(p => p.pointType === pointType);
    return point?.content || '';
  }, [currentBrand]);

  // ワークスペース変更時にブランドを取得
  useEffect(() => {
    if (workspace) {
      fetchBrands();
    } else {
      setBrands([]);
      setCurrentBrand(null);
    }
  }, [workspace?.id]);

  return (
    <BrandContext.Provider
      value={{
        brands,
        currentBrand,
        loading,
        error,
        fetchBrands,
        selectBrand,
        createBrand,
        updateBrand,
        deleteBrand,
        updatePoint,
        getPointContent,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
