import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`
  
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery', 'signup', 'invite' 등
  const next = searchParams.get('next') // 리다이렉트 URL
  
  // 해시 파라미터에서 토큰 추출 (Supabase가 # 뒤에 토큰을 붙이는 경우)
  // 참고: 서버에서는 hash를 직접 읽을 수 없으므로, 클라이언트 처리 필요
  
    const redirectPath = next || '/';
    // Ensure redirectPath is absolute within the same origin if it's not a full URL
    const finalUrl = redirectPath.startsWith('http') 
      ? redirectPath 
      : `${origin}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`;

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
      
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Exchange Error:', error);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }
  
      if (session) {
        // 성공 시 리다이렉트
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/reset-password`)
        }
        return NextResponse.redirect(finalUrl)
      }
    }

  // 코드가 없거나 세션이 없는 경우
  const errorUrl = new URL('/login', origin)
  errorUrl.searchParams.set('error', 'auth_callback_failed')
  errorUrl.searchParams.set('reason', 'no_session')
  return NextResponse.redirect(errorUrl)
}

