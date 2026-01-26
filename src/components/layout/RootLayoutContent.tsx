"use client";

import { usePathname } from "next/navigation";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";

export function RootLayoutContent({ 
  children,
  isReviewServer = false
}: { 
  children: React.ReactNode;
  isReviewServer?: boolean;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isReviewPath = pathname?.includes('review');
  const isReviewSubdomain = typeof window !== 'undefined' && (window.location.hostname.includes('review') || window.location.host.includes('review'));
  
  const isHome = pathname === '/';
  const isReport = pathname?.startsWith('/report');
  const isLogin = pathname === '/login';
  const isSignup = pathname === '/signup';
  
  // Only hide the global layout for very specific specialized views
  const hideLayout = isAdminPage || isReviewPath || isReviewSubdomain || isReviewServer || isHome || isReport || isLogin || isSignup;

  return (
    <div className="flex min-h-screen flex-col relative w-full overflow-x-hidden">
      {!hideLayout && <MyRatingIsHeader />}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto ${hideLayout ? "" : "pt-[60px] pb-20"} fade-in`}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}
