/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/points/route.ts
 *
 * Phase 15: ブランドポイント更新 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';
import { BrandPointType, BRAND_POINT_ORDER } from '@/lib/types/brand';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; brandId: string }> };

// ポイント更新（upsert）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, brandId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { pointType, content } = body;

    // バリデーション
    if (!pointType || !BRAND_POINT_ORDER.includes(pointType as BrandPointType)) {
      return NextResponse.json({ error: 'Invalid pointType' }, { status: 400 });
    }

    if (content === undefined) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // ブランドの存在確認
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Upsert（存在すれば更新、なければ作成）
    const { data, error } = await supabase
      .from('brand_points')
      .upsert(
        {
          brand_id: brandId,
          point_type: pointType,
          content,
        },
        {
          onConflict: 'brand_id,point_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert point:', error);
      return NextResponse.json({ error: 'Failed to update point' }, { status: 500 });
    }

    return NextResponse.json({
      point: {
        id: data.id,
        brandId: data.brand_id,
        pointType: data.point_type,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[workspaceId]/brands/[brandId]/points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
