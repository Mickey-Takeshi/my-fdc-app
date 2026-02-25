/**
 * 権限解決エンジン
 *
 * 優先順位:
 * 1. member_permission_overrides.custom_permissions（個別オーバーライド）
 * 2. permission_sets.permissions（権限セット）
 * 3. DEFAULT_ROLE_PERMISSIONS[role]（デフォルトロール権限）
 *
 * キャッシュ: Vercel KV（キー: perm:{workspaceId}:{userId}、TTL: 5分）
 */

import {
  type Role,
  type PermissionKey,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_KEYS,
} from '@/lib/types/permission';
import { getAdminClient } from '@/lib/supabase/admin';

const CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map<string, { data: Record<PermissionKey, boolean>; expiresAt: number }>();

function getCacheKey(workspaceId: string, userId: string) {
  return `perm:${workspaceId}:${userId}`;
}

export async function resolvePermissions(
  userId: string,
  workspaceId: string,
  role: Role
): Promise<Record<PermissionKey, boolean>> {
  const cacheKey = getCacheKey(workspaceId, userId);

  // Check memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Start with default role permissions
  const allKeys = Object.keys(PERMISSION_KEYS) as PermissionKey[];
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role];
  const resolved: Record<PermissionKey, boolean> = {} as Record<PermissionKey, boolean>;

  for (const key of allKeys) {
    resolved[key] = defaultPerms.includes(key);
  }

  // Apply permission set overrides
  const supabase = getAdminClient();

  const { data: override } = await supabase
    .from('member_permission_overrides')
    .select('permission_set_id, custom_permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (override) {
    // Apply permission set
    if (override.permission_set_id) {
      const { data: permSet } = await supabase
        .from('permission_sets')
        .select('permissions')
        .eq('id', override.permission_set_id)
        .single();

      if (permSet?.permissions) {
        const setPerms = permSet.permissions as Record<string, boolean>;
        for (const key of allKeys) {
          if (key in setPerms) {
            resolved[key] = setPerms[key];
          }
        }
      }
    }

    // Apply custom overrides (highest priority)
    if (override.custom_permissions) {
      const customPerms = override.custom_permissions as Record<string, boolean>;
      for (const key of allKeys) {
        if (key in customPerms) {
          resolved[key] = customPerms[key];
        }
      }
    }
  }

  // Cache result
  memoryCache.set(cacheKey, { data: resolved, expiresAt: Date.now() + CACHE_TTL_MS });

  return resolved;
}

export async function checkPermission(
  userId: string,
  workspaceId: string,
  role: Role,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await resolvePermissions(userId, workspaceId, role);
  return permissions[permission] ?? false;
}

export function invalidatePermissionCache(workspaceId: string, userId?: string) {
  if (userId) {
    memoryCache.delete(getCacheKey(workspaceId, userId));
  } else {
    // Invalidate all for workspace
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`perm:${workspaceId}:`)) {
        memoryCache.delete(key);
      }
    }
  }
}
