/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/mvv/route.ts
 *
 * Phase 17: MVV API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string; brandId: string }> };

// MVV取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // MVV取得
    const { data: mvv, error } = await supabase
      .from('mvv')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error || !mvv) {
      return NextResponse.json({ error: 'MVV not found' }, { status: 404 });
    }

    const formatted = {
      id: mvv.id,
      brandId: mvv.brand_id,
      mission: mvv.mission || '',
      vision: mvv.vision || '',
      values: mvv.values || [],
      createdBy: mvv.created_by,
      createdAt: mvv.created_at,
      updatedAt: mvv.updated_at,
    };

    return NextResponse.json({ mvv: formatted });
  } catch (error) {
    console.error('[MVV API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// MVV更新（upsert）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // メンバーシップ確認
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ブランド存在確認
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const { mission, vision, values } = body;

    // Upsert
    const { data: mvv, error } = await supabase
      .from('mvv')
      .upsert(
        {
          brand_id: brandId,
          mission: mission ?? '',
          vision: vision ?? '',
          values: values ?? [],
          created_by: session.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'brand_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[MVV API] Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = {
      id: mvv.id,
      brandId: mvv.brand_id,
      mission: mvv.mission || '',
      vision: mvv.vision || '',
      values: mvv.values || [],
      createdBy: mvv.created_by,
      createdAt: mvv.created_at,
      updatedAt: mvv.updated_at,
    };

    return NextResponse.json({ mvv: formatted });
  } catch (error) {
    console.error('[MVV API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
