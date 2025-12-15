/**
 * app/_components/super-admin/TenantList.tsx
 *
 * Phase 19: テナント一覧
 */

'use client';

import { useEffect } from 'react';
import { Building2, Users, Calendar } from 'lucide-react';
import { useSuperAdmin } from '@/lib/contexts/SuperAdminContext';

export function TenantList() {
  const { tenants, loading, fetchTenants } = useSuperAdmin();

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  if (loading && tenants.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'white' }}>
          テナント一覧
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          登録されているワークスペース（{tenants.length}件）
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                    {tenant.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    オーナー: {tenant.owner_name || tenant.owner_email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <Users size={14} />
                    <span style={{ fontSize: '12px' }}>メンバー</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                    {tenant.member_count}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <Calendar size={14} />
                    <span style={{ fontSize: '12px' }}>作成日</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'white' }}>
                    {new Date(tenant.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: tenant.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: tenant.is_active ? '#22c55e' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {tenant.is_active ? 'アクティブ' : '停止中'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {tenants.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            テナントがありません
          </div>
        )}
      </div>
    </div>
  );
}
