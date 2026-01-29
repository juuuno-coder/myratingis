import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const body = await req.json();
    
    // Sanitize payload
    const updatePayload = {
        id: user.id,
        updated_at: new Date().toISOString(),
        username: body.nickname, // Added username
        nickname: body.nickname, // Added nickname for consistency
        gender: body.gender,
        age_group: body.age_group,
        occupation: body.occupation,
        expertise: body.expertise ? (typeof body.expertise === 'object' ? body.expertise : { fields: [] }) : { fields: [] },
    };

    console.log('[API] Updating Profile:', user.id, updatePayload);

    // 1. Try Update first
    const { error: updateError, data } = await supabase
       .from('profiles')
       .update(updatePayload)
       .eq('id', user.id)
       .select('id');

    if (updateError) {
        console.error('[API] Update failed:', updateError);
        throw updateError;
    }
    
    // 2. If no data returned, row might not exist -> Upsert
    if (!data || data.length === 0) {
         console.log('[API] Profile missing, attempting Upsert...');
         const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(updatePayload)
            .select('id');
         
         if (upsertError) {
             console.error('[API] Upsert failed:', upsertError);
             throw upsertError;
         }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[API] Profile Update Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
