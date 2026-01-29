import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import ProjectsClient from './ProjectsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '평가 참여하기 | 제 평가는요?',
  description: '다양한 프로젝트를 심사하고 나만의 피드백을 남겨보세요.',
};

export const revalidate = 0;

export default async function ProjectsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const mode = searchParams.mode || 'audit';
  
  // 1. Get Auth Session on Server
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // 2. Initial Projects Fetch
  let query = (supabaseAdmin as any)
    .from('Project')
    .select(`
      project_id, title, thumbnail_url, views_count, likes_count, rating_count, 
      created_at, user_id, category_id, summary, description, custom_data, 
      audit_deadline, site_url, visibility, scheduled_at, is_growth_requested,
      User:profiles(username, avatar_url, nickname)
    `) 
    .is('deleted_at', null)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  const nowISO = new Date().toISOString();
  query = query.or(`scheduled_at.is.null,scheduled_at.lte.${nowISO}`);

  if (mode === 'audit') {
    query = query.not('custom_data->audit_config', 'is', null);
  }

  const { data: rawProjects, count } = await query;
  const initialProjects = rawProjects || [];

  // 3. Fetch Social State for the user if logged in (Parallel with initial fetch is better but this is simpler for SSR)
  if (currentUserId && initialProjects.length > 0) {
    const projectIds = initialProjects.map((p: any) => p.project_id);
    const [ratings, likes, bookmarks] = await Promise.all([
        supabaseAdmin.from('ProjectRating').select('project_id').eq('user_id', currentUserId).in('project_id', projectIds),
        supabaseAdmin.from('ProjectLike').select('project_id').eq('user_id', currentUserId).in('project_id', projectIds),
        supabaseAdmin.from('CollectionItem').select('project_id, Collection!inner(user_id)').eq('Collection.user_id', currentUserId).in('project_id', projectIds)
    ]);

    const ratedSet = new Set(ratings.data?.map((r: any) => r.project_id));
    const likedSet = new Set(likes.data?.map((l: any) => l.project_id));
    const bookmarkedSet = new Set(bookmarks.data?.map((b: any) => b.project_id));

    initialProjects.forEach((p: any) => {
        p.has_rated = ratedSet.has(p.project_id);
        p.is_liked = likedSet.has(p.project_id);
        p.is_bookmarked = bookmarkedSet.has(p.project_id);
    });
  }

  return (
    <ProjectsClient 
      initialProjects={initialProjects} 
      initialTotal={count || 0} 
    />
  );
}
