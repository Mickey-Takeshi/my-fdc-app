/**
 * app/api/workspaces/[workspaceId]/data/handlers/index.ts
 *
 * Phase 14.6.4: Workspace Data handlers エクスポート
 */

export { handleGet } from './get-handler';
export { handlePut } from './put-handler';
export { validateRequest, checkTenantBoundary } from './validation';
