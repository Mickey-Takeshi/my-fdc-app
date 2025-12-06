/**
 * lib/types/database.ts
 *
 * データベース型定義
 */

import type { AppData } from './app-data';

export interface User {
  id: string;
  googleSub: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: 'SA' | 'USER' | 'TEST';
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

export interface WorkspaceData {
  workspaceId: string;
  data: AppData;
  version?: number; // 楽観的ロック用（Phase 10）
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
