/**
 * 監査ログユーティリティ（E氏設計）
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from './logger';
import { createHash } from 'crypto';

export async function logAuditEvent(params: {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  request?: NextRequest;
}): Promise<void> {
  const supabase = getAdminClient();

  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  if (params.request) {
    // IPハッシュ化（GDPR対応 - B氏）
    const rawIp =
      params.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      params.request.headers.get('x-real-ip');
    if (rawIp) {
      const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? 'default-salt';
      ipAddress = createHash('sha256').update(`${rawIp}:${salt}`).digest('hex').slice(0, 16);
    }
    userAgent = params.request.headers.get('user-agent')?.slice(0, 200) ?? null;
  }

  const { error } = await supabase.from('audit_log').insert({
    workspace_id: params.workspaceId,
    actor_id: params.actorId,
    actor_email: params.actorEmail,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    changes: params.changes ?? {},
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    logger.error({ err: error, params: { action: params.action } }, 'Failed to write audit log');
  }
}
