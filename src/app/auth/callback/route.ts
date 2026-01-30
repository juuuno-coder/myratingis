import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    console.log('[Auth Callback] Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('[Auth Callback] Success! Redirecting to:', next);
      // 구글 등 소셜 로그인의 경우 이 시점에 email_confirmed_at이 자동으로 박혀야 합니다.
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('[Auth Callback] Error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}
