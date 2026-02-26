/**
 * lib/types/database.ts
 *
 * データベース型定義
 * Phase 3: 認証基盤
 */

/**
 * ユーザー
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: 'SA' | 'USER' | 'TEST';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * セッション
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * DB から取得した生のユーザーデータ（スネークケース）
 */
export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  account_type: 'SA' | 'USER' | 'TEST';
  created_at: string;
  updated_at: string;
}

/**
 * DB から取得した生のセッションデータ（スネークケース）
 */
export interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * UserRow を User に変換
 */
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    accountType: row.account_type,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * SessionRow を Session に変換
 */
export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}
