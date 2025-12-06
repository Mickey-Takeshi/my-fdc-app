/**
 * app/_components/okr/ActionMapLinkModal.tsx
 *
 * Phase 12: KR ↔ Action Map リンクモーダル
 * - KR に紐づける Action Map を選択・解除
 * - 現在のリンク済み Action Map を表示
 */

'use client';

import type { KeyResult } from '@/lib/types/okr';
import type { ActionMap } from '@/lib/types/action-map';
import { Link, Unlink, Map, CheckCircle2, Lightbulb } from 'lucide-react';
import styles from './ActionMapLinkModal.module.css';

interface ActionMapLinkModalProps {
  isOpen: boolean;
  kr: KeyResult | null;
  actionMaps: ActionMap[];
  linkedActionMapIds: string[];
  saving: boolean;
  onClose: () => void;
  onLink: (actionMapId: string) => void;
  onUnlink: (actionMapId: string) => void;
}

export function ActionMapLinkModal({
  isOpen,
  kr,
  actionMaps,
  linkedActionMapIds,
  saving,
  onClose,
  onLink,
  onUnlink,
}: ActionMapLinkModalProps) {
  if (!isOpen || !kr) return null;

  const getProgressColor = (rate?: number) => {
    if (rate === undefined || rate === 0) return 'var(--text-secondary)';
    if (rate >= 80) return 'var(--primary)';
    if (rate >= 50) return 'var(--primary-light)';
    return 'var(--text-secondary)';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Link size={20} />
            Action Map をリンク
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.krInfo}>
            <span className={styles.krLabel}>Key Result:</span>
            <span className={styles.krTitle}>{kr.title}</span>
          </div>

          <div className={styles.sectionLabel}>
            <Map size={16} />
            Action Map 一覧
          </div>

          {actionMaps.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Action Map がありません</p>
              <span className={styles.emptyHint}>
                Action Map タブで作成してください
              </span>
            </div>
          ) : (
            <ul className={styles.actionMapList}>
              {actionMaps.map((am) => {
                const isLinked = linkedActionMapIds.includes(am.id);
                return (
                  <li key={am.id} className={styles.actionMapItem}>
                    <div className={styles.actionMapInfo}>
                      {isLinked && (
                        <CheckCircle2
                          size={16}
                          className={styles.linkedIcon}
                        />
                      )}
                      <span className={styles.actionMapTitle}>{am.title}</span>
                      <span
                        className={styles.actionMapProgress}
                        style={{ color: getProgressColor(am.progressRate) }}
                      >
                        {am.progressRate ?? 0}%
                      </span>
                    </div>
                    <button
                      className={`${styles.linkButton} ${isLinked ? styles.unlinkButton : ''}`}
                      onClick={() =>
                        isLinked ? onUnlink(am.id) : onLink(am.id)
                      }
                      disabled={saving}
                    >
                      {isLinked ? (
                        <>
                          <Unlink size={14} />
                          解除
                        </>
                      ) : (
                        <>
                          <Link size={14} />
                          リンク
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={styles.infoBox}>
            <strong><Lightbulb size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />ヒント:</strong> KR の計算方法が「AM連動」の場合、リンクした
            Action Map の進捗率平均が KR の進捗率に反映されます。
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeButtonFooter}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
