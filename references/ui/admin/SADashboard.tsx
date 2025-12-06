/**
 * app/_components/admin/SADashboard.tsx
 *
 * Phase 9.97: スーパーアドミンダッシュボード UI コンポーネント
 * Phase 13 WS-E: サブコンポーネントを分割
 * Phase 14.4: テナント管理機能追加
 * Phase 14.35-B: テナント管理ロジックを useTenantManagement に分離
 *
 * 【機能】
 * - 全ワークスペース統計表示（ワークスペース数、ユーザー数、メンバーシップ数）
 * - ワークスペース一覧テーブル（名前、オーナー、メンバー数、作成日）
 * - ユーザー管理（権限変更機能）
 * - テナント管理（作成、編集、削除）- Phase 14.4
 * - SA (システム管理者) のみアクセス可能なアクセス制御
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Building2, Users, Link, RefreshCw, UserX, Plus, Bell } from 'lucide-react';
import {
  useSADashboardViewModel,
  type SAWorkspace,
} from '@/lib/hooks/useSADashboardViewModel';
import { useTenantManagement } from '@/lib/hooks/useTenantManagement';

// 分割したサブコンポーネントをインポート
import {
  LoadingSpinner,
  AccessDenied,
  StatCard,
  WorkspaceMembersModal,
  WorkspacesTable,
  UsersManagementTable,
  SystemMetrics,
  TenantManagementTable,
  CreateTenantModal,
  EditTenantModal,
  TenantDetailModal,
  SecurityMonitor,
} from './sa-dashboard';

// ========================================
// テストアラート Hook
// ========================================

function useTestAlert() {
  const [alertSending, setAlertSending] = useState(false);
  const [alertResult, setAlertResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestAlert = async () => {
    setAlertSending(true);
    setAlertResult(null);
    try {
      const res = await fetch('/api/admin/test-alert', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setAlertResult({ success: true, message: 'メール通知を送信しました' });
      } else {
        setAlertResult({ success: false, message: data.error || '送信に失敗しました' });
      }
    } catch (_err) {
      setAlertResult({ success: false, message: 'ネットワークエラー' });
    } finally {
      setAlertSending(false);
      // 3秒後に結果をクリア
      setTimeout(() => setAlertResult(null), 3000);
    }
  };

  return { alertSending, alertResult, handleSendTestAlert };
}

// ========================================
// メインコンポーネント
// ========================================

export function SADashboard() {
  const router = useRouter();
  const vm = useSADashboardViewModel();

  // メンバー管理モーダル用のステート
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<SAWorkspace | null>(null);

  // テナント管理 Hook（Phase 14.35-B で分離）
  const tenantMgmt = useTenantManagement(vm.isSAUser, vm.loading);

  // テストアラート Hook
  const { alertSending, alertResult, handleSendTestAlert } = useTestAlert();

  // メンバー管理モーダルを開く
  const handleManageMembers = (workspace: SAWorkspace) => {
    setSelectedWorkspace(workspace);
    setMembersModalOpen(true);
    vm.fetchWorkspaceMembers(workspace.id);
  };

  // メンバー管理モーダルを閉じる
  const handleCloseMembersModal = () => {
    setMembersModalOpen(false);
    setSelectedWorkspace(null);
  };

  // 未配置ユーザー数を計算
  const unassignedUserCount = useMemo(() => {
    return vm.allUsers.filter(u => u.workspaceCount === 0).length;
  }, [vm.allUsers]);

  // ローディング中
  if (vm.loading) {
    return <LoadingSpinner />;
  }

  // 認証エラー
  if (vm.error) {
    return (
      <AccessDenied
        message={vm.error}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  // SA 権限がない場合
  if (!vm.isSAUser) {
    return (
      <AccessDenied
        message="このページは SA 権限を持つユーザーのみアクセスできます。"
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ページヘッダー */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              margin: 0,
            }}
          >
            スーパーアドミン
          </h2>
          <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
            FDC 全体の管理機能
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* テストアラートボタン */}
          <button
            onClick={handleSendTestAlert}
            disabled={alertSending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: alertResult
                ? alertResult.success
                  ? 'var(--primary-dark)'
                  : '#ef4444'
                : 'var(--primary)',
              border: 'none',
              borderRadius: '6px',
              cursor: alertSending ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'white',
              transition: 'background 0.2s',
            }}
          >
            <Bell size={16} />
            {alertSending ? '送信中...' : alertResult ? alertResult.message : 'メール通知テスト'}
          </button>

          {/* 更新ボタン */}
          <button
            onClick={() => vm.refreshAll()}
            disabled={vm.statsLoading || vm.workspacesLoading || vm.allUsersLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--bg-gray)',
              border: 'none',
              borderRadius: '6px',
              cursor: vm.statsLoading || vm.workspacesLoading || vm.allUsersLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'var(--text-dark)',
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: vm.statsLoading || vm.workspacesLoading || vm.allUsersLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            更新
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <StatCard
          icon={<Building2 size={20} />}
          label="ワークスペース数"
          value={vm.stats?.totalWorkspaces || 0}
        />
        <StatCard
          icon={<Users size={20} />}
          label="ユーザー数"
          value={vm.stats?.totalUsers || 0}
        />
        <StatCard
          icon={<Link size={20} />}
          label="メンバーシップ数"
          value={vm.stats?.totalMembers || 0}
        />
        <StatCard
          icon={<UserX size={20} />}
          label="未配置ユーザー"
          value={unassignedUserCount}
        />
      </div>

      {/* ユーザー管理 */}
      <UsersManagementTable
        users={vm.allUsers}
        loading={vm.allUsersLoading}
        error={vm.allUsersError}
        currentUserId={vm.user?.id}
        onUpdateAccountType={vm.updateUserAccountType}
        updateLoading={vm.updateUserAccountTypeLoading}
      />
      {vm.updateUserAccountTypeError && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24',
            fontSize: '14px',
          }}
        >
          {vm.updateUserAccountTypeError}
        </div>
      )}

      {/* ワークスペース一覧 */}
      <WorkspacesTable
        workspaces={vm.workspaces}
        loading={vm.workspacesLoading}
        error={vm.workspacesError}
        allUsers={vm.allUsers}
        onCreateWorkspace={vm.createWorkspace}
        createLoading={vm.createWorkspaceLoading}
        onDeleteWorkspace={vm.deleteWorkspace}
        deleteLoading={vm.deleteWorkspaceLoading}
        onManageMembers={handleManageMembers}
      />
      {vm.createWorkspaceError && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24',
            fontSize: '14px',
          }}
        >
          {vm.createWorkspaceError}
        </div>
      )}
      {vm.deleteWorkspaceError && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24',
            fontSize: '14px',
          }}
        >
          {vm.deleteWorkspaceError}
        </div>
      )}

      {/* システムメトリクス（Phase 14.3-B） */}
      <SystemMetrics />

      {/* セキュリティ監視（Phase 14.9） */}
      <SecurityMonitor />

      {/* テナント管理（Phase 14.4） */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={tenantMgmt.openCreateTenantModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            新規テナント作成
          </button>
        </div>
        <TenantManagementTable
          tenants={tenantMgmt.tenants}
          loading={tenantMgmt.tenantsLoading}
          error={tenantMgmt.tenantsError}
          onEdit={tenantMgmt.openEditTenantModal}
          onDelete={tenantMgmt.handleDeleteTenant}
          onDetail={tenantMgmt.openDetailTenantModal}
          deleteLoading={tenantMgmt.tenantActionLoading}
        />
      </div>

      {/* メンバー管理モーダル */}
      <WorkspaceMembersModal
        isOpen={membersModalOpen}
        onClose={handleCloseMembersModal}
        workspace={selectedWorkspace}
        members={vm.workspaceMembers}
        membersLoading={vm.workspaceMembersLoading}
        membersError={vm.workspaceMembersError}
        allUsers={vm.allUsers}
        onAddMember={vm.addMemberToWorkspace}
        onUpdateRole={vm.updateMemberRole}
        onRemoveMember={vm.removeMemberFromWorkspace}
        addLoading={vm.addMemberLoading}
        updateRoleLoading={vm.updateMemberRoleLoading}
        removeLoading={vm.removeMemberLoading}
      />

      {/* テナント作成モーダル（Phase 14.4） */}
      <CreateTenantModal
        isOpen={tenantMgmt.createTenantModalOpen}
        onClose={tenantMgmt.closeCreateTenantModal}
        onSubmit={tenantMgmt.handleCreateTenant}
        loading={tenantMgmt.tenantActionLoading}
      />

      {/* テナント編集モーダル（Phase 14.4） */}
      <EditTenantModal
        isOpen={tenantMgmt.editTenantModalOpen}
        tenant={tenantMgmt.selectedTenant}
        onClose={tenantMgmt.closeEditTenantModal}
        onSubmit={tenantMgmt.handleEditTenant}
        loading={tenantMgmt.tenantActionLoading}
      />

      {/* テナント詳細モーダル（Phase 14.4） */}
      <TenantDetailModal
        isOpen={tenantMgmt.detailTenantModalOpen}
        tenant={tenantMgmt.selectedTenant}
        onClose={tenantMgmt.closeDetailTenantModal}
      />
    </div>
  );
}

export default SADashboard;
