import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery', 'signup', 'invite' 등
  const next = searchParams.get('next') // 리다이렉트 URL
  
  // 해시 파라미터에서 토큰 추출 (Supabase가 # 뒤에 토큰을 붙이는 경우)
  // 참고: 서버에서는 hash를 직접 읽을 수 없으므로, 클라이언트 처리 필요
  
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
      // 성공 시 메인으로 이동 (또는 next 파라미터)
      const redirectUrl = new URL(next || '/', origin)
      
      // 비밀번호 재설정 요청인 경우 -> /reset-password로 리다이렉트
      if (type === 'recovery') {
        const recoveryUrl = new URL('/reset-password', origin)
        return NextResponse.redirect(recoveryUrl)
      }

      return NextResponse.redirect(redirectUrl)
    }
  }

  // 코드가 없거나 세션이 없는 경우
  const errorUrl = new URL('/login', origin)
  errorUrl.searchParams.set('error', 'auth_callback_failed')
  errorUrl.searchParams.set('reason', 'no_session')
  return NextResponse.redirect(errorUrl)
}

