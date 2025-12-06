/**
 * app/_components/admin/sa-dashboard/tenant-detail/TabConfigSection.tsx
 *
 * Phase 15.2: テナント別タブ設定一覧
 *
 * 【機能】
 * - 各タブの表示/非表示状態を一覧
 * - カスタムタブ差し替えの有無を表示
 * - フィーチャーフラグの編集
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { LayoutGrid, Eye, EyeOff, Puzzle, Check, X, Loader2 } from 'lucide-react';
import type { Tenant } from '../TenantManagementTable';

// タブ定義（tabConfig.ts から抽出）
const TAB_DEFINITIONS = [
  { id: 'dashboard', label: 'ダッシュボード', featureKey: null, alwaysVisible: true },
  { id: 'org-chart', label: 'レポートライン', featureKey: 'enableOrgChart', alwaysVisible: false },
  { id: 'mvv', label: 'MVV', featureKey: 'enableMVV', alwaysVisible: false },
  { id: 'okr', label: 'OKR', featureKey: 'enableOKR', alwaysVisible: false },
  { id: 'action-map', label: 'Action Map', featureKey: 'enableActionMap', alwaysVisible: false },
  { id: 'todo', label: 'TODO管理', featureKey: 'enableTodo', alwaysVisible: false },
  { id: 'prospects', label: '見込み客管理', featureKey: 'enableLeads', alwaysVisible: false },
  { id: 'customers', label: '顧客管理', featureKey: 'enableLeads', alwaysVisible: false },
  { id: 'scripts', label: 'スクリプト', featureKey: 'enableScripts', alwaysVisible: false },
  { id: 'reports', label: 'レポート', featureKey: 'enableReports', alwaysVisible: false },
  { id: 'settings', label: '設定', featureKey: null, alwaysVisible: true },
];

// カスタムタブレジストリの情報（静的に定義）
// 実際のCUSTOM_TAB_REGISTRYはクライアント専用のためサーバーでは参照できない
const KNOWN_CUSTOM_TABS: Record<string, string[]> = {
  // 例: 'tom': ['dashboard'],
};

interface TabConfigSectionProps {
  tenant: Tenant;
  onUpdateFeatures?: (features: Record<string, boolean>) => Promise<void>;
}

const styles = {
  section: {
    marginTop: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-dark)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    borderBottom: '2px solid var(--border-color)',
    fontWeight: 600,
    color: 'var(--text-dark)',
    backgroundColor: 'var(--bg-gray)',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
  },
  statusBadge: (enabled: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: enabled ? '#22c55e' : '#ef4444',
  }),
  customBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#8B5CF6',
  },
  toggleBtn: (enabled: boolean) => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: enabled ? '#22c55e' : '#ef4444',
    color: 'white',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'opacity 0.2s',
  }),
  legend: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-gray)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--text-light)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
};

export function TabConfigSection({ tenant, onUpdateFeatures }: TabConfigSectionProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const features = useMemo(() => tenant.features || {}, [tenant.features]);
  const customTabs = KNOWN_CUSTOM_TABS[tenant.subdomain] || [];

  // フィーチャーフラグの切り替え
  const handleToggleFeature = useCallback(async (featureKey: string, currentValue: boolean) => {
    if (!onUpdateFeatures) return;

    setUpdating(featureKey);
    try {
      await onUpdateFeatures({
        ...features,
        [featureKey]: !currentValue,
      });
    } finally {
      setUpdating(null);
    }
  }, [features, onUpdateFeatures]);

  // タブの有効/無効を判定
  const isTabEnabled = (featureKey: string | null): boolean => {
    if (featureKey === null) return true; // 常に表示
    if (features[featureKey] === undefined) return true; // 未設定はデフォルト有効
    return features[featureKey];
  };

  // カスタムタブかどうか
  const isCustomTab = (tabId: string): boolean => {
    return customTabs.includes(tabId);
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.header}>
        <LayoutGrid size={20} color="var(--primary)" />
        タブ設定
      </h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>タブ名</th>
            <th style={styles.th}>表示状態</th>
            <th style={styles.th}>カスタム実装</th>
            <th style={{ ...styles.th, width: '120px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {TAB_DEFINITIONS.map((tab) => {
            const enabled = isTabEnabled(tab.featureKey);
            const custom = isCustomTab(tab.id);
            const isUpdating = updating === tab.featureKey;

            return (
              <tr key={tab.id}>
                <td style={styles.td}>
                  <strong>{tab.label}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                    ID: {tab.id}
                  </div>
                </td>
                <td style={styles.td}>
                  {tab.alwaysVisible ? (
                    <span style={{ ...styles.statusBadge(true), backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>
                      常に表示
                    </span>
                  ) : (
                    <span style={styles.statusBadge(enabled)}>
                      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      {enabled ? '表示' : '非表示'}
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  {custom ? (
                    <span style={styles.customBadge}>
                      <Puzzle size={14} />
                      カスタム
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                      APP共通
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  {tab.featureKey && onUpdateFeatures ? (
                    <button
                      style={{
                        ...styles.toggleBtn(enabled),
                        opacity: isUpdating ? 0.7 : 1,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => handleToggleFeature(tab.featureKey!, enabled)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : enabled ? (
                        <X size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                      {enabled ? '無効化' : '有効化'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={styles.legend}>
        <strong>凡例:</strong>
        <div style={styles.legendItem}>
          <span style={styles.statusBadge(true)}>
            <Eye size={12} />表示
          </span>
          タブがメニューに表示されます
        </div>
        <div style={styles.legendItem}>
          <span style={styles.statusBadge(false)}>
            <EyeOff size={12} />非表示
          </span>
          タブがメニューから隠れます
        </div>
        <div style={styles.legendItem}>
          <span style={styles.customBadge}>
            <Puzzle size={12} />カスタム
          </span>
          このテナント専用の実装に差し替え済み
        </div>
      </div>
    </div>
  );
}
