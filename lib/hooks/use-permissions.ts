'use client';

import useSWR from 'swr';
import type { PermissionKey } from '@/lib/types/permission';

interface PermissionsResponse {
  permissions: Record<string, boolean>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePermissions(workspaceId?: string) {
  const { data, error, isLoading } = useSWR<{ data: PermissionsResponse }>(
    workspaceId ? `/api/permissions?workspaceId=${workspaceId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const permissions = data?.data?.permissions ?? {};

  const hasPermission = (key: PermissionKey): boolean => {
    return permissions[key] === true;
  };

  return { permissions, hasPermission, isLoading, error };
}
