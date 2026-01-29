import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAnon } from '@/lib/supabase/client'; // Rename to avoid confusion
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server'; // For Session Auth
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

// 캐시 설정 제거 (실시간 디버깅)
export const revalidate = 0; 

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const mode = searchParams.get('mode');
    const field = searchParams.get('field');
    
    const offset = (page - 1) * limit;

    // Use Server Client for Auth (Cookies) - Faster than manual token check usually
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentAuthenticatedUserId = currentUser?.id || null;

    // 1. Base Query with Profile Join (Reduction of 1 RTT)
    let query = (supabaseAdmin as any)
      .from('Project')
      .select(`
        project_id, title, thumbnail_url, views_count, likes_count, rating_count, 
        created_at, user_id, category_id, summary, description, custom_data, 
        audit_deadline, site_url, visibility, scheduled_at, is_growth_requested,
        User:profiles(username, avatar_url, nickname)
      `) 
      .is('deleted_at', null) 
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let isOwner = userId && currentAuthenticatedUserId === userId;

    if (!isOwner) {
       const nowISO = new Date().toISOString();
       query = query
         .eq('visibility', 'public')
         .or(`scheduled_at.is.null,scheduled_at.lte.${nowISO}`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content_text.ilike.%${search}%`);
    }

    if (category && category !== 'korea' && category !== 'all') {
      const categoryId = GENRE_TO_CATEGORY_ID[category];
      if (categoryId) query = query.eq('category_id', categoryId);
    }

    if (mode === 'growth') {
       query = query.or(`is_growth_requested.eq.true,custom_data->>is_feedback_requested.eq.true`);
    } else if (mode === 'audit') {
       query = query.not('custom_data->audit_config', 'is', null);
    }

    if (field && field !== 'all') {
       const { data: fieldData } = await supabaseAdmin.from('fields').select('id').eq('slug', field).single();
       if (fieldData) {
          const { data: pFields } = await supabaseAdmin.from('project_fields').select('project_id').eq('field_id', fieldData.id);
          if (pFields && pFields.length > 0) {
             query = query.in('project_id', pFields.map((row:any) => row.project_id));
          } else {
             query = query.eq('project_id', -1); 
          }
       }
    }

    if (userId) query = query.eq('user_id', userId);

    const { data, error, count } = await query;

    if (error) {
      console.error('[API/GET] Projects fetch error:', error);
      return NextResponse.json({ error: '조회 실패', details: error.message }, { status: 500 });
    }

    // 2. Multi-fetch for Social State (only if logged in)
    if (data && data.length > 0) {
      const projectIds = data.map((p: any) => p.project_id);

      let myRatingsSet = new Set();
      let myLikesSet = new Set();
      let myBookmarksSet = new Set();

      if (currentAuthenticatedUserId) {
        const [ratingsRes, likesRes, bookmarksRes] = await Promise.all([
            supabaseAdmin.from('ProjectRating' as any).select('project_id').eq('user_id', currentAuthenticatedUserId).in('project_id', projectIds),
            supabaseAdmin.from('ProjectLike' as any).select('project_id').eq('user_id', currentAuthenticatedUserId).in('project_id', projectIds),
            supabaseAdmin.from('CollectionItem' as any).select('project_id, Collection!inner(user_id)').eq('Collection.user_id', currentAuthenticatedUserId).in('project_id', projectIds)
        ]);

        if (ratingsRes.data) ratingsRes.data.forEach((r: any) => myRatingsSet.add(r.project_id));
        if (likesRes.data) likesRes.data.forEach((l: any) => myLikesSet.add(l.project_id));
        if (bookmarksRes.data) bookmarksRes.data.forEach((b: any) => myBookmarksSet.add(b.project_id));
      }

      data.forEach((project: any) => {
        // Fallback for user info
        if (!project.User) {
            project.User = { username: 'Unknown', avatar_url: '/globe.svg' };
        } else if (Array.isArray(project.User)) {
            project.User = project.User[0] || { username: 'Unknown', avatar_url: '/globe.svg' };
        }
        
        project.has_rated = myRatingsSet.has(project.project_id);
        project.is_liked = myLikesSet.has(project.project_id);
        project.is_bookmarked = myBookmarksSet.has(project.project_id);
        project.rating_count = project.rating_count || 0;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[API/GET] Mode: ${mode}, Count: ${data?.length}, Total: ${count}, Time: ${duration}ms`);

    return NextResponse.json({
      projects: data, 
      metadata: { total: count || 0, page, limit, hasMore: data?.length === limit, duration_ms: duration }
    });
  } catch (error: any) {
    console.error('[API/GET] Critical error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    let authenticatedUserId: string | null = null;
    let isApiContext = false;
    const authHeader = request.headers.get('Authorization');

    // [1] API Key Authentication (Strict)
    if (authHeader) {
        // Bearer 접두사 제거 (대소문자 무관)
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        
        // vf_로 시작하면 API Key로 간주
        if (token.startsWith('vf_')) {
             const { data: keyRecord, error: keyError } = await supabaseAdmin
                .from('api_keys')
                .select('user_id')
                .eq('api_key', token)
                .eq('is_active', true)
                .single();
            
             if (keyRecord) {
                 authenticatedUserId = keyRecord.user_id;
                 isApiContext = true;
                 console.log(`[API] Key Auth Success User: ${authenticatedUserId}`);
             } else {
                 console.warn(`[API] Invalid Key: ${token}`);
                 return NextResponse.json({ error: 'Invalid API Key', code: 'INVALID_KEY' }, { status: 401 });
             }
        } else {
             // [Fix] Support JWT Token for Client-side requests
             const { data: { user } } = await supabaseAdmin.auth.getUser(token);
             if (user) {
                 authenticatedUserId = user.id;
             } else {
                 return NextResponse.json({ error: 'Invalid Token', code: 'INVALID_TOKEN' }, { status: 401 });
             }
        }
    } 
    // [2] Session Authentication (Cookie) - Only if no Auth Header
    else {
        // 서버 컴포넌트용 클라이언트 생성 (쿠키 자동 처리)
        const supabase = createClient();
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (user) {
            authenticatedUserId = user.id;
            // console.log(`[API] Session Auth Success User: ${authenticatedUserId}`);
        } else {
            // 세션 없음 -> 인증 실패
            console.warn('[API] No Session found');
            return NextResponse.json({ error: 'Authentication Required (Login or API Key)', code: 'AUTH_REQUIRED' }, { status: 401 });
        }
    }

    // 최종 인증 실패 확인
    if (!authenticatedUserId) {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    let { 
      // user_id는 Body에서 받더라도 무시하고, 인증된 ID를 사용함
      category_id, title, summary, 
      content_text, content, body: bodyContent, text, // Allow various content field names
      description, alt_description, thumbnail_url, rendering_type, custom_data,
      allow_michelin_rating, allow_stickers, allow_secret_comments, scheduled_at, visibility,
      assets, // [New] Assets from editor
      audit_deadline, is_growth_requested // [New] V-Audit advanced fields
    } = body;

    // [Robustness] Normalize Content
    // 외부 에이전트가 어떤 필드로 보내든 content_text로 통합
    let finalContent = content_text || content || bodyContent || text || '';
    
    // 설명이 없고 본문만 있다면 설명을 본문 앞부분으로 대체 (선택적) 또는 반대로 설명만 있다면 본문으로 사용
    if (!finalContent && description) {
        finalContent = description;
    }

    // [Strict] 인증된 사용자 ID가 곧 작성자 ID입니다.
    const user_id = authenticatedUserId;

    // Default category for API usage if missing
    if (isApiContext && !category_id) {
        category_id = 1; 
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required.', code: 'MISSING_TITLE' }, { status: 400 });
    }
    // Content is verified but allowed empty if user intends just a title/image post

    // [Validation] Ensure Profile exists
    const { data: profileExists, error: profileSearchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user_id)
        .single();
    
    if (!profileExists) {
        console.log(`[API] Profile not found for ${user_id}. Attempting auto-creation.`);
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user_id);
        
        if (!authUser) {
            return NextResponse.json({ error: 'Auth User not found', code: 'AUTH_USER_NOT_FOUND' }, { status: 404 });
        }

        const baseName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member';
        const baseAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '/globe.svg';

        const { error: createError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user_id,
                username: baseName,
                nickname: baseName,
                email: authUser.email,
                avatar_url: baseAvatar,
                profile_image_url: baseAvatar,
                points: 1000 
            }, { onConflict: 'id' });
        
        if (createError) {
            console.error('[API] profile auto-creation failed:', createError);
            return NextResponse.json({ error: 'Profile creation failed', details: createError.message }, { status: 500 });
        }
    }

    // [Point System] Growth Mode Check & Points Deduction
    // ... (Point logic omitted for brevity, logic remains same)
    // Assets Handling: Merge into custom_data
    let finalCustomData = custom_data;
    try {
        if (typeof finalCustomData === 'string') finalCustomData = JSON.parse(finalCustomData);
        if (!finalCustomData) finalCustomData = {};
        
        if (assets) {
            finalCustomData.assets = assets;
        }
    } catch (e) {
        finalCustomData = { assets: assets || [] };
    }

    // Point Deduction Logic (Re-implemented for context)
    let isGrowthMode = false;
    if (finalCustomData?.is_feedback_requested) {
        isGrowthMode = true;
    }

    // [Point System] Growth Mode 포인트 차감 로직 비활성화 (USER 요청)
    /*
    if (isGrowthMode) {
        const { data: profile } = await (supabaseAdmin as any)
            .from('profiles').select('points').eq('id', user_id).single();
        
        const currentPoints = profile?.points || 0;
        const COST = 500;

        if (currentPoints < COST) {
            return NextResponse.json({ error: `Not enough points (${currentPoints}/${COST})`, code: 'INSUFFICIENT_POINTS' }, { status: 402 });
        }
        
        await (supabaseAdmin as any).from('profiles').update({ points: currentPoints - COST }).eq('id', user_id);
        await (supabaseAdmin as any).from('point_logs').insert({ user_id: user_id, amount: -COST, reason: 'Growth Mode Project' });
    }
    */

    let { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .insert([{ 
        user_id, category_id, title, summary, 
        content_text: finalContent, // Normalized Content
        description: description || finalContent, // Fallback description
        alt_description,
        thumbnail_url, 
        rendering_type: rendering_type || 'rich_text', 
        custom_data: finalCustomData,
        site_url: finalCustomData?.audit_config?.mediaA || '', // DB 표에서 바로 보이게 추가
        media_type: finalCustomData?.audit_config?.type || 'link', // DB 표에서 바로 보이게 추가
        allow_michelin_rating: allow_michelin_rating ?? true, 
        allow_stickers: allow_stickers ?? true, 
        allow_secret_comments: allow_secret_comments ?? true,
        scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
        visibility: visibility || 'public',
        audit_deadline: audit_deadline ? new Date(audit_deadline).toISOString() : null,
        is_growth_requested: is_growth_requested ?? false,
        likes_count: 0, views_count: 0 
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('Project creation failed:', error);
      return NextResponse.json(
        { error: `Creation failed: ${error.message}` },
        { status: 500 }
      );
    }

    // [New] 표준화된 Fields 매핑 저장
    if (data && data.project_id && custom_data) {
        try {
            const parsedCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            const fieldSlugs = parsedCustom.fields; 

            if (Array.isArray(fieldSlugs) && fieldSlugs.length > 0) {
                const { data: fieldRecords } = await (supabaseAdmin as any)
                    .from('fields')
                    .select('id, slug')
                    .in('slug', fieldSlugs);

                if (fieldRecords && fieldRecords.length > 0) {
                     const mappingData = fieldRecords.map((f: any) => ({
                         project_id: data.project_id,
                         field_id: f.id
                     }));
                     
                     await (supabaseAdmin as any)
                        .from('project_fields') // Changed from project_fields_mapping to project_fields based on GET handler
                        .insert(mappingData);
                }
            }
        } catch (e) {
            console.error('Field mapping error', e); 
            // Mapping 실패가 전체 실패는 아님
        }
    }

    // [New] 복수 카테고리 저장 (project_categories)
    if (data && data.project_id && custom_data) {
        try {
            const parsedCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            const genres = parsedCustom.genres || [];
            const fields = parsedCustom.fields || [];
            
            const categoryMappings: Array<{ project_id: number; category_id: number; category_type: string }> = [];

            // Genres → category_type: 'genre'
            if (Array.isArray(genres) && genres.length > 0) {
                genres.forEach((genreSlug: string) => {
                    const catId = GENRE_TO_CATEGORY_ID[genreSlug];
                    if (catId) {
                        categoryMappings.push({
                            project_id: data.project_id,
                            category_id: catId,
                            category_type: 'genre'
                        });
                    }
                });
            }

            // Fields → category_type: 'field' (필요시 별도 매핑 테이블 사용 가능)
            // 현재는 fields를 태그처럼 저장 (향후 확장 가능)
            if (Array.isArray(fields) && fields.length > 0) {
                // fields는 slug 형태이므로, 필요시 Category 테이블에서 조회하거나
                // 단순히 custom_data에만 저장 (현재 구조 유지)
                // 여기서는 genres만 project_categories에 저장
            }

            if (categoryMappings.length > 0) {
                const { error: catError } = await (supabaseAdmin as any)
                    .from('project_categories')
                    .insert(categoryMappings);

                if (catError) {
                    console.error('[API] Category mappings insert failed:', catError);
                } else {
                    console.log('[API] Category mappings created:', categoryMappings.length);
                }
            }
        } catch (e) {
            console.error('[API] Saving project categories failed:', e);
        }
    }

    // [New] 시리즈(에피소드) 연재 기능
    // 'collection'은 북마크 용도, 'series'는 연재 용도로 구분합니다.
    const { collaborator_emails, series_id, collection_id } = body;
    
    // 1. 시리즈(에피소드)로 추가하는 경우 (우선순위 높음)
    if (data && data.project_id && series_id) {
         try {
             // 소유권 확인
             const { data: collection } = await (supabaseAdmin as any)
                .from('Collection')
                .select('user_id, type')
                .eq('collection_id', series_id)
                .single();
             
             if (collection && collection.user_id === user_id) {
                 // 타입이 'series'가 아니라면 업데이트 (명시적 구분)
                 if (collection.type !== 'series') {
                     await (supabaseAdmin as any)
                        .from('Collection')
                        .update({ type: 'series' })
                        .eq('collection_id', series_id);
                 }

                 // 에피소드 추가
                 await (supabaseAdmin as any)
                    .from('CollectionItem')
                    .insert({ 
                        collection_id: series_id, 
                        project_id: data.project_id 
                    });
                 console.log(`[API] Added project ${data.project_id} to SERIES ${series_id}`);
             } else {
                 console.warn(`[API] Series ${series_id} not found or permission denied`);
             }
         } catch (e) {
             console.error('[API] Failed to add to series:', e);
         }
    }
    // 2. 일반 컬렉션(북마크)에 추가하는 경우 (하위 호환성)
    else if (data && data.project_id && collection_id) {
        try {
             const { data: collection } = await (supabaseAdmin as any)
                .from('Collection')
                .select('user_id')
                .eq('collection_id', collection_id)
                .single();
             
             if (collection && collection.user_id === user_id) {
                 await (supabaseAdmin as any)
                    .from('CollectionItem')
                    .insert({ 
                        collection_id: collection_id, 
                        project_id: data.project_id 
                    });
                 console.log(`[API] Added project ${data.project_id} to Collection ${collection_id}`);
             }
        } catch (e) {
            console.error('[API] Failed to add to collection:', e);
        }
    }

    // [New] 공동 제작자 추가 (Collaborators)
    // const { collaborator_emails } = body; (Moved up)
    if (data && data.project_id && Array.isArray(collaborator_emails) && collaborator_emails.length > 0) {

        try {
             // 이메일로 User ID 조회 (profiles 테이블 사용 가정)
             const { data: users } = await (supabaseAdmin as any)
                .from('profiles')
                .select('id, email') // profiles에 이메일이 있다고 가정 (Trigger로 동기화됨을 전제)
                .in('email', collaborator_emails);
             
             if (users && users.length > 0) {
                 const currentCollaborators = users.map((u: any) => ({
                     project_id: data.project_id,
                     user_id: u.id
                 }));

                 const { error: collabError } = await (supabaseAdmin as any)
                     .from('project_collaborators')
                     .insert(currentCollaborators);
                 
                 if (collabError) console.error('[API] Collaborators insert error:', collabError);
                 else console.log(`[API] Added ${users.length} collaborators.`);
             } else {
                 console.log('[API] No users found for given emails');
             }
        } catch (e) {
            console.error('[API] Failed to add collaborators:', e);
        }
    }

    // [Point System] Reward for Upload (General Projects)
    if (!isGrowthMode && data && data.project_id) {
         try {
             // [New] 일일 보상 한도 체크 (하루 최대 3회)
             const todayStart = new Date();
             todayStart.setHours(0,0,0,0);
             const todayISO = todayStart.toISOString();

             const { count: dailyCount, error: countError } = await (supabaseAdmin as any)
                .from('point_logs')
                .select('*', { count: 'exact', head: true }) // head: true means count only
                .eq('user_id', user_id)
                .eq('reason', '프로젝트 업로드 보상')
                .gte('created_at', todayISO);
             
             if (countError) {
                 console.error('[Point System] Failed to check daily limit:', countError);
             }

             if ((dailyCount || 0) >= 3) {
                 console.log(`[Point System] Daily upload reward limit reached for user ${user_id} (Count: ${dailyCount})`);
             } else {
                 // 1. Get current points
                 const { data: profile } = await (supabaseAdmin as any)
                    .from('profiles')
                    .select('points')
                    .eq('id', user_id)
                    .single();
                 
                 const currentPoints = profile?.points || 0;
                 const REWARD = 100;
    
                 // 2. Add Points

             await (supabaseAdmin as any)
                .from('profiles')
                .update({ points: currentPoints + REWARD })
                .eq('id', user_id);

             // 3. Log
             await (supabaseAdmin as any)
                .from('point_logs')
                .insert({
                    user_id: user_id,
                    amount: REWARD,
                    reason: '프로젝트 업로드 보상'
                });
            
             // 4. Send Notification (Duplicate Issue Fix: Disabled temporarily)
             /*
             await (supabaseAdmin as any)
                .from('notifications')
                .insert({
                    user_id: user_id,
                    type: 'point',
                    title: '내공 획득! 🪙',
                    message: `프로젝트 업로드 보상으로 ${REWARD} 내공을 받았습니다.`,
                    link: '/mypage',
                    read: false
                });
             */
             
             console.log(`[Point System] Awarded ${REWARD} points to user ${user_id} for upload.`);
             } // Close else
         } catch (e) {
             console.error('[Point System] Failed to award upload points:', e);
         }
    }
    
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
