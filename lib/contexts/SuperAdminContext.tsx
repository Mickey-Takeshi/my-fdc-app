/**
 * lib/contexts/SuperAdminContext.tsx
 *
 * Phase 19: Super Admin コンテキスト
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  TenantSummary,
  UserSummary,
  SecurityLog,
  SADashboardStats,
  SystemMetric,
  AccountType,
} from '@/lib/types/super-admin';

interface SuperAdminContextType {
  // データ
  tenants: TenantSummary[];
  users: UserSummary[];
  securityLogs: SecurityLog[];
  metrics: SystemMetric[];
  stats: SADashboardStats | null;

  // 状態
  loading: boolean;
  error: string | null;

  // アクション
  fetchTenants: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchSecurityLogs: (days?: number, severity?: string) => Promise<void>;
  fetchMetrics: (days?: number) => Promise<void>;
  suspendUser: (userId: string, reason?: string) => Promise<boolean>;
  unsuspendUser: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  changeUserType: (userId: string, newType: AccountType) => Promise<boolean>;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [stats, setStats] = useState<SADashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sa/tenants');
      if (!res.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sa/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSecurityLogs = useCallback(async (days = 7, severity?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (severity) params.set('severity', severity);

      const res = await fetch(`/api/admin/sa/security-logs?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch security logs');
      }
      const data = await res.json();
      setSecurityLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async (days = 7) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sa/metrics?days=${days}`);
      if (!res.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await res.json();
      setStats(data.stats || null);
      setMetrics(data.metrics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const suspendUser = useCallback(async (userId: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/sa/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', reason }),
      });
      if (!res.ok) return false;
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  }, [fetchUsers]);

  const unsuspendUser = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/sa/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsuspend' }),
      });
      if (!res.ok) return false;
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/sa/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  }, [fetchUsers]);

  const changeUserType = useCallback(async (userId: string, newType: AccountType) => {
    try {
      const res = await fetch(`/api/admin/sa/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_type', new_type: newType }),
      });
      if (!res.ok) return false;
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  }, [fetchUsers]);

  return (
    <SuperAdminContext.Provider
      value={{
        tenants,
        users,
        securityLogs,
        metrics,
        stats,
        loading,
        error,
        fetchTenants,
        fetchUsers,
        fetchSecurityLogs,
        fetchMetrics,
        suspendUser,
        unsuspendUser,
        deleteUser,
        changeUserType,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  }
  return context;
}
