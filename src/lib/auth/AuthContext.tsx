"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider, db, storage } from "@/lib/firebase/client"; // db added
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"; // firestore methods
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  userProfile: any; // Added for compatibility
  isAdmin: boolean; // Added for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Local profile state
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("[AuthContext] 🔥 Firebase Auth Initializing...");
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log(`[AuthContext] 🔥 Auth State Changed: ${currentUser ? currentUser.email : "No User"}`);
      
      if (currentUser) {
        // Sync user to Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          const profileData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLogin: serverTimestamp(),
          };

          if (!userSnap.exists()) {
             // 1. Check for legacy migration data
             let legacyData: any = {};
             if (currentUser.email) {
                try {
                    const legacySnap = await getDoc(doc(db, "legacy_users", currentUser.email));
                    if (legacySnap.exists()) {
                        console.log(`[AuthContext] ♻️ Restore legacy user data found for ${currentUser.email}`);
                        legacyData = legacySnap.data();
                    }
                } catch (err) {
                    console.warn("[AuthContext] Legacy check failed", err);
                }
             }

             // 2. Create new user record with merged data
             const newUserData = {
               ...profileData,
               createdAt: serverTimestamp(),
               role: legacyData.role || 'user',
               points: legacyData.points || 0,
               nickname: legacyData.nickname || currentUser.displayName || "",
               // Merge other legacy fields if needed
               ...legacyData
             };

             await setDoc(userRef, newUserData);
             setUserProfile(newUserData);
             
             if (Object.keys(legacyData).length > 0) {
                 toast("기존 회원 정보를 성공적으로 불러왔습니다! 🎉");
             }

          } else {
             // Update existing user (sync latest Google info)
             await setDoc(userRef, profileData, { merge: true });
             setUserProfile(userSnap.data());
          }
        } catch (e) {
          console.error("Error syncing user to Firestore:", e);
        }
      } else {
        setUserProfile(null);
      }

      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("[AuthContext] 🔥 Auth Error:", error);
      setAuthError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error: any) {
      console.error("Login Failed", error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error: any) {
      console.error("Logout Failed", error);
    }
  };

  /* Firebase Migration: Cleaned up context values */
  const isAdmin = userProfile?.role === 'admin' || user?.email === 'design@designdlab.co.kr'; // Temporary hardcode

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user, 
      signInWithGoogle, 
      signOut, 
      authError,
      userProfile,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
