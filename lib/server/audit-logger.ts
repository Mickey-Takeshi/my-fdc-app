import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from './logger';

interface AuditEntry {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_log').insert({
      workspace_id: entry.workspaceId,
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      changes: entry.changes ?? {},
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });
  } catch (err) {
    logger.error({ err, entry }, 'Failed to write audit log');
  }
}
