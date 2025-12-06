/**
 * app/_components/okr/OKRTab.tsx
 *
 * Phase 12: OKR タブ（Action Map と同じ左右カラム形式）
 * - 左カラム: Objective 一覧
 * - 右カラム: 選択中 Objective の詳細 + Key Results
 */

'use client';

import { useOKRViewModel } from '@/lib/hooks/useOKRViewModel';
import type { KeyResultId } from '@/lib/types/okr';
import { ObjectiveList } from './ObjectiveList';
import { ObjectiveDetail } from './ObjectiveDetail';
import { ObjectiveForm } from './ObjectiveForm';
import { KeyResultForm } from './KeyResultForm';
import { ActionMapLinkModal } from './ActionMapLinkModal';
import styles from './OKRTab.module.css';
import {
  Target,
  Plus,
} from 'lucide-react';

export function OKRTab() {
  const vm = useOKRViewModel();

  if (vm.loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>読み込み中...</p>
      </div>
    );
  }

  // 選択中のObjective
  const selectedObjective = vm.filteredObjectives.find(
    obj => obj.id === vm.selectedObjectiveId
  );

  // 選択中ObjectiveのKeyResults
  const selectedKeyResults = selectedObjective
    ? vm.keyResults.filter(kr => kr.objectiveId === selectedObjective.id)
    : [];

  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.container}>
        {/* 左カラム: Objective 一覧 */}
        <aside className={styles.sidebar}>
          <ObjectiveList
            objectives={vm.filteredObjectives}
            selectedObjectiveId={vm.selectedObjectiveId}
            showArchived={vm.showArchived}
            canCreate={vm.canManageOKR}
            onSelect={vm.selectObjective}
            onCreate={vm.openCreateObjectiveForm}
            onToggleArchived={() => vm.setShowArchived(!vm.showArchived)}
          />
        </aside>

      {/* 右カラム: Objective 詳細 */}
      <main className={styles.main}>
        {selectedObjective ? (
          <ObjectiveDetail
            objective={selectedObjective}
            keyResults={selectedKeyResults}
            actionMaps={vm.actionMaps}
            canManage={vm.canManageOKR}
            canEdit={vm.canEditObjective(selectedObjective)}
            saving={vm.saving}
            onEditObjective={() => vm.openEditObjectiveForm(selectedObjective)}
            onArchiveObjective={() => vm.archiveObjective(selectedObjective.id)}
            onDeleteObjective={() => vm.removeObjective(selectedObjective.id)}
            onCreateKR={() => vm.openCreateKRForm()}
            onEditKR={vm.openEditKRForm}
            onDeleteKR={(krId) => vm.removeKR(krId as KeyResultId)}
            onToggleKRAchieved={vm.toggleKRAchieved}
            onOpenActionMapLink={vm.openActionMapLinkModal}
            getLinkedActionMaps={vm.getLinkedActionMaps}
            getActionItemsForMap={vm.getActionItemsForMap}
          />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <Target size={64} className={styles.placeholderIcon} />
              <h2>Objective を選択</h2>
              <p>左のリストから Objective を選択するか、新規作成してください。</p>
              {vm.canManageOKR && (
                <button
                  className={styles.createButton}
                  onClick={vm.openCreateObjectiveForm}
                >
                  <Plus size={18} />
                  新規 Objective 作成
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* モーダル: Objective 作成/編集 */}
      {vm.isObjectiveFormOpen && (
        <ObjectiveForm
          isOpen={vm.isObjectiveFormOpen}
          onClose={vm.closeObjectiveForm}
          formData={vm.objectiveFormData}
          updateFormData={vm.updateObjectiveFormData}
          onSave={vm.saveObjective}
          saving={vm.saving}
          isEditing={!!vm.editingObjective}
        />
      )}

      {/* モーダル: KeyResult 作成/編集 */}
      {vm.isKRFormOpen && (
        <KeyResultForm
          isOpen={vm.isKRFormOpen}
          onClose={vm.closeKRForm}
          formData={vm.keyResultFormData}
          updateFormData={vm.updateKRFormData}
          onSave={vm.saveKR}
          saving={vm.saving}
          isEditing={!!vm.editingKR}
        />
      )}

      {/* モーダル: ActionMap リンク */}
      {vm.isLinkActionMapOpen && vm.linkingKR && (
        <ActionMapLinkModal
          isOpen={vm.isLinkActionMapOpen}
          kr={vm.linkingKR}
          actionMaps={vm.actionMaps}
          linkedActionMapIds={vm.linkingKR.linkedActionMapIds || []}
          saving={vm.saving}
          onClose={vm.closeLinkActionMapModal}
          onLink={(actionMapId) => vm.linkActionMap(vm.linkingKR!.id, actionMapId)}
          onUnlink={(actionMapId) => vm.unlinkActionMap(vm.linkingKR!.id, actionMapId)}
        />
      )}

      {/* エラー表示 */}
      {vm.error && (
        <div className={styles.errorToast}>
          {vm.error}
        </div>
      )}
      </div>
    </div>
  );
}

export default OKRTab;
