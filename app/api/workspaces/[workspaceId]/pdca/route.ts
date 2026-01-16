/**
 * app/api/workspaces/[workspaceId]/pdca/route.ts
 *
 * Phase 8: PDCA分析API
 * GET: PDCA分析結果取得（週次/月次）
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import {
  PDCAAnalysis,
  PeriodType,
  getCurrentWeekPeriod,
  getCurrentMonthPeriod,
  getPeriodLabel,
} from '@/lib/types/pdca';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('periodType') || 'weekly') as PeriodType;

    // 期間を取得
    const period = periodType === 'weekly'
      ? getCurrentWeekPeriod()
      : getCurrentMonthPeriod();

    // 目標を取得
    const { data: goalData } = await supabase
      .from('approach_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('period_type', periodType)
      .eq('period_start', period.start)
      .single();

    // 実績を取得（期間内のアプローチ）
    const { data: approachData } = await supabase
      .from('approaches')
      .select('id, result')
      .eq('workspace_id', workspaceId)
      .gte('approached_at', period.start)
      .lte('approached_at', period.end + 'T23:59:59');

    const approaches = approachData || [];
    const totalCount = approaches.length;
    const successCount = approaches.filter((a) => a.result === 'success').length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    // 目標変換
    const goal = goalData
      ? {
          id: goalData.id,
          workspaceId: goalData.workspace_id,
          periodType: goalData.period_type as PeriodType,
          periodStart: goalData.period_start,
          periodEnd: goalData.period_end,
          targetCount: goalData.target_count,
          targetSuccessRate: goalData.target_success_rate,
          improvementNote: goalData.improvement_note,
          createdAt: goalData.created_at,
          updatedAt: goalData.updated_at,
        }
      : null;

    // PDCA分析結果
    const analysis: PDCAAnalysis = {
      goal,
      actual: {
        count: totalCount,
        successCount,
        successRate,
      },
      achievement: {
        countRate: goal && goal.targetCount > 0
          ? Math.round((totalCount / goal.targetCount) * 100)
          : 0,
        successRateGap: goal?.targetSuccessRate != null
          ? successRate - goal.targetSuccessRate
          : null,
      },
      period: {
        type: periodType,
        start: period.start,
        end: period.end,
        label: getPeriodLabel(periodType, period.start),
      },
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in GET /pdca:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
