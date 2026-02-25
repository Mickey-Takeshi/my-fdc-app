export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export const PERMISSION_KEYS = {
  // CRM
  'crm:read': 'クライアント情報の閲覧',
  'crm:write': 'クライアント情報の編集',
  'crm:dashboard': 'CRMダッシュボードの閲覧',
  'crm:export': 'クライアントデータのエクスポート',
  'crm:delete': 'クライアントデータの削除',
  // フォーム
  'forms:read': 'フォーム一覧の閲覧',
  'forms:create': 'フォームの作成',
  'forms:edit': 'フォームの編集・公開',
  'forms:delete': 'フォームの削除',
  'forms:view_responses': 'フォーム回答の閲覧',
  'forms:export': 'フォーム回答のエクスポート',
  // 決済
  'billing:read': '請求情報の閲覧',
  'billing:manage': 'プラン・サブスクリプション管理',
  'billing:gmail_config': 'Gmail監視の設定',
  'billing:confirm_match': '入金マッチングの確認・承認',
  // メンバー管理
  'members:read': 'メンバー一覧の閲覧',
  'members:invite': 'メンバーの招待',
  'members:remove': 'メンバーの削除',
  'members:change_role': 'ロールの変更',
  'members:manage_permissions': '権限セットの管理',
  // ワークスペース
  'workspace:settings': 'ワークスペース設定の変更',
  'workspace:billing': '課金設定の変更',
  'workspace:audit_log': '監査ログの閲覧',
  'workspace:delete': 'ワークスペースの削除',
} as const;

export type PermissionKey = keyof typeof PERMISSION_KEYS;

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  owner: Object.keys(PERMISSION_KEYS) as PermissionKey[],
  admin: [
    'crm:read',
    'crm:write',
    'crm:dashboard',
    'crm:export',
    'forms:read',
    'forms:create',
    'forms:edit',
    'forms:view_responses',
    'forms:export',
    'billing:read',
    'billing:confirm_match',
    'members:read',
    'members:invite',
    'members:remove',
    'members:change_role',
    'workspace:settings',
    'workspace:audit_log',
  ],
  member: [
    'crm:read',
    'crm:write',
    'crm:dashboard',
    'forms:read',
    'members:read',
  ],
  viewer: ['crm:read', 'forms:read', 'members:read'],
};

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission);
}
