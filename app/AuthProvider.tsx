"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, getDocs, updateDoc } from "firebase/firestore";
import { UserProfile } from "../components/UserProfileModal";

export interface UserProfileWithStatus extends UserProfile {
  status: "pending" | "approved" | "rejected";
  uid?: string; // Used for admin panel
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  ready: boolean;
  profile: UserProfileWithStatus | null;
  isAdmin: boolean;
  setProfile: (profile: Partial<UserProfileWithStatus>) => Promise<void>;
  retryAuth: () => void;
  forceUnblockLoading: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  ready: false,
  profile: null,
  isAdmin: false,
  setProfile: async () => {},
  retryAuth: () => {},
  forceUnblockLoading: () => {},
});

const defaultProfile: Omit<UserProfileWithStatus, "name" | "email" | "status" | "isLoggedIn"> = {
  preferredFormat: "Análisis",
  customHostVoice: "Paul",
  episodesCount: 0,
  autoArchive: false,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return auth.currentUser;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(true);
  const [profile, setProfileState] = useState<UserProfileWithStatus | null>(() => {
    try {
      const u = auth.currentUser;
      if (u) {
        return {
          ...defaultProfile,
          name: u.isAnonymous ? "Invitado" : u.displayName || u.email?.split("@")[0] || "Usuario",
          email: u.email || "",
          isLoggedIn: true,
          status: "approved",
          uid: u.uid,
        };
      }
    } catch (e) {}
    return null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return auth.currentUser?.email === "vsnrylabs@gmail.com";
    } catch (e) {
      return false;
    }
  });

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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
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
    <AuthContext.Provider value={{ user, loading, ready, profile, isAdmin, setProfile, retryAuth, forceUnblockLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
