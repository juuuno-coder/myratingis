import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guest_id } = await req.json();
    if (!guest_id) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
    }

    // 1. Find all ratings belonging to this guest_id
    const { data: guestRatings } = await supabaseAdmin
      .from('ProjectRating')
      .select('id, project_id')
      .eq('guest_id', guest_id);

    if (guestRatings && guestRatings.length > 0) {
      for (const rating of guestRatings) {
        // Check if user already has a rating for this project
        const { data: userRating } = await supabaseAdmin
          .from('ProjectRating')
          .select('id')
          .eq('project_id', rating.project_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userRating) {
          // User already has a rating, delete the guest one (user's logged in rating wins)
          await supabaseAdmin
            .from('ProjectRating')
            .delete()
            .eq('id', rating.id);
        } else {
          // Claim the guest rating
          await supabaseAdmin
            .from('ProjectRating')
            .update({ 
              user_id: user.id,
              guest_id: null 
            })
            .eq('id', rating.id);
        }
      }
    }

    // 2. [Optional] Same for Comments if needed, but usually ratings are enough
    await supabaseAdmin
      .from('Comment')
      .update({ user_id: user.id })
      .eq('guest_id', guest_id);

    return NextResponse.json({ success: true, merged_count: guestRatings?.length || 0 });

  } catch (error: any) {
    console.error('[API] Claim Ratings Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
