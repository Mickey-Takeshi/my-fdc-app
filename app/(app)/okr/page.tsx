/**
 * app/(app)/okr/page.tsx
 *
 * Phase 11: OKRページ
 */

'use client';

import { OKRProvider, useOKR } from '@/lib/contexts/OKRContext';
import { ObjectiveList, ObjectiveDetail } from '@/app/_components/okr';
import type { Objective, KeyResult } from '@/lib/types/okr';

function OKRPageContent() {
  const {
    objectives,
    selectedObjective,
    loading,
    createObjective,
    updateObjective,
    deleteObjective,
    selectObjective,
    clearSelectedObjective,
    archiveObjective,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  } = useOKR();

  const handleCreateObjective = async (title: string, period: string, description?: string) => {
    await createObjective({ title, period, description });
  };

  const handleUpdateKR = async (krId: string, updates: Partial<KeyResult>) => {
    if (!selectedObjective) return;
    await updateKeyResult(selectedObjective.id, krId, updates);
  };

  const handleDeleteKR = async (krId: string) => {
    if (!selectedObjective) return;
    await deleteKeyResult(selectedObjective.id, krId);
  };

  const handleCreateKR = async (title: string, targetValue: number, unit: string) => {
    if (!selectedObjective) return;
    await createKeyResult(selectedObjective.id, { title, targetValue, unit });
  };

  const handleUpdateObjective = async (updates: Partial<Objective>) => {
    if (!selectedObjective) return;
    await updateObjective(selectedObjective.id, updates);
  };

  const handleDeleteObjective = async () => {
    if (!selectedObjective) return;
    if (!confirm('このObjectiveを削除しますか？関連するKey Resultsも削除されます。')) return;
    await deleteObjective(selectedObjective.id);
    clearSelectedObjective();
  };

  // 詳細ビュー
  if (selectedObjective) {
    return (
      <ObjectiveDetail
        objective={selectedObjective}
        onBack={clearSelectedObjective}
        onUpdateKR={handleUpdateKR}
        onDeleteKR={handleDeleteKR}
        onCreateKR={handleCreateKR}
        onUpdateObjective={handleUpdateObjective}
        onDeleteObjective={handleDeleteObjective}
      />
    );
  }

  // 一覧ビュー
  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>OKR</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
        Objectives and Key Results。目標（O）と成果指標（KR）を設定して進捗を管理します。
      </p>
      <ObjectiveList
        objectives={objectives}
        loading={loading}
        onSelect={selectObjective}
        onArchive={archiveObjective}
        onCreate={handleCreateObjective}
      />
    </div>
  );
}

export default function OKRPage() {
  return (
    <OKRProvider>
      <OKRPageContent />
    </OKRProvider>
  );
}
