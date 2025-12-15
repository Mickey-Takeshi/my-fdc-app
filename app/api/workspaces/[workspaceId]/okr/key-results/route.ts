/**
 * app/api/workspaces/[workspaceId]/okr/key-results/route.ts
 *
 * Phase 11: Workspace全体のKey Results一覧取得API
 * ActionMapからKRを選択するために使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { calculateKeyResultProgress } from '@/lib/types/okr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// GET: Workspace全体のKR一覧取得（Objective情報付き）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // メンバーシップ確認
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // アクティブなObjectiveのKRを取得
    const { data: objectives, error: objError } = await supabase
      .from('objectives')
      .select('id, title, period')
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (objError) {
      return NextResponse.json({ error: objError.message }, { status: 500 });
    }

    // 各ObjectiveのKRを取得
    const keyResultsWithObjective = await Promise.all(
      (objectives || []).map(async (obj) => {
        const { data: krs } = await supabase
          .from('key_results')
          .select('*')
          .eq('objective_id', obj.id)
          .order('created_at', { ascending: true });

        return (krs || []).map((kr) => ({
          id: kr.id,
          objectiveId: kr.objective_id,
          workspaceId: kr.workspace_id,
          title: kr.title,
          targetValue: Number(kr.target_value),
          currentValue: Number(kr.current_value),
          unit: kr.unit,
          progress: calculateKeyResultProgress(kr.current_value, kr.target_value),
          objective: {
            id: obj.id,
            title: obj.title,
            period: obj.period,
          },
        }));
      })
    );

    // フラット化
    const allKeyResults = keyResultsWithObjective.flat();

    return NextResponse.json(allKeyResults);
  } catch (error) {
    console.error('Error in GET /okr/key-results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
