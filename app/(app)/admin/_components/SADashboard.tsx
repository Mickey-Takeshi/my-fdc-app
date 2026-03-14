'use client';

/**
 * app/(app)/admin/_components/SADashboard.tsx
 *
 * Super Admin ダッシュボード（Phase 19）
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CheckSquare,
  Sparkles,
  Loader,
  AlertCircle,
} from 'lucide-react';
import type { TenantSummary } from '@/lib/types/admin';

interface SAMetrics {
  totalUsers: number;
  totalWorkspaces: number;
  totalTasks: number;
  totalBrands: number;
}

export default function SADashboard() {
  const [metrics, setMetrics] = useState<SAMetrics | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, tenantsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/admin/tenants', { headers: { 'Content-Type': 'application/json' } }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      } else if (metricsRes.status === 403) {
        setError('Super Admin 権限がありません');
        return;
      }

      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data.tenants ?? []);
      }
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* メトリクス */}
      {metrics && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-value">{metrics.totalUsers}</div>
            <div className="stat-label">
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ユーザー
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.totalWorkspaces}</div>
            <div className="stat-label">
              <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ワークスペース
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.totalTasks}</div>
            <div className="stat-label">
              <CheckSquare size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              タスク
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics.totalBrands}</div>
            <div className="stat-label">
              <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              ブランド
            </div>
          </div>
        </div>
      )}

      {/* テナント一覧 */}
      <div className="admin-section">
        <h3 className="admin-section-title">
          <Building2 size={16} /> テナント一覧 ({tenants.length})
        </h3>
        {tenants.length === 0 ? (
          <p className="admin-empty">テナントはありません</p>
        ) : (
          <div className="admin-tenants-list">
            {tenants.map((tenant) => (
              <div key={tenant.workspaceId} className="admin-tenant-row">
                <div className="admin-tenant-info">
                  <span className="admin-tenant-name">{tenant.workspaceName}</span>
                  <span className="admin-tenant-owner">{tenant.ownerEmail}</span>
                </div>
                <div className="admin-tenant-stats">
                  <span className="admin-tenant-members">
                    <Users size={12} /> {tenant.memberCount}
                  </span>
                  <span className="admin-tenant-date">
                    {new Date(tenant.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
