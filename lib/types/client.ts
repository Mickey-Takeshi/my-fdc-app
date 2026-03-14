/**
 * lib/types/client.ts
 *
 * クライアント（既存客）の型定義（Phase 7）
 * DB テーブル: clients
 */

/** クライアントステータス */
export type ClientStatus = 'active' | 'inactive';

/** ステータスの表示ラベル */
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: '取引中',
  inactive: '休止中',
};

/** クライアントデータ */
export interface Client {
  id: string;
  workspaceId: string;
  leadId: string | null;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: ClientStatus;
  contractDeadline: string | null;
  nextMeeting: string | null;
  notes: string;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/** 履歴エントリ */
export interface HistoryEntry {
  date: string;
  action: string;
  note?: string;
}

/** DB の clients テーブルの行データ */
export interface ClientRow {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  contract_deadline: string | null;
  next_meeting: string | null;
  notes: string;
  history: HistoryEntry[] | null;
  created_at: string;
  updated_at: string;
}

/** DB 行からフロントエンド型への変換 */
export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    companyName: row.company_name ?? '',
    contactPerson: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: (row.status as ClientStatus) ?? 'active',
    contractDeadline: row.contract_deadline,
    nextMeeting: row.next_meeting,
    notes: row.notes ?? '',
    history: row.history ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
