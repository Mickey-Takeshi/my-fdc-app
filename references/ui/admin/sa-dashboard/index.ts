/**
 * app/_components/admin/sa-dashboard/index.ts
 *
 * Phase 13 WS-E: SADashboard分割コンポーネントの再エクスポート
 * Phase 14.3-B: SystemMetrics追加
 * Phase 14.4: テナント管理コンポーネント追加
 * Phase 14.9: セキュリティ監視コンポーネント追加
 */

export { LoadingSpinner } from './LoadingSpinner';
export { AccessDenied } from './AccessDenied';
export { StatCard } from './StatCard';
export { CreateWorkspaceModal } from './CreateWorkspaceModal';
export { WorkspaceMembersModal } from './WorkspaceMembersModal';
export { WorkspacesTable } from './WorkspacesTable';
export { UsersManagementTable } from './UsersManagementTable';
export { SystemMetrics } from './SystemMetrics';

// Phase 14.4: テナント管理
export { TenantManagementTable, type Tenant } from './TenantManagementTable';
export { CreateTenantModal, type TenantCreateData } from './CreateTenantModal';
export { EditTenantModal, type TenantUpdateData } from './EditTenantModal';
export { TenantDetailModal } from './TenantDetailModal';

// Phase 14.9: セキュリティ監視
export { SecurityMonitor } from './SecurityMonitor';
