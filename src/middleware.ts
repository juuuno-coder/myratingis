import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // [Debug] Log incoming request
  console.log(`[Middleware] Processing request: ${request.nextUrl.pathname}`);
  console.log(`[Middleware] Env Check - URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}, Key: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if needed
    // Skip this on the callback route where the exchange is handled specifically
    if (!request.nextUrl.pathname.startsWith('/auth/callback')) {
      await supabase.auth.getUser();
    }

  } catch (e) {
    // If Supabase client fails (e.g. env vars missing during build time for static generation),
    // don't block the request. Just proceed.
    console.error(`[Middleware] Supabase Error for ${request.nextUrl.pathname}:`, e);
  }

  // --- Optional: Domain Rewrite Logic (Keep if needed, simplify if risky) ---
  /*
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');
  if (hostname === 'review.vibefolio.net') {
     // ... logic ...
  }
  */

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
