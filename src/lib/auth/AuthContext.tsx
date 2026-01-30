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
  authStatus: string;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<string>("Initializing...");
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const initializedRef = useRef(false);
  const userRef = useRef<User | null>(null); // Fixed: Moved to top level
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

    console.log('[AuthContext] 🛡️ [AUTH_VER_V7] Initializing Auth Pipeline...');
    setAuthStatus("🛡️ [V7] 인증 파이프라인 가동...");

    // Use a flag to wait for the first real auth event before finalizing "none" state
    let firstEventReceived = false;

    const initAuth = async () => {
      try {
        setAuthStatus("🔍 브라우저 쿠키/세션 확인 중...");
        const { data: { session: s }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (s) {
          console.log('[AuthContext] ✅ Found session in storage:', s.user?.email);
          setAuthStatus(`✅ 세션 발견: ${s.user?.email}`);
          userRef.current = s.user;
          await updateState(s, s.user);
          firstEventReceived = true;
          setTimeout(() => setLoading(false), 500);
        } else {
          setAuthStatus("⌛ 대기: 수파베이스 인증 신호를 수신하는 중...");
          console.log('[AuthContext] ⏳ No immediate session. Waiting for event bus/OAuth loop...');
        }
      } catch (e: any) {
        console.error('[AuthContext] Init error:', e);
        const errorMsg = e.message === 'Email not confirmed' 
            ? "⚠️ 이메일 인증이 완료되지 않았습니다. 수파베이스 설정에서 'Confirm Email'을 꺼주세요."
            : e.message || "인증 초기화 중 오류가 발생했습니다.";
        setAuthError(errorMsg);
        setAuthStatus("❌ 오류 발생");
        setLoading(false);
      }
    };

    initAuth();

    // Step 2: Set up the subscriber
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, curSess) => {
      try {
        const u = curSess?.user;
        const eventName = event as any;
        userRef.current = u ?? null;
        console.log(`[AuthContext] 📢 AUTH_EVENT: ${eventName} | User: ${u?.email || 'none'}`);
        setAuthStatus(`📢 인증 신호 수신: ${eventName}...`);
        
        if (eventName === 'SIGNED_IN' || eventName === 'TOKEN_REFRESHED' || eventName === 'INITIAL_SESSION') {
          if (u) {
            // Check if email is confirmed if required
            if (u.aud === 'authenticated' && !u.email_confirmed_at && eventName === 'SIGNED_IN') {
                console.warn('[AuthContext] ⚠️ Email not confirmed for user:', u.email);
            }

            firstEventReceived = true;
            setAuthStatus(`🎉 로그인 성공: ${u.email}`);
            await updateState(curSess, u);
            setLoading(false);
            
            if (eventName === 'SIGNED_IN' && window.location.pathname === '/login') {
              const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';
              router.push(returnTo);
            }
          } else if (eventName === 'INITIAL_SESSION') {
            setAuthStatus("🔍 세션 대기 중 (소셜 로그인 동기화)...");
            setTimeout(async () => {
              if (!userRef.current) {
                   setAuthStatus("🔄 최종 확인: 서버 세션 직접 확인 중...");
                   const { data: { session: finalSess }, error: finalErr } = await supabase.auth.getSession();
                   
                   if (finalErr) {
                       setAuthError(finalErr.message);
                       setLoading(false);
                       return;
                   }

                   if (finalSess) {
                      setAuthStatus("✨ 세션 복구 성공!");
                      userRef.current = finalSess.user;
                      await updateState(finalSess, finalSess.user);
                      firstEventReceived = true;
                      setLoading(false);
                   } else {
                      setAuthStatus("⏹️ 게스트 모드로 시작합니다.");
                      firstEventReceived = true;
                      setLoading(false);
                   }
              } else {
                  setLoading(false);
              }
            }, 4000);
          }
        } else if (eventName === "SIGNED_OUT") {
          setAuthStatus("🚪 로그아웃 완료.");
          firstEventReceived = true;
          userRef.current = null;
          await updateState(null, null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[AuthContext] Event Error:', err);
        setAuthError(err.message);
        setLoading(false);
      }
    });

    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.log('[AuthContext] ⚠️ 장기 대기: 안전 모드로 게스트 전환.');
            setLoading(false);
        }
    }, 15000); // 15 seconds for extreme cases

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [updateState, router]);

  const isAdminUser = React.useMemo(() => {
    return !!(user?.email && ADMIN_EMAILS.includes(user.email)) || userProfile?.role === "admin";
  }, [user?.email, userProfile?.role]);

  const authValue = React.useMemo(() => ({
    user, session, loading, isAuthenticated: !!user, userProfile, isAdmin: isAdminUser, authStatus, authError, signOut, refreshUserProfile
  }), [user, session, loading, userProfile, isAdminUser, authStatus, authError, signOut, refreshUserProfile]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
