"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, clearFirestoreAuthCache } from "../lib/firebase";
import { UserProfile } from "../components/UserProfileModal";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface UserProfileWithStatus extends UserProfile {
  status: "pending" | "approved" | "rejected";
  uid?: string;
}

export interface HubUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: HubUser | null;
  loading: boolean;
  ready: boolean;
  authStatus: AuthStatus;
  profile: UserProfileWithStatus | null;
  isAdmin: boolean;
  setProfile: (profile: Partial<UserProfileWithStatus>) => Promise<void>;
  loginWithGoogle: () => Promise<HubUser | null>;
  logout: () => Promise<void>;
  retryAuth: () => void;
  forceUnblockLoading: () => void;
  clearAuthCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  ready: false,
  authStatus: "checking",
  profile: null,
  isAdmin: false,
  setProfile: async () => { },
  loginWithGoogle: async () => null,
  logout: async () => { },
  retryAuth: () => { },
  forceUnblockLoading: () => { },
  clearAuthCache: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<HubUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(true);

  const authStatus: AuthStatus = (!ready || loading) ? "checking" : (user ? "authenticated" : "unauthenticated");

  const [profile, setProfileState] = useState<UserProfileWithStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfileState(null);
        setIsAdmin(false);
        setLoading(false);
        setReady(true);
        return;
      }

      const mappedUser: HubUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isAnonymous: firebaseUser.isAnonymous,
      };
      setUser(mappedUser);

      try {
        if (db && firebaseUser.email) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfileWithStatus;
            setProfileState({ ...data, uid: firebaseUser.uid });
          } else {
            const newProfile: UserProfileWithStatus = {
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0] || "Usuario",
              email: firebaseUser.email,
              preferredFormat: "Debate",
              customHostVoice: "Puck",
              episodesCount: 0,
              status: "pending",
            };
            await setDoc(userRef, {
              ...newProfile,
              updatedAt: new Date().toISOString(),
            });
            setProfileState({ ...newProfile, uid: firebaseUser.uid });
          }

          const adminSnap = await getDoc(doc(db, "admins", firebaseUser.uid)).catch(() => null);
          const verifiedOwnerAdmin =
            firebaseUser.email === "vsnrylabs@gmail.com" && firebaseUser.emailVerified === true;
          setIsAdmin(Boolean(verifiedOwnerAdmin || (adminSnap && adminSnap.exists())));
        }
      } catch {
        setProfileState({
          name: firebaseUser.displayName || "Usuario",
          email: firebaseUser.email || "",
          preferredFormat: "Debate",
          customHostVoice: "Puck",
          episodesCount: 0,
          status: "pending",
          uid: firebaseUser.uid,
        });
      } finally {
        setLoading(false);
        setReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const forceUnblockLoading = React.useCallback(() => {
    setLoading(false);
    setReady(true);
  }, []);

  const retryAuth = React.useCallback(() => {
    setUser(null);
    setProfileState(null);
    setIsAdmin(false);
    setLoading(false);
    setReady(true);
  }, []);

  const loginWithGoogle = React.useCallback(async (): Promise<HubUser | null> => {
    if (!auth) return null;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const mapped: HubUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        isAnonymous: fbUser.isAnonymous,
      };
      setUser(mapped);
      return mapped;
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  const logout = React.useCallback(async () => {
    localStorage.removeItem("auth_token");
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    setUser(null);
    setProfileState(null);
    setIsAdmin(false);
    router.replace("/");
  }, [router]);

  const clearAuthCache = React.useCallback(async () => {
    setLoading(true);
    localStorage.removeItem("auth_token");
    await clearFirestoreAuthCache().catch(() => false);
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    setUser(null);
    setProfileState(null);
    setIsAdmin(false);
    setLoading(false);
    setReady(true);
  }, []);

  const setProfile = React.useCallback(async (updates: Partial<UserProfileWithStatus>) => {
    if (user && profile) {
      const safeUpdates = { ...updates };
      delete safeUpdates.status;
      delete safeUpdates.uid;
      delete safeUpdates.isLoggedIn;
      const nextProfile = { ...profile, ...safeUpdates };
      setProfileState(nextProfile);
      if (db && user.uid) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              name: nextProfile.name,
              email: nextProfile.email,
              preferredFormat: nextProfile.preferredFormat,
              customHostVoice: nextProfile.customHostVoice,
              episodesCount: nextProfile.episodesCount,
              status: profile.status,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {
          // Ignore Firestore update errors if user profile rule restricts update
        }
      }
    }
  }, [user, profile]);

  const contextValue = React.useMemo(() => ({
    user, loading, ready, authStatus, profile, isAdmin, setProfile, loginWithGoogle, logout, retryAuth, forceUnblockLoading, clearAuthCache
  }), [user, loading, ready, authStatus, profile, isAdmin, setProfile, loginWithGoogle, logout, retryAuth, forceUnblockLoading, clearAuthCache]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

