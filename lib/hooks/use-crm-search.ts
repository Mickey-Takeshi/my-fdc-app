'use client';

import useSWR from 'swr';
import type { CrmSearchFilters, CrmSearchResult } from '@/lib/types/customer';

function buildSearchUrl(workspaceId: string, filters: CrmSearchFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','));
  if (filters.sources?.length) params.set('sources', filters.sources.join(','));
  if (filters.tagIds?.length) params.set('tagIds', filters.tagIds.join(','));
  if (filters.followupOverdue) params.set('followupOverdue', 'true');
  if (filters.hasNoTags) params.set('hasNoTags', 'true');
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return `/api/crm/search?${params.toString()}`;
}

export function useCrmSearch(workspaceId: string | null, filters: CrmSearchFilters) {
  const url = workspaceId ? buildSearchUrl(workspaceId, filters) : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: CrmSearchResult;
  }>(
    url,
    (u: string) =>
      fetch(u, { headers: { 'x-workspace-id': workspaceId! } }).then((r) =>
        r.json()
      ),
    { keepPreviousData: true }
  );

  return {
    result: data?.data ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}
