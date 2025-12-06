/**
 * app/_components/admin/sa-dashboard/EditTenantModal.tsx
 *
 * 【Phase 14.4】テナント編集モーダル（SA専用）
 * 【Phase 14.35-B】スタイル・ユーティリティを分離
 *
 * 【編集可能項目】
 * - テナント名
 * - プラン（standard / custom）
 * - 機能フラグ（enableOKR, enableEnergyLog, etc.）
 * - テーマ設定（primaryColor, accentColor）
 *
 * ※サブドメインは変更不可（URLが変わるため）
 */

'use client';

import { useState } from 'react';
import { X, Building2, Palette, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import type { Tenant } from './TenantManagementTable';
import { styles } from './EditTenantModal.styles';
import { calculateDarkPreview, calculateLightPreview } from '@/lib/utils/color';

// ========================================
// 型定義
// ========================================

interface EditTenantModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onSubmit: (data: TenantUpdateData) => Promise<void>;
  loading: boolean;
}

export interface TenantUpdateData {
  id: string;
  name?: string;
  plan?: 'standard' | 'custom';
  theme?: Record<string, unknown>;
  features?: Record<string, boolean>;
}

// ========================================
// 定数
// ========================================

const FEATURE_LABELS: Record<string, string> = {
  enableOKR: 'OKR機能',
  enableEnergyLog: 'エネルギーログ',
  enableOrgChart: '組織図',
  enableTodo: 'TODO機能',
  enableLeads: 'リード管理',
  enableAI: 'AI機能',
};

const DEFAULT_FEATURES = {
  enableOKR: true,
  enableEnergyLog: true,
  enableOrgChart: false,
  enableTodo: true,
  enableLeads: true,
  enableAI: false,
};

// ========================================
// コンポーネント
// ========================================

export function EditTenantModal({
  isOpen,
  tenant,
  onClose,
  onSubmit,
  loading,
}: EditTenantModalProps) {
  // tenantが変わるたびにフォームをリマウントして初期化
  if (!isOpen || !tenant) return null;

  return (
    <EditTenantForm
      key={tenant.id}
      tenant={tenant}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}

// 内部フォームコンポーネント（tenant.idをkeyにしてリマウント）
function EditTenantForm({
  tenant,
  onClose,
  onSubmit,
  loading,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSubmit: (data: TenantUpdateData) => Promise<void>;
  loading: boolean;
}) {
  // 初期値はtenantから直接設定（useEffectなし）
  const [name, setName] = useState(tenant.name);
  const [plan, setPlan] = useState<'standard' | 'custom'>(tenant.plan);
  const [features, setFeatures] = useState<Record<string, boolean>>({
    ...DEFAULT_FEATURES,
    ...(tenant.features as Record<string, boolean>),
  });
  const [theme, setTheme] = useState({
    primaryColor: (tenant.theme as Record<string, string>)?.primaryColor ?? '#00B8C4',
    primaryDark: (tenant.theme as Record<string, string>)?.primaryDark ?? '',
    primaryLight: (tenant.theme as Record<string, string>)?.primaryLight ?? '',
  });

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      id: tenant.id,
      name,
      plan,
      theme,
      features,
    });
  };

  const isDefaultTenant = tenant.subdomain === 'app';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <Building2 size={24} color="var(--primary)" />
            テナント編集
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {isDefaultTenant && (
              <div style={styles.warning}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  デフォルトテナント（app）は削除できません。設定の変更は可能です。
                </span>
              </div>
            )}

            {/* 基本情報 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <Building2 size={16} />
                基本情報
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>サブドメイン（変更不可）</label>
                <input
                  type="text"
                  value={`${tenant.subdomain}.foundersdirect.jp`}
                  disabled
                  style={{ ...styles.input, ...styles.inputDisabled }}
                />
                <p style={styles.hint}>サブドメインはURLに影響するため変更できません</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>テナント名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="株式会社サンプル"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>プラン</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as 'standard' | 'custom')}
                  style={styles.select}
                >
                  <option value="standard">スタンダード</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>
            </div>

            {/* 機能フラグ */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <ToggleLeft size={16} />
                有効な機能
              </div>
              <div style={styles.featureGrid}>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <div key={key} style={styles.featureItem}>
                    <span style={styles.featureLabel}>{label}</span>
                    <button
                      type="button"
                      style={styles.toggleBtn}
                      onClick={() => toggleFeature(key)}
                    >
                      {features[key] ? (
                        <ToggleRight size={24} color="var(--primary)" />
                      ) : (
                        <ToggleLeft size={24} color="#9ca3af" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* テーマ設定 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <Palette size={16} />
                テーマ設定
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>プライマリカラー（ベース色）</label>
                <div style={styles.colorInputGroup}>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    style={styles.colorInput}
                  />
                  <span style={styles.colorValue}>{theme.primaryColor}</span>
                </div>
                <p style={styles.hint}>ダーク・ライトバリエーションは自動計算されます</p>
              </div>

              {/* カラープレビュー */}
              <div style={styles.colorPreviewContainer}>
                <div style={styles.colorPreviewItem}>
                  <div style={{
                    ...styles.colorPreviewBox,
                    backgroundColor: theme.primaryColor,
                  }} />
                  <span style={styles.colorPreviewLabel}>Primary</span>
                </div>
                <div style={styles.colorPreviewItem}>
                  <div style={{
                    ...styles.colorPreviewBox,
                    backgroundColor: calculateDarkPreview(theme.primaryColor),
                  }} />
                  <span style={styles.colorPreviewLabel}>Dark</span>
                </div>
                <div style={styles.colorPreviewItem}>
                  <div style={{
                    ...styles.colorPreviewBox,
                    backgroundColor: calculateLightPreview(theme.primaryColor),
                  }} />
                  <span style={styles.colorPreviewLabel}>Light</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
