import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const parsedId = parseInt(projectId);

  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: '잘못된 프로젝트 ID입니다.' },
      { status: 400 }
    );
  }

  try {
    // 1차 시도: RPC 함수 사용
    const { error: rpcError } = await supabaseAdmin
      .rpc('increment_views', { project_id: parsedId });

    if (rpcError) {
      console.warn('RPC increment_views 실패, fallback 사용:', rpcError.message);
      
      // 2차 시도: 직접 업데이트 (views_count 컬럼 사용)
      const { error: updateError } = await supabaseAdmin
        .from('Project')
        .update({ views_count: supabaseAdmin.rpc('increment_views_count_fallback', { pid: parsedId }) as any })
        .eq('project_id', parsedId);

      // 3차 시도: 가장 안전한 방식 - 현재 값을 조회 후 +1
      if (updateError) {
        console.warn('2차 업데이트 실패, 3차 시도:', updateError.message);
        
        const { data: currentProject } = await supabaseAdmin
          .from('Project')
          .select('views_count')
          .eq('project_id', parsedId)
          .single();
        
        const currentCount = currentProject?.views_count || 0;
        
        const { error: finalError } = await supabaseAdmin
          .from('Project')
          .update({ views_count: currentCount + 1 })
          .eq('project_id', parsedId);
        
        if (finalError) {
          console.error('조회수 증가 최종 실패:', finalError);
          return NextResponse.json(
            { error: '조회수 증가에 실패했습니다.', details: finalError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
