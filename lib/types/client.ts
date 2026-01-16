/**
 * lib/types/client.ts
 *
 * Phase 7: Clients（顧客）型定義
 */

import { z } from 'zod';

// ========================================
// クライアントステータス
// ========================================

export const ClientStatusSchema = z.enum([
  'client', // 契約中
  'contract_expired', // 契約期限切れ
]);

export type ClientStatus = z.infer<typeof ClientStatusSchema>;

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  client: '契約中',
  contract_expired: '契約期限切れ',
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  client: '#4CAF50',
  contract_expired: '#FF5722',
};

// ========================================
// 履歴エントリ
// ========================================

export const ClientHistoryEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  note: z.string().optional(),
});

export type ClientHistoryEntry = z.infer<typeof ClientHistoryEntrySchema>;

// ========================================
// Client（顧客）型
// ========================================

export const ClientSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  // 元リードID（参照用）
  leadId: z.string().uuid().nullable().optional(),
  // 基本情報
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  // ステータス
  status: ClientStatusSchema,
  // 契約情報
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  // メモ・履歴
  notes: z.string().optional(),
  history: z.array(ClientHistoryEntrySchema).optional(),
  // 日付
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateClientSchema = z.object({
  leadId: z.string().uuid().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: ClientStatusSchema.default('client'),
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: ClientStatusSchema.optional(),
  contractDeadline: z.string().nullable().optional(),
  nextMeeting: z.string().nullable().optional(),
  notes: z.string().optional(),
  history: z.array(ClientHistoryEntrySchema).optional(),
});

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ========================================
// ヘルパー関数
// ========================================

/**
 * 契約期限が近いかチェック（7日以内）
 */
export function isContractDeadlineNear(
  deadline: string | null | undefined
): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7 && diffDays >= 0;
}

/**
 * 契約期限が過ぎているかチェック
 */
export function isContractExpired(
  deadline: string | null | undefined
): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

/**
 * 次ミーティングが近いかチェック（3日以内）
 */
export function isNextMeetingNear(
  meeting: string | null | undefined
): boolean {
  if (!meeting) return false;
  const meetingDate = new Date(meeting);
  const now = new Date();
  const diffDays = Math.ceil(
    (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 3 && diffDays >= 0;
}
