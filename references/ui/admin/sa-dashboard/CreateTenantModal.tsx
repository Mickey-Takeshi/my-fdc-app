/**
 * app/_components/admin/sa-dashboard/CreateTenantModal.tsx
 *
 * 【Phase 14.4】テナント作成モーダル（SA専用）
 *
 * 【設定可能項目】
 * - サブドメイン（例: tom → tom.foundersdirect.jp）
 * - テナント名
 * - プラン（standard / custom）
 * - 機能フラグ（enableOKR, enableEnergyLog, enableOrgChart, etc.）
 * - テーマ設定（primaryColor, accentColor）
 */

'use client';

import { useState } from 'react';
import { X, Building2, Palette, ToggleLeft, ToggleRight } from 'lucide-react';

// ========================================
// 型定義
// ========================================

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TenantCreateData) => Promise<void>;
  loading: boolean;
}

export interface TenantCreateData {
  subdomain: string;
  name: string;
  plan: 'standard' | 'custom';
  theme: {
    primaryColor?: string;
    accentColor?: string;
  };
  features: {
    enableOKR?: boolean;
    enableEnergyLog?: boolean;
    enableOrgChart?: boolean;
    enableTodo?: boolean;
    enableLeads?: boolean;
    enableAI?: boolean;
  };
}

// ========================================
// デフォルト値
// ========================================

const DEFAULT_FEATURES = {
  enableOKR: true,
  enableEnergyLog: true,
  enableOrgChart: false,
  enableTodo: true,
  enableLeads: true,
  enableAI: false,
};

const DEFAULT_THEME = {
  primaryColor: '#111827',
  accentColor: '#6366F1',
};

const FEATURE_LABELS: Record<string, string> = {
  enableOKR: 'OKR機能',
  enableEnergyLog: 'エネルギーログ',
  enableOrgChart: '組織図',
  enableTodo: 'TODO機能',
  enableLeads: 'リード管理',
  enableAI: 'AI機能',
};

// ========================================
// スタイル
// ========================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  closeBtn: {
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
  },
  body: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: '12px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-dark)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  inputWithSuffix: {
    display: 'flex',
    alignItems: 'center',
  },
  suffix: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-gray)',
    border: '1px solid var(--border-color)',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  inputPrefix: {
    borderRadius: '8px 0 0 8px',
    borderRight: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'var(--bg-gray)',
    borderRadius: '8px',
  },
  featureLabel: {
    fontSize: '14px',
    color: 'var(--text-dark)',
  },
  toggleBtn: {
    padding: '4px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  colorInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorInput: {
    width: '50px',
    height: '40px',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
  },
  colorValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid var(--border-color)',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  error: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
  },
};

// ========================================
// コンポーネント
// ========================================

export function CreateTenantModal({ isOpen, onClose, onSubmit, loading }: CreateTenantModalProps) {
  const [subdomain, setSubdomain] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<'standard' | 'custom'>('standard');
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subdomain) {
      newErrors.subdomain = 'サブドメインは必須です';
    } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      newErrors.subdomain = '小文字英数字とハイフンのみ使用可能です';
    } else if (subdomain.length < 2) {
      newErrors.subdomain = '2文字以上で入力してください';
    }

    if (!name) {
      newErrors.name = 'テナント名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      subdomain,
      name,
      plan,
      theme,
      features,
    });
  };

  const handleClose = () => {
    setSubdomain('');
    setName('');
    setPlan('standard');
    setFeatures(DEFAULT_FEATURES);
    setTheme(DEFAULT_THEME);
    setErrors({});
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <Building2 size={24} color="var(--primary)" />
            新規テナント作成
          </h2>
          <button style={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {/* 基本情報 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <Building2 size={16} />
                基本情報
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>サブドメイン *</label>
                <div style={styles.inputWithSuffix}>
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    placeholder="example"
                    style={{ ...styles.input, ...styles.inputPrefix }}
                  />
                  <span style={styles.suffix}>.foundersdirect.jp</span>
                </div>
                <p style={styles.hint}>小文字英数字とハイフンのみ使用可能</p>
                {errors.subdomain && <p style={styles.error}>{errors.subdomain}</p>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>テナント名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="株式会社サンプル"
                  style={styles.input}
                />
                {errors.name && <p style={styles.error}>{errors.name}</p>}
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
                      {features[key as keyof typeof features] ? (
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
                <label style={styles.label}>プライマリカラー</label>
                <div style={styles.colorInputGroup}>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    style={styles.colorInput}
                  />
                  <span style={styles.colorValue}>{theme.primaryColor}</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>アクセントカラー</label>
                <div style={styles.colorInputGroup}>
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                    style={styles.colorInput}
                  />
                  <span style={styles.colorValue}>{theme.accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={handleClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? '作成中...' : 'テナントを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
