/**
 * lib/types/lead.ts
 *
 * Phase 6: Leads（見込み客）型定義
 */

import { z } from 'zod';

// ========================================
// ファネルステータス
// ========================================

export const LeadStatusSchema = z.enum([
  'UNCONTACTED', // 未接触
  'RESPONDED', // 反応あり
  'NEGOTIATION', // 商談中
  'WON', // 成約
  'LOST', // 失注
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  UNCONTACTED: '未接触',
  RESPONDED: '反応あり',
  NEGOTIATION: '商談中',
  WON: '成約',
  LOST: '失注',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  UNCONTACTED: '#E0E0E0',
  RESPONDED: '#2196F3',
  NEGOTIATION: '#FFD700',
  WON: '#FF9800',
  LOST: '#9E9E9E',
};

// ========================================
// 集客チャネル
// ========================================

export const LeadChannelSchema = z.enum([
  'REAL', // リアル（対面）
  'HP', // ホームページ
  'MAIL_MAGAZINE', // メルマガ
  'MESSENGER', // メッセンジャー
  'X', // X (Twitter)
  'PHONE_SMS', // 電話・SMS
  'WEB_APP', // WEBアプリ
]);

export type LeadChannel = z.infer<typeof LeadChannelSchema>;

export const LEAD_CHANNEL_LABELS: Record<LeadChannel, string> = {
  REAL: 'リアル',
  HP: 'HP',
  MAIL_MAGAZINE: 'メルマガ',
  MESSENGER: 'メッセンジャー',
  X: 'X',
  PHONE_SMS: '電話・SMS',
  WEB_APP: 'WEBアプリ',
};

// ========================================
// Lead（見込み客）型
// ========================================

export const LeadSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  status: LeadStatusSchema,
  channel: LeadChannelSchema.optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // 失注情報
  lostReason: z.string().optional(),
  lostFeedback: z.string().optional(),
  // 日付
  createdAt: z.string(),
  updatedAt: z.string(),
  // リマインダー
  reminder: z.string().nullable().optional(),
  reminderNote: z.string().optional(),
  // 次ミーティング
  nextMeeting: z.string().nullable().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateLeadSchema = z.object({
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, '担当者名は必須です'),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: LeadStatusSchema.default('UNCONTACTED'),
  channel: LeadChannelSchema.optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: LeadStatusSchema.optional(),
  channel: LeadChannelSchema.optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lostReason: z.string().optional(),
  lostFeedback: z.string().optional(),
  reminder: z.string().nullable().optional(),
  reminderNote: z.string().optional(),
  nextMeeting: z.string().nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

// ========================================
// 失注アンケート
// ========================================

export const LostReasonSchema = z.enum([
  'PRICE', // 価格が合わない
  'TIMING', // タイミングが合わない
  'COMPETITOR', // 競合に決定
  'NO_NEED', // ニーズがなくなった
  'NO_RESPONSE', // 連絡が取れない
  'OTHER', // その他
]);

export type LostReason = z.infer<typeof LostReasonSchema>;

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  PRICE: '価格が合わない',
  TIMING: 'タイミングが合わない',
  COMPETITOR: '競合に決定',
  NO_NEED: 'ニーズがなくなった',
  NO_RESPONSE: '連絡が取れない',
  OTHER: 'その他',
};

export const LostSurveySchema = z.object({
  reason: LostReasonSchema,
  reasonOther: z.string().optional(),
  feedback: z.string().optional(),
});

export type LostSurvey = z.infer<typeof LostSurveySchema>;
