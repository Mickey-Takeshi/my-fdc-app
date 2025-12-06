/**
 * app/api/workspaces/[workspaceId]/data/route.ts
 *
 * 【Phase 9.97】Supabase SDK 統一版
 * 【Phase 14.2】ワークスペースデータキャッシュ統合
 * 【Phase 14.6.4】handlers/ に分割
 *
 * 【実装機能】
 * - BR-01: 楽観的排他制御（Optimistic Locking）
 * - BR-02: データ圧縮（Gzip）
 * - BR-08: パフォーマンス計測
 * - Phase 14.2: Vercel KVキャッシュによるDB負荷削減
 *
 * 【エンドポイント】
 * - GET  /api/workspaces/:workspaceId/data - データ取得
 * - PUT  /api/workspaces/:workspaceId/data - データ更新（version チェック付き）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStandardHeaders } from '@/lib/server/response-headers';
import { apiLogger } from '@/lib/server/logger';
import { handleGet, handlePut } from './handlers';

/**
 * GET /api/workspaces/:workspaceId/data
 *
 * ワークスペースデータを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    return await handleGet(request, workspaceId);
  } catch (error: unknown) {
    apiLogger.error({ err: error }, '❌ [API] GET Error');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500, headers: getStandardHeaders() }
    );
  }
}

/**
 * PUT /api/workspaces/:workspaceId/data
 *
 * ワークスペースデータを更新（楽観的排他制御付き）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    return await handlePut(request, workspaceId);
  } catch (error: unknown) {
    apiLogger.error({ err: error }, '❌ [API] PUT Error');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}
