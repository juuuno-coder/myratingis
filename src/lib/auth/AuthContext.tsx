"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/constants";

interface UserProfile {
  username: string;
  nickname?: string;
  profile_image_url: string;
  role: string;
  points?: number;
  interests?: {
    genres: string[];
    fields: string[];
  };
  expertise?: {
    fields: string[];
  };
  gender?: string;
  age_group?: string;
  age_range?: string;
  occupation?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const initializedRef = useRef(false);
  const router = useRouter();

  const loadProfileFromMetadata = useCallback((currentUser: User): UserProfile => {
    const metadata = currentUser.user_metadata || {};
    return {
      username: metadata.full_name || metadata.name || metadata.nickname || currentUser.email?.split("@")[0] || "User",
      profile_image_url: metadata.avatar_url || metadata.picture || "/globe.svg",
      role: currentUser.app_metadata?.role || metadata.role || "user",
      interests: metadata.interests || undefined,
      expertise: metadata.expertise || undefined,
    };
  }, []);

  const lastUpdateIdRef = useRef(0);

  const updateState = useCallback(async (s: Session | null, u: User | null) => {
    const updateId = ++lastUpdateIdRef.current;
    
    try {
      setSession(s);
      setUser(u);
      
      if (u) {
        // Step 1: Immediate optimistic update from metadata
        const base = loadProfileFromMetadata(u);
        setUserProfile(base);
        setLoading(false); 

        // Step 2: Background fetch from DB
        const { data: db, error } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', u.id)
          .single();

        // Only apply DB update if this is still the most recent update request
        if (updateId !== lastUpdateIdRef.current) return;

        if (db) {
          const customImage = (db as any).profile_image_url || (db as any).avatar_url;
          setUserProfile(prev => ({
            ...prev!,
            username: (db as any).username || base.username,
            nickname: (db as any).nickname || (db as any).username || base.username,
            profile_image_url: customImage || base.profile_image_url,
            role: (db as any).role || base.role,
            points: (db as any).points || 0,
            interests: (db as any).interests || base.interests,
            expertise: (db as any).expertise || base.expertise,
            gender: (db as any).gender,
            age_group: (db as any).age_group || (db as any).age_range,
            age_range: (db as any).age_group || (db as any).age_range, 
            occupation: (db as any).occupation,
          }));
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    } catch (e) {
      console.error("[AuthContext] Update state error:", e);
      // Ensure we clear loading even on error, but only if it's the latest update
      if (updateId === lastUpdateIdRef.current) {
        setLoading(false);
      }
    }
  }, [loadProfileFromMetadata]);

  // Realtime listener for profile updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`profile-updates:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
      (payload) => {
        const np = payload.new as any;
        if (np) {
          setUserProfile(p => p ? { ...p, 
            points: np.points ?? p.points, 
            username: np.username ?? p.username,
            nickname: np.nickname ?? np.username ?? p.nickname,
            profile_image_url: np.profile_image_url ?? np.avatar_url ?? p.profile_image_url,
            role: np.role ?? p.role
          } : null);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    router.push("/login");
  }, [router]);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    updateState(session, u);
  }, [user, session, updateState]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Safety fallback: if no event fires within 10 seconds, clear loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, curSess) => {
      console.log(`[AuthContext] Auth Event: ${event}`);
      clearTimeout(safetyTimeout);
      
      if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
        updateState(curSess, curSess?.user || null);
        
        if (event === 'SIGNED_IN' && curSess) {
           const guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_id') : null;
           if (guestId) {
              fetch('/api/auth/claim-ratings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${curSess.access_token}` },
                    body: JSON.stringify({ guest_id: guestId })
              }).catch(() => {});
           }
        }
      } else if (event === "SIGNED_OUT") {
        updateState(null, null);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [updateState]); // Removed loading from deps to avoid re-running if timeout hits

  const isAdminUser = React.useMemo(() => {
    return !!(user?.email && ADMIN_EMAILS.includes(user.email)) || userProfile?.role === "admin";
  }, [user?.email, userProfile?.role]);

  const authValue = React.useMemo(() => ({
    user, session, loading, isAuthenticated: !!user, userProfile, isAdmin: isAdminUser, signOut, refreshUserProfile
  }), [user, session, loading, userProfile, isAdminUser, signOut, refreshUserProfile]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
