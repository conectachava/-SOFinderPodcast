"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, db, clearFirestoreAuthCache } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "../components/UserProfileModal";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface UserProfileWithStatus extends UserProfile {
  status: "pending" | "approved" | "rejected";
  uid?: string; // Used for admin panel
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  ready: boolean;
  authStatus: AuthStatus;
  profile: UserProfileWithStatus | null;
  isAdmin: boolean;
  setProfile: (profile: Partial<UserProfileWithStatus>) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
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
  setProfile: async () => {},
  loginWithGoogle: async () => null,
  logout: async () => {},
  retryAuth: () => {},
  forceUnblockLoading: () => {},
  clearAuthCache: async () => {},
});

const defaultProfile: Omit<UserProfileWithStatus, "name" | "email" | "status" | "isLoggedIn"> = {
  preferredFormat: "Análisis",
  customHostVoice: "Paul",
  episodesCount: 0,
  autoArchive: false,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);

  const authStatus: AuthStatus = (!ready || loading) ? "checking" : (user ? "authenticated" : "unauthenticated");

  const [profile, setProfileState] = useState<UserProfileWithStatus | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const forceUnblockLoading = () => {
    setLoading(false);
    setReady(true);
  };

  const retryAuth = () => {
    try {
      const currentUser = auth.currentUser;
      setUser(currentUser);
      if (currentUser) {
        setProfileState({
          ...defaultProfile,
          name: currentUser.isAnonymous
            ? "Invitado"
            : currentUser.displayName || currentUser.email?.split("@")[0] || "Usuario",
          email: currentUser.email || "",
          isLoggedIn: true,
          status: "approved",
          uid: currentUser.uid,
        });
      }
    } catch (e) {
      console.warn("retryAuth notice:", e);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (
          popupErr?.code === "auth/popup-blocked" ||
          popupErr?.code === "auth/cancelled-popup-request"
        ) {
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw popupErr;
      }
      if (result?.user) {
        setUser(result.user);
        return result.user;
      }
      return null;
    } catch (error) {
      console.error("Google Auth error:", error);
      throw error;
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfileState(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Safety fallback timer if Firebase Auth initialization hangs or takes unusually long
    const safetyTimer = setTimeout(() => {
      console.log("[AuthProvider] Auth initialization timeout fallback reached.");
      setLoading(false);
      setReady(true);
    }, 2500);

    // Process redirect result if returning from a Google OAuth redirect flow
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.warn("Redirect auth result notice:", error);
      });

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        clearTimeout(safetyTimer);
        setUser(currentUser);
        setLoading(false);
        setReady(true);

        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (currentUser) {
          const isUserAdmin = currentUser.email === "vsnrylabs@gmail.com";
          setIsAdmin(isUserAdmin);

          setProfileState((prev) => {
            if (prev && prev.uid === currentUser.uid) return prev;
            return {
              ...defaultProfile,
              name: currentUser.isAnonymous
                ? "Invitado"
                : currentUser.displayName || currentUser.email?.split("@")[0] || "Usuario",
              email: currentUser.email || "",
              isLoggedIn: true,
              status: "approved",
              uid: currentUser.uid,
            };
          });

          try {
            const adminDocRef = doc(db, "admins", currentUser.uid);
            getDoc(adminDocRef)
              .then((adminSnap) => {
                if (adminSnap.exists()) {
                  setIsAdmin(true);
                }
              })
              .catch(() => {});

            const userDocRef = doc(db, "users", currentUser.uid);
            unsubscribeProfile = onSnapshot(
              userDocRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  setProfileState({
                    ...(docSnap.data() as UserProfileWithStatus),
                    isLoggedIn: true,
                    uid: currentUser.uid,
                  });
                } else {
                  const newProfile: UserProfileWithStatus = {
                    ...defaultProfile,
                    name: currentUser.isAnonymous
                      ? "Invitado"
                      : currentUser.displayName || currentUser.email?.split("@")[0] || "Usuario",
                    email: currentUser.email || "",
                    isLoggedIn: true,
                    status: "approved",
                  };
                  setDoc(userDocRef, {
                    ...newProfile,
                    updatedAt: serverTimestamp(),
                  }).catch(() => {});
                }
              },
              () => {}
            );
          } catch (err) {
            console.warn("Auth background sync notice:", err);
          }
        } else {
          setProfileState(null);
          setIsAdmin(false);
        }
      },
      (error) => {
        console.warn("Auth state error:", error);
        setLoading(false);
        setReady(true);
      }
    );

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const clearAuthCache = async () => {
    setLoading(true);
    try {
      await clearFirestoreAuthCache();
      setUser(null);
      setProfileState(null);
      setIsAdmin(false);
    } catch (e) {
      console.warn("clearAuthCache notice:", e);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const setProfile = async (updates: Partial<UserProfileWithStatus>) => {
    if (user && profile) {
      const userDocRef = doc(db, "users", user.uid);
      const safeUpdates = { ...updates };
      delete safeUpdates.status; // Prevent users from updating their own status
      delete safeUpdates.isLoggedIn;
      delete safeUpdates.uid;
      
      await setDoc(userDocRef, { ...safeUpdates, status: profile.status, updatedAt: serverTimestamp() }, { merge: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, ready, authStatus, profile, isAdmin, setProfile, loginWithGoogle, logout, retryAuth, forceUnblockLoading, clearAuthCache }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

