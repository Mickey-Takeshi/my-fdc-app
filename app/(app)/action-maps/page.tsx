/**
 * app/(app)/action-maps/page.tsx
 *
 * Phase 10: ActionMapページ
 */

'use client';

import { ActionMapProvider, useActionMaps } from '@/lib/contexts/ActionMapContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { ActionMapList, ActionMapDetail } from '@/app/_components/action-maps';
import type { ActionItem, ActionItemPriority } from '@/lib/types/action-map';

function ActionMapsPageContent() {
  const { workspace } = useWorkspace();
  const {
    actionMaps,
    selectedMap,
    loading,
    createMap,
    updateMap,
    deleteMap,
    selectMap,
    clearSelectedMap,
    archiveMap,
    createItem,
    updateItem,
    deleteItem,
  } = useActionMaps();

  const workspaceId = workspace?.id || '';

  const handleCreateMap = async (title: string, description?: string) => {
    await createMap({ title, description });
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<ActionItem>) => {
    if (!selectedMap) return;
    await updateItem(selectedMap.id, itemId, updates);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedMap) return;
    await deleteItem(selectedMap.id, itemId);
  };

  const handleCreateItem = async (title: string, priority: ActionItemPriority) => {
    if (!selectedMap) return;
    await createItem(selectedMap.id, { title, priority });
  };

  const handleUpdateMap = async (updates: Partial<{ title: string; description: string }>) => {
    if (!selectedMap) return;
    await updateMap(selectedMap.id, updates);
  };

  const handleDeleteMap = async () => {
    if (!selectedMap) return;
    if (!confirm('このActionMapを削除しますか？関連するアクションアイテムも削除されます。')) return;
    await deleteMap(selectedMap.id);
    clearSelectedMap();
  };

  const handleLinkTask = async (actionItemId: string, taskId: string) => {
    if (!workspaceId) return;
    await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionItemId }),
    });
  };

  const handleUnlinkTask = async (taskId: string) => {
    if (!workspaceId) return;
    await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionItemId: null }),
    });
  };

  const handleRefresh = async () => {
    if (!selectedMap) return;
    await selectMap(selectedMap.id);
  };

  const handleLinkKR = async (krId: string | null) => {
    if (!selectedMap || !workspaceId) return;
    await updateMap(selectedMap.id, { keyResultId: krId });
    await selectMap(selectedMap.id);  // リフレッシュ
  };

  // 詳細ビュー
  if (selectedMap) {
    return (
      <ActionMapDetail
        map={selectedMap}
        workspaceId={workspaceId}
        onBack={clearSelectedMap}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onCreateItem={handleCreateItem}
        onUpdateMap={handleUpdateMap}
        onDeleteMap={handleDeleteMap}
        onLinkTask={handleLinkTask}
        onUnlinkTask={handleUnlinkTask}
        onRefresh={handleRefresh}
        onLinkKR={handleLinkKR}
      />
    );
  }

  // 一覧ビュー
  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>ActionMap</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
        戦術層の施策を管理します。ActionItemを追加してタスクと紐付けましょう。
      </p>
      <ActionMapList
        maps={actionMaps}
        loading={loading}
        onSelect={selectMap}
        onArchive={archiveMap}
        onCreate={handleCreateMap}
      />
    </div>
  );
}

export default function ActionMapsPage() {
  return (
    <ActionMapProvider>
      <ActionMapsPageContent />
    </ActionMapProvider>
  );
}
