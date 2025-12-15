/**
 * lib/contexts/PDCAContext.tsx
 *
 * Phase 8: PDCA分析コンテキスト
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
import type {
  ApproachGoal,
  CreateApproachGoalInput,
  UpdateApproachGoalInput,
  PDCAAnalysis,
  PeriodType,
} from '@/lib/types/pdca';

interface PDCAContextValue {
  // 状態
  weeklyAnalysis: PDCAAnalysis | null;
  monthlyAnalysis: PDCAAnalysis | null;
  goals: ApproachGoal[];
  loading: boolean;
  error: string | null;

  // アクション
  createGoal: (input: CreateApproachGoalInput) => Promise<ApproachGoal | null>;
  updateGoal: (id: string, input: UpdateApproachGoalInput) => Promise<ApproachGoal | null>;
  deleteGoal: (id: string) => Promise<void>;
  reloadAnalysis: () => Promise<void>;
}

const PDCAContext = createContext<PDCAContextValue | null>(null);

export function PDCAProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<PDCAAnalysis | null>(null);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<PDCAAnalysis | null>(null);
  const [goals, setGoals] = useState<ApproachGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // 分析データ読み込み
  const fetchAnalysis = useCallback(async (periodType: PeriodType) => {
    if (!workspaceId) return null;

    const res = await fetch(
      `/api/workspaces/${workspaceId}/pdca?periodType=${periodType}`
    );
    if (!res.ok) return null;
    return res.json();
  }, [workspaceId]);

  // 目標一覧読み込み
  const fetchGoals = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/goals`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [weekly, monthly, goalsData] = await Promise.all([
          fetchAnalysis('weekly'),
          fetchAnalysis('monthly'),
          fetchGoals(),
        ]);

        setWeeklyAnalysis(weekly);
        setMonthlyAnalysis(monthly);
        setGoals(goalsData);
      } catch (err) {
        console.error('Error loading PDCA data:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workspaceId, fetchAnalysis, fetchGoals]);

  // 分析リロード
  const reloadAnalysis = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const [weekly, monthly] = await Promise.all([
        fetchAnalysis('weekly'),
        fetchAnalysis('monthly'),
      ]);

      setWeeklyAnalysis(weekly);
      setMonthlyAnalysis(monthly);
    } catch (err) {
      console.error('Error reloading analysis:', err);
    }
  }, [workspaceId, fetchAnalysis]);

  // 目標作成
  const createGoal = useCallback(
    async (input: CreateApproachGoalInput): Promise<ApproachGoal | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '目標の作成に失敗しました');
        }

        const newGoal = await res.json();
        setGoals((prev) => [newGoal, ...prev]);

        // 分析をリロード
        await reloadAnalysis();

        return newGoal;
      } catch (err) {
        console.error('Error creating goal:', err);
        setError(err instanceof Error ? err.message : '目標の作成に失敗しました');
        return null;
      }
    },
    [workspaceId, reloadAnalysis]
  );

  // 目標更新
  const updateGoal = useCallback(
    async (id: string, input: UpdateApproachGoalInput): Promise<ApproachGoal | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/goals/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('目標の更新に失敗しました');
        }

        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));

        // 分析をリロード
        await reloadAnalysis();

        return updated;
      } catch (err) {
        console.error('Error updating goal:', err);
        setError('目標の更新に失敗しました');
        return null;
      }
    },
    [workspaceId, reloadAnalysis]
  );

  // 目標削除
  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      if (!workspaceId) return;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/goals/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('目標の削除に失敗しました');
        }

        setGoals((prev) => prev.filter((g) => g.id !== id));

        // 分析をリロード
        await reloadAnalysis();
      } catch (err) {
        console.error('Error deleting goal:', err);
        setError('目標の削除に失敗しました');
      }
    },
    [workspaceId, reloadAnalysis]
  );

  return (
    <PDCAContext.Provider
      value={{
        weeklyAnalysis,
        monthlyAnalysis,
        goals,
        loading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        reloadAnalysis,
      }}
    >
      {children}
    </PDCAContext.Provider>
  );
}

export function usePDCA() {
  const context = useContext(PDCAContext);
  if (!context) {
    throw new Error('usePDCA must be used within PDCAProvider');
  }
  return context;
}
