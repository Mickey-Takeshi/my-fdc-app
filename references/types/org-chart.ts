/**
 * lib/types/org-chart.ts
 *
 * Phase 13.5: 組織図タブ用の型定義
 * Phase 13.5 拡張: 可視性制御・レポートライン
 */

// ========================================
// 基本型（ブランド型）
// ========================================
export type DepartmentId = string & { readonly brand: unique symbol };
export type MemberDeptAssignmentId = string & { readonly brand: unique symbol };
export type ReportLineId = string & { readonly brand: unique symbol };

// ========================================
// 進捗ステータス
// ========================================
export type OKRStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
export type ElasticBadge = 'Gold' | 'Silver' | 'Bronze' | null;

// ========================================
// 部署
// ========================================
export interface Department {
  id: DepartmentId;
  workspaceId: string;
  parentId: DepartmentId | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// メンバー部署所属
// ========================================
export interface MemberDepartmentAssignment {
  id: MemberDeptAssignmentId;
  userId: string;
  departmentId: DepartmentId;
  isPrimary: boolean;
  role: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// OKR サマリ（API レスポンス用）
// ========================================
export interface MemberOKRSummary {
  progress: number;  // 0.00 ~ 1.00
  status: OKRStatus;
  totalKrs: number;
  completedKrs: number;
}

// ========================================
// TODO サマリ（API レスポンス用）
// ========================================
export interface MemberTodoSummary {
  todayCompleted: number;
  todayRemaining: number;
  weekCompleted: number;
  elasticBadge: ElasticBadge;
}

// ========================================
// 組織図ノード（API レスポンス用）
// ========================================
export type OrgNodeType = 'department' | 'member';

export interface OrgNodeBase {
  id: string;
  type: OrgNodeType;
  name: string;
  children?: OrgNode[];
}

export interface DepartmentNode extends OrgNodeBase {
  type: 'department';
}

export interface MemberNode extends OrgNodeBase {
  type: 'member';
  memberId: string;
  userId: string;
  email: string;
  role: string | null;
  avatarUrl: string | null;
  workspaceRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  okr: MemberOKRSummary;
  todoSummary: MemberTodoSummary;
}

export type OrgNode = DepartmentNode | MemberNode;

// ========================================
// API レスポンス
// ========================================
export interface OrgChartResponse {
  rootNodes: OrgNode[];
  meta: {
    totalMembers: number;
    visibleMembers?: number;
    calculatedAt: string;
  };
}

// ========================================
// ビュータイプ
// ========================================
export type OrgChartViewType = 'tree' | 'card' | 'table' | 'map';

// ========================================
// マップビュー用の型
// ========================================
export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  parentId: string | null;
}

export interface MapLayoutResult {
  positions: Map<string, NodePosition>;
  totalWidth: number;
  totalHeight: number;
  levelCount: number;
}

// ========================================
// フィルタ
// ========================================
export interface OrgChartFilters {
  search: string;
  status: OKRStatus | 'ALL';
  departmentId: DepartmentId | null;
}

// ========================================
// フォームデータ
// ========================================
export interface DepartmentFormData {
  name: string;
  parentId: DepartmentId | null;
  sortOrder: number;
}

export interface MemberAssignmentFormData {
  userId: string;
  departmentId: DepartmentId;
  role: string;
  isPrimary: boolean;
}

// ========================================
// ヘルパー関数
// ========================================
export function isMemberNode(node: OrgNode): node is MemberNode {
  return node.type === 'member';
}

export function isDepartmentNode(node: OrgNode): node is DepartmentNode {
  return node.type === 'department';
}

/**
 * 進捗率からステータスを算出
 */
export function calculateOKRStatus(progress: number): OKRStatus {
  if (progress >= 0.75) return 'ON_TRACK';
  if (progress >= 0.50) return 'AT_RISK';
  return 'OFF_TRACK';
}

/**
 * ステータスに応じたカラーを取得
 */
export function getStatusColor(status: OKRStatus): string {
  switch (status) {
    case 'ON_TRACK':
      return '#4CAF50';  // 緑
    case 'AT_RISK':
      return '#FF9800';  // 黄
    case 'OFF_TRACK':
      return '#F44336';  // 赤
  }
}

/**
 * ステータスラベル（日本語）
 */
export function getStatusLabel(status: OKRStatus): string {
  switch (status) {
    case 'ON_TRACK':
      return '順調';
    case 'AT_RISK':
      return '要注意';
    case 'OFF_TRACK':
      return '遅延';
  }
}

// ========================================
// レポートライン（上司-部下関係）
// ========================================
export interface ReportLine {
  id: ReportLineId;
  workspaceId: string;
  subordinateId: string;
  supervisorId: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// 可視性ポリシー
// ========================================
export type PeerVisibility = 'none' | 'same_dept' | 'all';
export type UnassignedVisibility = 'admins_only' | 'visible_to_all';

export interface VisibilityPolicy {
  id: string;
  workspaceId: string;
  upwardVisibilityLevel: number;  // 0: なし, 1: 直属, 2: 2階層, -1: 全上位
  peerVisibility: PeerVisibility;
  unassignedVisibility: UnassignedVisibility;
  createdAt: string;
  updatedAt: string;
}

// デフォルト可視性ポリシー
export const DEFAULT_VISIBILITY_POLICY: Omit<VisibilityPolicy, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'> = {
  upwardVisibilityLevel: 1,           // 直属上司のみ
  peerVisibility: 'same_dept',        // 同部署のみ
  unassignedVisibility: 'admins_only', // 管理者のみ
};

// ========================================
// 拡張 API レスポンス
// ========================================
export interface OrgChartResponseExtended {
  rootNodes: OrgNode[];
  myPosition?: {
    memberId: string;
    supervisorIds: string[];
    subordinateIds: string[];
    departmentId: DepartmentId | null;
  };
  visibilityPolicy: VisibilityPolicy | null;
  meta: {
    totalMembers: number;
    totalInWorkspace: number;
    visibilityApplied: boolean;
    calculatedAt: string;
  };
}

// ========================================
// 組織管理用フォームデータ
// ========================================
export interface ReportLineFormData {
  subordinateId: string;
  supervisorId: string;
  isPrimary: boolean;
}

export interface VisibilityPolicyFormData {
  upwardVisibilityLevel: number;
  peerVisibility: PeerVisibility;
  unassignedVisibility: UnassignedVisibility;
}

// ========================================
// メンバー配置用
// ========================================
export interface MemberWithAssignment {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  workspaceRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  departmentId: DepartmentId | null;
  departmentName: string | null;
  departmentRole: string | null;
  supervisorIds: string[];
  subordinateIds: string[];
}
