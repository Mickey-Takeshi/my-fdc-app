/**
 * app/_components/action-map/ActionMapTab.tsx
 *
 * Phase 11: Action Map タブ本体
 * 左カラム: Map 一覧
 * 右カラム: 選択中 Map の詳細 + Action Items
 */

'use client';

import { Map } from 'lucide-react';
import { useActionMapViewModel } from '@/lib/hooks/useActionMapViewModel';
import { ActionMapList } from './ActionMapList';
import { ActionMapDetail } from './ActionMapDetail';
import { ActionMapFormModal } from './ActionMapFormModal';
import { ActionItemFormModal } from './ActionItemFormModal';
import { FocusMode } from './FocusMode';
import styles from './ActionMapTab.module.css';

export function ActionMapTab() {
  const vm = useActionMapViewModel();

  if (vm.loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (vm.error) {
    return (
      <div className={styles.error}>
        <p>エラー: {vm.error}</p>
      </div>
    );
  }

  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.container}>
        {/* 左カラム: Map 一覧 */}
        <aside className={styles.sidebar}>
        <ActionMapList
          maps={vm.visibleMaps}
          selectedMapId={vm.selectedMapId}
          showArchived={vm.showArchived}
          canCreate={vm.canManageActionMap()}
          onSelect={vm.selectMap}
          onCreate={vm.openCreateMapForm}
          onToggleArchived={() => vm.setShowArchived(!vm.showArchived)}
        />
      </aside>

      {/* 右カラム: Map 詳細 */}
      <main className={styles.main}>
        {vm.selectedMap ? (
          <ActionMapDetail
            map={vm.selectedMap}
            itemTree={vm.itemTree}
            itemsByStatus={vm.itemsByStatus}
            viewMode={vm.viewMode}
            selectedItemId={vm.selectedItemId}
            canManage={vm.canManageActionMap()}
            saving={vm.saving}
            onViewModeChange={vm.setViewMode}
            onEditMap={() => vm.openEditMapForm(vm.selectedMap!)}
            onArchiveMap={() => vm.archiveMap(vm.selectedMap!.id)}
            onUnarchiveMap={() => vm.unarchiveMap(vm.selectedMap!.id)}
            onDeleteMap={() => vm.deleteMap(vm.selectedMap!.id)}
            onSelectItem={vm.selectItem}
            onCreateItem={vm.openCreateItemForm}
            onEditItem={vm.openEditItemForm}
            onDeleteItem={vm.deleteItem}
            onUpdateItemStatus={vm.updateItemStatus}
            onOpenFocusMode={vm.openFocusMode}
            getRemainingDays={vm.getRemainingDays}
            getWarningLevel={vm.getWarningLevel}
            getLinkedTasks={vm.getLinkedTasks}
          />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <Map size={64} className={styles.placeholderIcon} />
              <h2>Action Map を選択</h2>
              <p>左のリストから Action Map を選択するか、新規作成してください。</p>
              {vm.canManageActionMap() && (
                <button
                  className={styles.createButton}
                  onClick={vm.openCreateMapForm}
                >
                  + 新規 Action Map 作成
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* モーダル: Map 作成/編集 */}
      {vm.isMapFormOpen && (
        <ActionMapFormModal
          isOpen={vm.isMapFormOpen}
          isEditing={!!vm.editingMap}
          formData={vm.mapFormData}
          saving={vm.saving}
          onClose={vm.closeMapForm}
          onChange={vm.updateMapFormData}
          onSave={vm.saveMap}
        />
      )}

      {/* モーダル: Item 作成/編集 */}
      {vm.isItemFormOpen && (
        <ActionItemFormModal
          isOpen={vm.isItemFormOpen}
          isEditing={!!vm.editingItem}
          formData={vm.itemFormData}
          saving={vm.saving}
          onClose={vm.closeItemForm}
          onChange={vm.updateItemFormData}
          onSave={vm.saveItem}
        />
      )}

      {/* フォーカスモード */}
      {vm.isFocusModeOpen && vm.selectedItem && (
        <FocusMode
          item={vm.selectedItem}
          linkedTasks={vm.getLinkedTasks(vm.selectedItem.id)}
          onClose={vm.closeFocusMode}
          getRemainingDays={vm.getRemainingDays}
          getWarningLevel={vm.getWarningLevel}
        />
      )}
      </div>
    </div>
  );
}
