"use client";

import { usePathname } from "next/navigation";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Footer } from "@/components/Footer";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function RootLayoutContent({ 
  children,
  isReviewServer = false
}: { 
  children: React.ReactNode;
  isReviewServer?: boolean;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdminPage = pathname?.startsWith('/admin');
  const isReviewPath = pathname?.includes('review');
  
  // These checks might differ between server and client, so we gate them with 'mounted'
  const isReviewSubdomain = mounted && typeof window !== 'undefined' && (window.location.hostname.includes('review') || window.location.host.includes('review'));
  
  const isReport = pathname?.startsWith('/report');
  
  const { loading: authLoading, authStatus, authError } = useAuth();

  // Only hide the global layout for very specific specialized views (review viewer, reports, admin)
  const hideLayout = isAdminPage || isReviewPath || isReviewSubdomain || isReviewServer || isReport;

  // Prevent flash or mismatch during hydration
  if (!mounted) {
    return <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden bg-[#050505]">{children}</div>;
  }

  // Show a professional loading overlay with transparency during auth check
  if (authLoading && !hideLayout && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6 text-center select-none font-pretendard">
        <div className="relative group flex flex-col items-center max-w-sm w-full">
            {/* Spinning Indicator */}
            <div className="relative mb-12">
                <div className="w-20 h-20 border-2 border-orange-500/5 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-t-2 border-orange-500 rounded-full animate-spin shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
            </div>

            <div className="space-y-6 w-full">
                <div className="space-y-2">
                    <p className="text-chef-text font-black italic uppercase tracking-[0.4em] text-sm animate-pulse">
                        Authentication Center
                    </p>
                    <div className="h-[1px] w-12 bg-orange-500/30 mx-auto" />
                </div>

                {/* Status Message */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                    <p className="text-chef-text text-sm font-bold opacity-80 leading-relaxed mb-1">
                        {authStatus}
                    </p>
                    <p className="text-[10px] text-chef-text opacity-30 font-bold uppercase tracking-widest">
                        System Status • Live Updates
                    </p>
                </div>

                {/* Error Message (if any) */}
                {authError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-red-400 text-xs font-bold mb-2">Something went wrong</p>
                        <p className="text-red-400/60 text-[10px] leading-relaxed">{authError}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-3 text-[10px] font-black text-red-400 uppercase tracking-widest border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all"
                        >
                            Retry Request
                        </button>
                    </div>
                )}

                <div className="pt-4">
                    <p className="text-chef-text opacity-20 text-[9px] font-bold uppercase tracking-[0.2em]">
                        Your credentials are being secured • Please wait
                    </p>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col relative w-full overflow-x-hidden">
      {!hideLayout && <MyRatingIsHeader />}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto ${hideLayout ? "" : "pt-20 pb-20"} fade-in`}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
