'use client';

import useSWR from 'swr';
import type { CustomerTag } from '@/lib/types/customer';

export function useClientTags(workspaceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: CustomerTag[];
  }>(
    workspaceId ? '/api/crm/tags' : null,
    (url: string) =>
      fetch(url, { headers: { 'x-workspace-id': workspaceId! } }).then((r) =>
        r.json()
      ),
    { revalidateOnFocus: false }
  );

  const createTag = async (tag: { name: string; color?: string; description?: string }) => {
    const res = await fetch('/api/crm/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId!,
      },
      body: JSON.stringify(tag),
    });
    const json = await res.json();
    if (json.success) {
      mutate();
    }
    return json;
  };

  const assignTag = async (customerId: string, tagId: string) => {
    const res = await fetch('/api/crm/tags/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId!,
      },
      body: JSON.stringify({ customerId, tagId }),
    });
    return res.json();
  };

  const removeTag = async (customerId: string, tagId: string) => {
    const res = await fetch('/api/crm/tags/assign', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId!,
      },
      body: JSON.stringify({ customerId, tagId }),
    });
    return res.json();
  };

  return {
    tags: data?.data ?? [],
    isLoading,
    error,
    createTag,
    assignTag,
    removeTag,
    refresh: mutate,
  };
}
