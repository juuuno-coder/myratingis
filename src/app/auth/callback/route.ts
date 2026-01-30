import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // 1. Create a placeholder response for redirect
    const response = NextResponse.redirect(`${origin}${next}`)
    
    // 2. Create the Supabase client that writes directly to the RESPONSE object
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Write to both cookies store and response
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // 3. Exchange the code for a session
    console.log('[Auth Callback] 🔄 Code exchange for session starting...');
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('[Auth Callback] ✅ Exchange success! Returning response with set-cookie headers.');
      return response
    }
    
    console.error('[Auth Callback] ❌ Exchange error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}
