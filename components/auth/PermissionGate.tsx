'use client';

import { usePermissions } from '@/lib/hooks/use-permissions';
import type { PermissionKey } from '@/lib/types/permission';

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
