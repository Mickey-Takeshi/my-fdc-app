/**
 * app/_components/super-admin/SADashboard.tsx
 *
 * Phase 19: SA ダッシュボード
 */

'use client';

import { useEffect } from 'react';
import { Users, Building2, AlertTriangle, TrendingUp, HardDrive, UserPlus } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';

export function SADashboard() {
  const { stats, loading, fetchMetrics } = useSuperAdmin();

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading && !stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: '総ユーザー数',
      value: stats?.total_users || 0,
      color: '#3b82f6',
    },
    {
      icon: Building2,
      label: '総ワークスペース',
      value: stats?.total_workspaces || 0,
      color: '#8b5cf6',
    },
    {
      icon: UserPlus,
      label: '今週の新規登録',
      value: stats?.new_signups_week || 0,
      color: '#22c55e',
    },
    {
      icon: TrendingUp,
      label: '本日のアクティブ',
      value: stats?.active_users_today || 0,
      color: '#06b6d4',
    },
    {
      icon: AlertTriangle,
      label: 'セキュリティアラート',
      value: stats?.security_alerts || 0,
      color: stats?.security_alerts ? '#ef4444' : '#6b7280',
    },
    {
      icon: HardDrive,
      label: 'ストレージ使用量',
      value: `${(stats?.storage_used_gb || 0).toFixed(2)} GB`,
      color: '#f59e0b',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'white' }}>
          システム概要
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          システム全体の統計情報
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${card.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {card.label}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
