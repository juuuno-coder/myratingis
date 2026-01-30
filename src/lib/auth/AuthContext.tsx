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

    console.log('[AuthContext] 🛡️ [AUTH_VER_V3] Initializing Auth Pipeline...');

    // Use a flag to wait for the first real auth event before finalizing "none" state
    let firstEventReceived = false;

    const initAuth = async () => {
      try {
        console.log('[AuthContext] 🔍 Checking initial storage session...');
        const { data: { session: s } } = await supabase.auth.getSession();
        
        if (s) {
          console.log('[AuthContext] ✅ Found session in storage:', s.user?.email);
          await updateState(s, s.user);
          firstEventReceived = true;
        } else {
          console.log('[AuthContext] ⏳ No immediate session. Waiting for event bus/OAuth loop...');
        }
      } catch (e) {
        console.error('[AuthContext] Init error:', e);
        setLoading(false);
      }
    };

    initAuth();

    // Step 2: Set up the subscriber
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, curSess) => {
      const u = curSess?.user;
      const eventName = event as any;
      console.log(`[AuthContext] 📢 AUTH_EVENT: ${eventName} | User: ${u?.email || 'none'}`);
      
      if (eventName === 'SIGNED_IN' || eventName === 'TOKEN_REFRESHED' || eventName === 'INITIAL_SESSION') {
        if (u) {
          firstEventReceived = true;
          await updateState(curSess, u);
          
          if (eventName === 'SIGNED_IN' && window.location.pathname === '/login') {
            const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';
            router.push(returnTo);
          }
        } else if (eventName === 'INITIAL_SESSION') {
          // If no user on INITIAL_SESSION, we can conclude loading unless SIGNED_IN is coming
          console.log('[AuthContext] ⏹️ INITIAL_SESSION concludes: No user.');
          firstEventReceived = true;
          setLoading(false);
        }
      } else if (eventName === "SIGNED_OUT") {
        firstEventReceived = true;
        await updateState(null, null);
        setLoading(false);
      } else {
        if (!firstEventReceived && eventName !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    });

    const safetyTimer = setTimeout(() => {
        if (!firstEventReceived) {
            console.log('[AuthContext] ⚠️ Safety timeout: Breaking loading state.');
            setLoading(false);
        }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [updateState, router]);

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
