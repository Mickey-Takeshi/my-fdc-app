/**
 * TenantDetailModal の型定義
 */

import type { Tenant } from '../TenantManagementTable';

export interface TenantDetailModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

export interface TenantWorkspace {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
}

export interface TenantUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  global_role: string;
  created_at: string;
  workspace_count: number;
}

export interface TenantInfoCardProps {
  tenant: Tenant;
  workspacesCount: number;
  usersCount: number;
}

export interface WorkspaceListProps {
  workspaces: TenantWorkspace[];
  loading: boolean;
}

export interface UserListProps {
  users: TenantUser[];
  loading: boolean;
}
