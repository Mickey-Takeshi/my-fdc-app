'use client';

import useSWR from 'swr';
import type { PermissionKey } from '@/lib/types/permission';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePermissions() {
  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: { role: string; permissions: Record<PermissionKey, boolean> };
  }>('/api/permissions/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const permissions = data?.data?.permissions;

  return {
    role: data?.data?.role ?? null,
    permissions,
    isLoading,
    error,
    hasPermission: (key: PermissionKey) => permissions?.[key] ?? false,
  };
}
