/**
 * app/api/workspaces/[workspaceId]/data/handlers/put-handler.ts
 *
 * Phase 14.6.4: PUT ハンドラ
 * Phase 14.6.7: E2E テストモードセキュリティ強化
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { compress, toBase64 } from '@/lib/core/compression';
import { invalidateWorkspaceCache } from '@/lib/server/workspace-cache';
import { apiLogger } from '@/lib/server/logger';
import { validateRequest } from './validation';
import { isE2ETestRequest } from '@/lib/server/test-mode';

/**
 * ワークスペースデータを更新（楽観的排他制御付き）
 */
export async function handlePut(
  request: NextRequest,
  workspaceId: string
): Promise<NextResponse> {
  const perfStart = Date.now();

  // Phase 14.6.7: E2Eテストモードのチェック（開発環境限定）
  if (isE2ETestRequest(request)) {
    apiLogger.debug('[API PUT] E2E Test mode enabled (development only) - returning mock success');
    return NextResponse.json({
      success: true,
      version: 2,
      lastModified: new Date().toISOString(),
      stats: {
        originalSize: 1000,
        compressedSize: 500,
        compressionRatio: '50%',
        compressDuration: '10ms',
        totalDuration: '50ms'
      }
    });
  }

  // バリデーション
  const validation = await validateRequest(request, workspaceId);
  if (!validation.success) {
    return validation.response;
  }
  const { wsId } = validation;

  // リクエストボディ
  const body = await request.json();
  const { data: appData, version: clientVersion } = body;

  if (!appData) {
    return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
  }

  // データ圧縮
  const { compressedBase64, originalSize, compressedSize, compressionRatio, compressDuration } =
    await compressData(appData);

  // 楽観的排他制御（CAS: Compare-And-Swap）
  if (clientVersion !== undefined) {
    return await updateWithVersionCheck(
      wsId, workspaceId, clientVersion, compressedBase64,
      { originalSize, compressedSize, compressionRatio, compressDuration, perfStart }
    );
  } else {
    return await upsertWithoutVersionCheck(
      wsId, workspaceId, compressedBase64,
      { originalSize, compressedSize, compressionRatio, compressDuration, perfStart }
    );
  }
}

/**
 * データを圧縮
 */
async function compressData(appData: unknown) {
  const compressStart = Date.now();
  const jsonStr = JSON.stringify(appData);
  const compressed = await compress(jsonStr);
  const compressDuration = Date.now() - compressStart;

  const originalSize = new TextEncoder().encode(jsonStr).length;
  const compressedSize = compressed.length;
  const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  apiLogger.info(`[Compression] ${originalSize} → ${compressedSize} bytes (${compressionRatio}% reduced) in ${compressDuration}ms`);

  const compressedBase64 = toBase64(compressed);

  return { compressedBase64, originalSize, compressedSize, compressionRatio, compressDuration };
}

interface UpdateStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  compressDuration: number;
  perfStart: number;
}

/**
 * バージョンチェック付き更新
 */
async function updateWithVersionCheck(
  wsId: number,
  workspaceId: string,
  clientVersion: number,
  compressedBase64: string,
  stats: UpdateStats
): Promise<NextResponse> {
  // 現在のバージョンを確認
  const { data: currentData, error: currentError } = await supabase
    .from('workspace_data')
    .select('version')
    .eq('workspace_id', wsId)
    .single();

  if (currentError) {
    return NextResponse.json({ error: 'Workspace data not found' }, { status: 404 });
  }

  if (currentData.version !== clientVersion) {
    return NextResponse.json(
      {
        error: 'Conflict: Data has been updated by another session',
        currentVersion: currentData.version
      },
      { status: 409 }
    );
  }

  // バージョンが一致した場合のみ更新
  const { data: updateData, error: updateError } = await supabase
    .from('workspace_data')
    .update({
      data: compressedBase64,
      version: clientVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('workspace_id', wsId)
    .eq('version', clientVersion)
    .select('version, updated_at')
    .single();

  if (updateError || !updateData) {
    const { data: latestData } = await supabase
      .from('workspace_data')
      .select('version')
      .eq('workspace_id', wsId)
      .single();

    return NextResponse.json(
      {
        error: 'Conflict: Data has been updated by another session',
        currentVersion: latestData?.version || null
      },
      { status: 409 }
    );
  }

  await invalidateWorkspaceCache(wsId);

  const perfDuration = Date.now() - stats.perfStart;
  apiLogger.info(`✅ [API] PUT /workspaces/${workspaceId}/data - ${perfDuration}ms (v${updateData.version})`);

  return NextResponse.json({
    success: true,
    version: updateData.version,
    lastModified: updateData.updated_at,
    stats: {
      originalSize: stats.originalSize,
      compressedSize: stats.compressedSize,
      compressionRatio: `${stats.compressionRatio}%`,
      compressDuration: `${stats.compressDuration}ms`,
      totalDuration: `${perfDuration}ms`,
    },
  });
}

/**
 * バージョンチェックなし更新（強制上書き or 初回保存）
 */
async function upsertWithoutVersionCheck(
  wsId: number,
  workspaceId: string,
  compressedBase64: string,
  stats: UpdateStats
): Promise<NextResponse> {
  const { data: upsertData, error: upsertError } = await supabase
    .from('workspace_data')
    .upsert({
      workspace_id: wsId,
      data: compressedBase64,
      version: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'workspace_id'
    })
    .select('version, updated_at')
    .single();

  if (upsertError) {
    // upsertが失敗した場合、既存レコードを更新
    const { data: existingData } = await supabase
      .from('workspace_data')
      .select('version')
      .eq('workspace_id', wsId)
      .single();

    const newVersion = (existingData?.version || 0) + 1;

    const { data: updateData, error: updateError } = await supabase
      .from('workspace_data')
      .update({
        data: compressedBase64,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', wsId)
      .select('version, updated_at')
      .single();

    if (updateError || !updateData) {
      throw updateError || new Error('Update failed');
    }

    await invalidateWorkspaceCache(wsId);

    const perfDuration = Date.now() - stats.perfStart;
    apiLogger.info(`✅ [API] PUT /workspaces/${workspaceId}/data - ${perfDuration}ms (v${updateData.version})`);

    return NextResponse.json({
      success: true,
      version: updateData.version,
      lastModified: updateData.updated_at,
      stats: {
        originalSize: stats.originalSize,
        compressedSize: stats.compressedSize,
        compressionRatio: `${stats.compressionRatio}%`,
        compressDuration: `${stats.compressDuration}ms`,
        totalDuration: `${perfDuration}ms`,
      },
    });
  }

  await invalidateWorkspaceCache(wsId);

  const perfDuration = Date.now() - stats.perfStart;
  apiLogger.info(`✅ [API] PUT /workspaces/${workspaceId}/data - ${perfDuration}ms (v${upsertData?.version || 1})`);

  return NextResponse.json({
    success: true,
    version: upsertData?.version || 1,
    lastModified: upsertData?.updated_at,
    stats: {
      originalSize: stats.originalSize,
      compressedSize: stats.compressedSize,
      compressionRatio: `${stats.compressionRatio}%`,
      compressDuration: `${stats.compressDuration}ms`,
      totalDuration: `${perfDuration}ms`,
    },
  });
}
