'use client';

/**
 * lib/contexts/WorkspaceContext.tsx
 *
 * Workspace context - shares workspace data across all pages
 * Prevents re-fetching /api/workspaces on every page navigation
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  WorkspaceWithRole,
  WorkspaceMemberWithUser,
  WorkspaceRole,
} from '@/lib/types/workspace';

interface WorkspaceContextType {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  members: WorkspaceMemberWithUser[];
  loading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<boolean>;
  updateWorkspace: (id: string, name: string) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  fetchMembers: (workspaceId: string) => Promise<void>;
  addMember: (
    workspaceId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER'
  ) => Promise<boolean>;
  updateMemberRole: (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) => Promise<boolean>;
  removeMember: (
    workspaceId: string,
    userId: string
  ) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error || 'Error occurred' };
    }
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'Network error' };
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchJSON<{
      workspaces: WorkspaceWithRole[];
    }>('/api/workspaces');

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    const wsList = data?.workspaces ?? [];
    setWorkspaces(wsList);

    setCurrentWorkspace((prev) => {
      if (prev) {
        const stillExists = wsList.find((w) => w.id === prev.id);
        return stillExists ?? wsList[0] ?? null;
      }
      return wsList[0] ?? null;
    });

    setLoading(false);
    setInitialized(true);
  }, []);

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
      }
    },
    [workspaces]
  );

  const createWorkspace = useCallback(async (name: string): Promise<boolean> => {
    setError(null);
    const { data, error: createError } = await fetchJSON<{
      workspace: WorkspaceWithRole;
    }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (createError) {
      setError(createError);
      return false;
    }

    if (data?.workspace) {
      setWorkspaces((prev) => [...prev, data.workspace]);
      setCurrentWorkspace(data.workspace);
    }

    return true;
  }, []);

  const updateWorkspace = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setError(null);
      const { error: updateError } = await fetchJSON(
        `/api/workspaces/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name }),
        }
      );

      if (updateError) {
        setError(updateError);
        return false;
      }

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name } : w))
      );
      setCurrentWorkspace((prev) =>
        prev?.id === id ? { ...prev, name } : prev
      );

      return true;
    },
    []
  );

  const deleteWorkspace = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      const { error: deleteError } = await fetchJSON(
        `/api/workspaces/${id}`,
        { method: 'DELETE' }
      );

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      setWorkspaces((prev) => {
        const updated = prev.filter((w) => w.id !== id);
        setCurrentWorkspace((cur) =>
          cur?.id === id ? (updated[0] ?? null) : cur
        );
        return updated;
      });

      return true;
    },
    []
  );

  const fetchMembers = useCallback(
    async (workspaceId: string): Promise<void> => {
      setError(null);
      const { data, error: fetchError } = await fetchJSON<{
        members: WorkspaceMemberWithUser[];
      }>(`/api/workspaces/${workspaceId}/members`);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setMembers(data?.members ?? []);
    },
    []
  );

  const addMember = useCallback(
    async (
      workspaceId: string,
      email: string,
      role: 'ADMIN' | 'MEMBER'
    ): Promise<boolean> => {
      setError(null);
      const { data, error: addError } = await fetchJSON<{
        member: WorkspaceMemberWithUser;
      }>(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      if (addError) {
        setError(addError);
        return false;
      }

      if (data?.member) {
        setMembers((prev) => [...prev, data.member]);
      }

      return true;
    },
    []
  );

  const updateMemberRole = useCallback(
    async (
      workspaceId: string,
      userId: string,
      role: WorkspaceRole
    ): Promise<boolean> => {
      setError(null);
      const { error: updateError } = await fetchJSON(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ role }),
        }
      );

      if (updateError) {
        setError(updateError);
        return false;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId ? { ...m, role } : m
        )
      );

      return true;
    },
    []
  );

  const removeMember = useCallback(
    async (workspaceId: string, userId: string): Promise<boolean> => {
      setError(null);
      const { error: deleteError } = await fetchJSON(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        { method: 'DELETE' }
      );

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      setMembers((prev) => prev.filter((m) => m.user_id !== userId));

      return true;
    },
    []
  );

  // Fetch workspaces once on mount
  useEffect(() => {
    if (!initialized) {
      fetchWorkspaces();
    }
  }, [initialized, fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        members,
        loading,
        error,
        fetchWorkspaces,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchMembers,
        addMember,
        updateMemberRole,
        removeMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}
