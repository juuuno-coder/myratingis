import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;
  
  if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
  }

  if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Verify Ownership
    const { data: project } = await supabaseAdmin
        .from('Project')
        .select('user_id, custom_data')
        .eq('project_id', projectId)
        .single();
    
    if (!project || project.user_id !== userId) {
        // Collaborator check logic could be added here
        return NextResponse.json({ error: "Forbidden: You are not the owner." }, { status: 403 });
    }

    // 2. Fetch Ratings with Profiles
    const { data: ratings, error: ratingError } = await supabaseAdmin
      .from("ProjectRating")
      .select("*, profile:profiles(username, expertise, occupation, age_group, gender)")
      .eq("project_id", projectId);

    if (ratingError) throw ratingError;

    // 3. Fetch Polls
    const { data: votes, error: voteError } = await supabaseAdmin
      .from("ProjectPoll")
      .select("*")
      .eq("project_id", projectId);

    // 4. Aggregation Logic
    const totalCount = ratings?.length || 0;
    
    // Dynamic Categories from Project Config
    const customConfig = project.custom_data?.audit_config || project.custom_data?.custom_categories;
    const catIds = customConfig?.categories?.map((c: any) => c.id) || ['score_1', 'score_2', 'score_3', 'score_4'];
    
    let averages: Record<string, number> = {};
    let totalAvg = 0;

    // Expertise Distribution
    const expertiseStats: Record<string, number> = {};
    const occupationStats: Record<string, number> = {};

    if (totalCount > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      ratings?.forEach((curr: any) => {
          catIds.forEach((id: string) => {
              sums[id] += (Number(curr[id]) || 0);
          });

          // Aggregate Expertise
          const exp = (curr.profile as any)?.expertise?.fields || [];
          exp.forEach((field: string) => {
              expertiseStats[field] = (expertiseStats[field] || 0) + 1;
          });

          // Aggregate Occupation
          const occ = (curr.profile as any)?.occupation;
          if (occ) {
              occupationStats[occ] = (occupationStats[occ] || 0) + 1;
          }
      });

      catIds.forEach((id: string) => {
          averages[id] = Number((sums[id] / totalCount).toFixed(1));
      });
      
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / catIds.length).toFixed(1));
    }

    // Poll Aggregation
    const voteCounts: Record<string, number> = {};
    if (votes) {
        votes.forEach((v: any) => {
            voteCounts[v.vote_type] = (voteCounts[v.vote_type] || 0) + 1;
        });
    }

    // Feedback Comments (Proposal & Custom Answers)
    const feedbacks = ratings?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        guest_id: r.guest_id,
        username: (r.profile as any)?.username || (r.user_id ? "Expert" : "Guest"),
        expertise: (r.profile as any)?.expertise?.fields || [],
        occupation: (r.profile as any)?.occupation,
        age_group: (r.profile as any)?.age_group,
        gender: (r.profile as any)?.gender,
        score: r.score,
        proposal: r.proposal,
        custom_answers: r.custom_answers,
        created_at: r.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      report: {
        totalReviewers: totalCount,
        michelin: {
          averages,
          totalAvg,
          count: totalCount
        },
        polls: voteCounts,
        feedbacks: feedbacks,
        expertiseDistribution: expertiseStats,
        occupationDistribution: occupationStats
      }
    });

  } catch (err: any) {
    console.error("Report fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
