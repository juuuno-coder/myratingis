import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: 'sb-auth-token'
        },
        cookieOptions: {
          name: 'sb-auth-token',
          path: '/',
          sameSite: 'lax',
          secure: true
        }
      }
    );
  }
  return supabaseInstance;
}

export const supabase = createClient();
