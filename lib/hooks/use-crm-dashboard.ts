'use client';

import useSWR from 'swr';
import type { CrmDashboardStats } from '@/lib/types/customer';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCrmDashboard(workspaceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: CrmDashboardStats;
  }>(
    workspaceId ? `/api/crm/dashboard` : null,
    (url: string) =>
      fetcher(url).then((r) => {
        // headers are set by the provider
        return fetch(url, { headers: { 'x-workspace-id': workspaceId! } }).then(
          (res) => res.json()
        );
      }),
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.data ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}
