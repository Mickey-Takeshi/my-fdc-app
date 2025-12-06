/**
 * app/_components/admin/org-management/types.ts
 *
 * Phase 14.35: 組織管理コンポーネント型定義
 */

export interface Department {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
}

export interface ReportLine {
  id: string;
  workspaceId: string;
  subordinateId: string;
  supervisorId: string;
  isPrimary: boolean;
  subordinate?: { id: string; name: string; email: string; picture: string | null };
  supervisor?: { id: string; name: string; email: string; picture: string | null };
}

export interface MemberAssignment {
  userId: string;
  departmentId: string | null;
  role: string | null;
  name: string;
  email: string;
  picture: string | null;
}

export interface VisibilityPolicy {
  id: string | null;
  workspaceId: string;
  upwardVisibilityLevel: number;
  peerVisibility: 'none' | 'same_dept' | 'all';
  unassignedVisibility: 'admins_only' | 'visible_to_all';
}

export type SubTab = 'departments' | 'members' | 'visibility';
