/**
 * lib/types/prospect.ts
 *
 * リード（見込み客）の型定義（Phase 6）
 * DB テーブル: leads
 */

/** ファネルステータス */
export type ProspectStatus =
  | 'new'
  | 'approaching'
  | 'negotiating'
  | 'proposing'
  | 'won'
  | 'lost';

/** ステータスの表示ラベル */
export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: '新規',
  approaching: 'アプローチ中',
  negotiating: '商談中',
  proposing: '提案中',
  won: '受注',
  lost: '失注',
};

/** カンバン表示用のアクティブステータス（won/lost 除外） */
export const KANBAN_STATUSES: ProspectStatus[] = [
  'new',
  'approaching',
  'negotiating',
  'proposing',
];

/** 全ステータス */
export const ALL_STATUSES: ProspectStatus[] = [
  'new',
  'approaching',
  'negotiating',
  'proposing',
  'won',
  'lost',
];

/** リード（見込み客）データ */
export interface Prospect {
  id: string;
  workspaceId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: ProspectStatus;
  channel: string;
  memo: string;
  tags: string[];
  lostReason: string;
  lostFeedback: string;
  reminder: string | null;
  reminderNote: string;
  nextMeeting: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DB の leads テーブルの行データ */
export interface LeadRow {
  id: string;
  workspace_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  channel: string;
  memo: string;
  tags: string[];
  lost_reason: string;
  lost_feedback: string;
  reminder: string | null;
  reminder_note: string;
  next_meeting: string | null;
  created_at: string;
  updated_at: string;
}

/** DB 行からフロントエンド型への変換 */
export function toProspect(row: LeadRow): Prospect {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: (row.status as ProspectStatus) ?? 'new',
    channel: row.channel ?? '',
    memo: row.memo ?? '',
    tags: row.tags ?? [],
    lostReason: row.lost_reason ?? '',
    lostFeedback: row.lost_feedback ?? '',
    reminder: row.reminder,
    reminderNote: row.reminder_note ?? '',
    nextMeeting: row.next_meeting,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
