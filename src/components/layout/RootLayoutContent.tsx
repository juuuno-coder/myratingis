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
  
  const { loading: authLoading } = useAuth();

  // Only hide the global layout for very specific specialized views (review viewer, reports, admin)
  const hideLayout = isAdminPage || isReviewPath || isReviewSubdomain || isReviewServer || isReport;

  // Prevent flash or mismatch during hydration
  if (!mounted) {
    return <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden bg-[#050505]">{children}</div>;
  }

  // Show a premium loading overlay during the initial 5-second auth check
  if (authLoading && !hideLayout && pathname === '/') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] selection:bg-orange-500/30">
        <div className="relative group flex flex-col items-center">
            {/* Logo placeholder or Spinner */}
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mb-8" />
            <div className="flex flex-col items-center gap-2">
                <p className="text-chef-text font-black italic uppercase tracking-[0.3em] text-sm animate-pulse">Initializing Kitchen State...</p>
                <p className="text-chef-text opacity-30 text-[10px] font-bold uppercase tracking-widest">Checking your professional credentials</p>
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
