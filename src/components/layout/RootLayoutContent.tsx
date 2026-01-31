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

  // Show a professional loading overlay with transparency during auth check
  if (authLoading && !hideLayout && pathname !== '/login' && pathname !== '/signup') {
    // User requested to hide the loading screen ("Authentication Center")
    // We keep the logic to prevent children rendering until auth is done, but show a blank screen.
    return <div className="min-h-screen bg-[#050505]" />;
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
