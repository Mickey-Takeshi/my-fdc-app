/**
 * app/api/workspaces/[workspaceId]/brands/route.ts
 *
 * Phase 15: ブランド一覧・作成 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { BRAND_POINT_ORDER } from '@/lib/types/brand';

export const dynamic = 'force-dynamic';


type RouteParams = { params: Promise<{ workspaceId: string }> };

// ブランド一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    const brands = (data || []).map((item: any) => ({
      id: item.id,
      workspaceId: item.workspace_id,
      name: item.name,
      tagline: item.tagline,
      story: item.story,
      logoUrl: item.logo_url,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { name, tagline, story } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // ブランドを作成
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        workspace_id: workspaceId,
        name,
        tagline: tagline || null,
        story: story || null,
        created_by: session.userId,
      })
      .select()
      .single();

    if (brandError) {
      console.error('Failed to create brand:', brandError);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    // 10ポイントの初期データを作成
    const pointsToInsert = BRAND_POINT_ORDER.map(pointType => ({
      brand_id: brand.id,
      point_type: pointType,
      content: '',
    }));

    const { error: pointsError } = await supabase
      .from('brand_points')
      .insert(pointsToInsert);

    if (pointsError) {
      console.error('Failed to create initial points:', pointsError);
      // ブランドは作成済みなので続行
    }

    return NextResponse.json({
      brand: {
        id: brand.id,
        workspaceId: brand.workspace_id,
        name: brand.name,
        tagline: brand.tagline,
        story: brand.story,
        logoUrl: brand.logo_url,
        createdBy: brand.created_by,
        createdAt: brand.created_at,
        updatedAt: brand.updated_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workspaces/[workspaceId]/brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
