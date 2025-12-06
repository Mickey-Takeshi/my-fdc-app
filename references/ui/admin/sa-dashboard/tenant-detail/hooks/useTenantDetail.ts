/**
 * テナント詳細データ取得フック
 */

import { useState, useCallback, useEffect } from 'react';
import type { Tenant } from '../../TenantManagementTable';
import type { TenantWorkspace, TenantUser } from '../types';

export function useTenantDetail(tenant: Tenant | null, isOpen: boolean) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [workspaces, setWorkspaces] = useState<TenantWorkspace[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);

  const fetchDetail = useCallback(async () => {
    if (!tenant) return;

    setLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '詳細取得に失敗しました');
      }
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '詳細取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    if (isOpen && tenant) {
      fetchDetail();
    }
  }, [isOpen, tenant, fetchDetail]);

  return {
    loading,
    error,
    workspaces,
    users,
    fetchDetail,
  };
}
