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
  const pathname = usePathname();

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

  const updateState = useCallback(async (s: Session | null, u: User | null) => {
    setSession(s);
    setUser(u);
    
    if (u) {
      // Optimistic Update: Set profile from metadata immediately to unblock UI
      const base = loadProfileFromMetadata(u);
      setUserProfile(base);
      setLoading(false); // <--- Critical: Allow UI to render immediately

      try {
        const { data: db, error } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', u.id)
          .single();

        if (error) {
           console.warn("[AuthContext] Profile Fetch Warning:", error.message);
        }

        if (db) {
          const customImage = (db as any).profile_image_url || (db as any).avatar_url;
          
          setUserProfile(prev => ({
            ...prev!, // Safe assertion as we set base above
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
      } catch (e) {
        console.error("[AuthContext] Background profile fetch error:", e);
      }
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [loadProfileFromMetadata]);

  // [New] Realtime Profile Update Listener (Consolidated)
  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel(`profile-updates:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as any;
          if (newProfile) {
            setUserProfile((prev) => {
               if(!prev) return null;
               return { 
                   ...prev, 
                   points: newProfile.points ?? prev.points,
                   gender: newProfile.gender ?? prev.gender,
                   age_group: newProfile.age_group || newProfile.age_range || prev.age_group,
                   age_range: newProfile.age_group || newProfile.age_range || prev.age_range,
                   occupation: newProfile.occupation ?? prev.occupation,
                   expertise: newProfile.expertise ?? prev.expertise,
                   role: newProfile.role ?? prev.role,
                   username: newProfile.username ?? prev.username,
                   nickname: newProfile.nickname ?? newProfile.username ?? prev.nickname,
                   profile_image_url: newProfile.profile_image_url ?? newProfile.avatar_url ?? prev.profile_image_url
               };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setUserProfile(null);
    await supabase.auth.signOut();
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

    // Reliance on onAuthStateChange for initialization is safer and prevents race conditions
    // leading to "AbortError: signal is aborted without reason"
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[AuthContext] Auth Event: ${event}`);
      
      if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
        await updateState(currentSession, currentSession?.user || null);
        
        if (event === 'SIGNED_IN' && currentSession) {
           const guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_id') : null;
           if (guestId) {
              fetch('/api/auth/claim-ratings', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentSession.access_token}`
                    },
                    body: JSON.stringify({ guest_id: guestId })
              }).catch(e => console.error("[Auth] Guest merge failed:", e));
           }

           if (currentSession.user.email && ADMIN_EMAILS.includes(currentSession.user.email)) {
              supabase.from('profiles').select('role').eq('id', currentSession.user.id).single()
              .then(({ data }) => {
                 if (data && data.role !== 'admin') {
                     supabase.from('profiles').update({ role: 'admin' }).eq('id', currentSession.user.id).then(() => {
                         console.log("User auto-promoted to admin");
                         refreshUserProfile();
                     });
                 }
              });
           }
        }
      } else if (event === "SIGNED_OUT") {
        updateState(null, null);
      } else {
        if (currentSession) {
          updateState(currentSession, currentSession.user);
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [updateState, refreshUserProfile]);

  const isAdminUser = React.useMemo(() => {
    return !!(user?.email && ADMIN_EMAILS.includes(user.email)) || userProfile?.role === "admin";
  }, [user?.email, userProfile?.role]);

  const authValue = React.useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userProfile,
    isAdmin: isAdminUser,
    signOut,
    refreshUserProfile
  }), [user, session, loading, userProfile, isAdminUser, signOut, refreshUserProfile]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
