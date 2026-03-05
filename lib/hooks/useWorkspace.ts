'use client';

/**
 * lib/hooks/useWorkspace.ts
 *
 * Workspace hook - delegates to WorkspaceContext
 * All pages share the same workspace state via context,
 * eliminating redundant /api/workspaces calls on navigation.
 */

import { useWorkspaceContext } from '@/lib/contexts/WorkspaceContext';

export function useWorkspace() {
  return useWorkspaceContext();
}
