/**
 * app/api/workspaces/[workspaceId]/brands/[brandId]/route.ts
 *
 * Phase 15: ブランド詳細・更新・削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteParams = { params: Promise<{ workspaceId: string; brandId: string }> };

// ブランド詳細取得（ポイント含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // ブランドを取得
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // ポイントを取得
    const { data: points, error: pointsError } = await supabase
      .from('brand_points')
      .select('*')
      .eq('brand_id', brandId);

    if (pointsError) {
      console.error('Failed to fetch points:', pointsError);
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
        points: (points || []).map((p: any) => ({
          id: p.id,
          brandId: p.brand_id,
          pointType: p.point_type,
          content: p.content,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { name, tagline, story, logoUrl } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (story !== undefined) updateData.story = story;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;

    const { data, error } = await supabase
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update brand:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json({
      brand: {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        tagline: data.tagline,
        story: data.story,
        logoUrl: data.logo_url,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブランド削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Failed to delete brand:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/brands/[brandId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
