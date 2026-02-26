/**
 * app/(app)/admin/page.tsx
 *
 * Phase 18+19: ワークスペース管理者ページ + Super Admin
 */

'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AdminProvider } from '@/lib/contexts/AdminContext';
import { SuperAdminProvider } from '@/lib/contexts/SuperAdminContext';
import {
  MembersSection,
  InvitationsSection,
  AuditLogsSection,
} from '@/app/_components/admin';
import {
  SADashboard,
  TenantList,
  UserManagement,
  SecurityMonitor,
} from '@/app/_components/super-admin';
import { AlertTriangle, Building2, Shield, Users, Activity } from 'lucide-react';

type SATab = 'dashboard' | 'tenants' | 'users' | 'security';

function AdminPageContent() {
  const { workspace, role, loading } = useWorkspace();
  const { user } = useAuth();
  const [isSA, setIsSA] = useState(false);
  const [saTab, setSATab] = useState<SATab>('dashboard');

  // SA 権限チェック
  useEffect(() => {
    if (user?.accountType === 'SA') {
      setIsSA(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  // SA ユーザーの場合は SA パネルを表示
  if (isSA) {
    const saTabs = [
      { id: 'dashboard' as SATab, label: 'ダッシュボード', icon: Activity },
      { id: 'tenants' as SATab, label: 'テナント', icon: Building2 },
      { id: 'users' as SATab, label: 'ユーザー', icon: Users },
      { id: 'security' as SATab, label: 'セキュリティ', icon: Shield },
    ];

    return (
      <SuperAdminProvider>
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '24px',
            margin: '-24px',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* ヘッダー */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={24} color="white" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>
                    Super Admin
                  </h1>
                  <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    システム全体の管理
                  </p>
                </div>
              </div>
            </div>

            {/* タブ */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {saTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSATab(tab.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: saTab === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: saTab === tab.id
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* コンテンツ */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {saTab === 'dashboard' && <SADashboard />}
              {saTab === 'tenants' && <TenantList />}
              {saTab === 'users' && <UserManagement />}
              {saTab === 'security' && <SecurityMonitor />}
            </div>
          </div>
        </div>
      </SuperAdminProvider>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        ワークスペースを選択してください
      </div>
    );
  }

  // 権限チェック（クライアント側）
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={48} color="var(--warning)" />
        <h2 style={{ margin: '16px 0 8px' }}>アクセス権限がありません</h2>
        <p style={{ color: 'var(--text-light)' }}>
          このページはワークスペースのオーナーまたは管理者のみアクセスできます
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>ワークスペース管理</h1>
        <p style={{ color: 'var(--text-light)', margin: '8px 0 0' }}>
          {workspace.name} のメンバーと設定を管理します
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <InvitationsSection />
        <MembersSection />
        <AuditLogsSection />
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminPageContent />
    </AdminProvider>
  );
}
