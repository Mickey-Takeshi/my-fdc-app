/**
 * app/api/workspaces/[workspaceId]/data/handlers/get-handler.ts
 *
 * Phase 14.6.4: GET ハンドラ
 * Phase 14.6.7: E2E テストモードセキュリティ強化
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { decompress } from '@/lib/core/compression';
import { sanitizeAppData } from '@/lib/core/validator';
import { getStandardHeaders } from '@/lib/server/response-headers';
import {
  getCachedWorkspaceData,
  setCachedWorkspaceData,
} from '@/lib/server/workspace-cache';
import { apiLogger } from '@/lib/server/logger';
import { validateRequest } from './validation';
import { isE2ETestRequest } from '@/lib/server/test-mode';
import type { AppData } from '@/lib/types/app-data';

/**
 * ワークスペースデータを取得
 */
export async function handleGet(
  request: NextRequest,
  workspaceId: string
): Promise<NextResponse> {
  const perfStart = Date.now();
  apiLogger.debug(`[API GET] Starting for workspaceId=${workspaceId}`);

  // Phase 14.6.7: E2Eテストモードのチェック（開発環境限定）
  if (isE2ETestRequest(request)) {
    apiLogger.debug('[API GET] E2E Test mode enabled (development only) - returning mock data');
    const wsId = parseInt(workspaceId, 10);
    return NextResponse.json({
      workspaceId: wsId,
      data: {
        mvv: { mission: '', vision: '', values: '' },
        brand: { tagline: '', description: '', personality: '' },
        lean: { problem: '', solution: '', metrics: '', uniqueValue: '', advantage: '', channels: '', segments: '', costs: '', revenue: '' },
        leads: [],
        clients: [],
        lostDeals: [],
        todos: [],
        zoomScript: { introduction: '', questions: [], closing: '' },
        templates: [],
        reports: { insights: [] }
      },
      version: 1,
      lastModified: new Date().toISOString()
    });
  }

  // バリデーション
  const validation = await validateRequest(request, workspaceId);
  if (!validation.success) {
    return validation.response;
  }
  const { wsId } = validation;

  // キャッシュからデータ取得を試行
  const cachedData = await getCachedWorkspaceData(wsId);
  if (cachedData) {
    apiLogger.debug(`[API GET] Cache hit for wsId=${wsId}, version=${cachedData.version}`);
    const perfDuration = Date.now() - perfStart;
    apiLogger.info(`✅ [API] GET /workspaces/${workspaceId}/data - ${perfDuration}ms (cached)`);

    return NextResponse.json(
      {
        workspaceId: wsId,
        data: cachedData.data,
        version: cachedData.version,
        lastModified: cachedData.updatedAt,
      },
      {
        headers: getStandardHeaders(),
      }
    );
  }

  // キャッシュミス - DBからデータ取得
  apiLogger.debug(`[API GET] Cache miss, fetching workspace_data for wsId=${wsId}`);
  const { data: wsData, error: wsError } = await supabase
    .from('workspace_data')
    .select('data, version, updated_at')
    .eq('workspace_id', wsId)
    .single();

  if (wsError || !wsData) {
    apiLogger.debug({ message: wsError?.message }, '[API GET] Workspace data not found');
    return NextResponse.json({ error: 'Workspace data not found' }, { status: 404 });
  }

  // データの展開
  const appData = await decompressData(wsData.data);

  // 取得したデータをキャッシュに保存
  await setCachedWorkspaceData(wsId, appData, wsData.version, wsData.updated_at);

  const perfDuration = Date.now() - perfStart;
  apiLogger.info(`✅ [API] GET /workspaces/${workspaceId}/data - ${perfDuration}ms`);

  return NextResponse.json(
    {
      workspaceId: wsId,
      data: appData,
      version: wsData.version,
      lastModified: wsData.updated_at,
    },
    {
      headers: getStandardHeaders(),
    }
  );
}

/**
 * 圧縮データを展開
 */
async function decompressData(compressedData: unknown): Promise<AppData> {
  apiLogger.debug(`[API GET] Data type: ${typeof compressedData}, isArray: ${Array.isArray(compressedData)}`);

  try {
    // JSONB として直接オブジェクトの場合は展開不要
    if (compressedData && typeof compressedData === 'object' && !Array.isArray(compressedData)) {
      apiLogger.info('ℹ️  [API] 非圧縮JSONBデータを検出');
      return sanitizeAppData(compressedData);
    } else if (typeof compressedData === 'string') {
      // Base64圧縮文字列の場合
      apiLogger.debug('[API GET] Attempting to decompress Base64 string');
      try {
        const decompressed = await decompress(compressedData);
        apiLogger.debug(`[API GET] Decompressed length: ${decompressed.length}`);
        const parsed = JSON.parse(decompressed);
        return sanitizeAppData(parsed);
      } catch (decompressError) {
        // JSON文字列として直接パースを試みる
        apiLogger.info({ err: decompressError }, 'ℹ️  [API] 圧縮解除失敗、JSON直接パースを試行');
        try {
          const parsed = JSON.parse(compressedData);
          return sanitizeAppData(parsed);
        } catch (jsonError) {
          apiLogger.error({ err: jsonError }, '❌ [API] JSONパースも失敗');
          throw decompressError;
        }
      }
    } else {
      // その他の場合（null, undefined, etc.）
      apiLogger.debug('[API GET] Data is null/undefined, using empty object');
      return sanitizeAppData({});
    }
  } catch (error) {
    apiLogger.error({ err: error }, '❌ [API] データ展開エラー');
    // フォールバック: 空のデータ構造を返す
    return sanitizeAppData({});
  }
}
