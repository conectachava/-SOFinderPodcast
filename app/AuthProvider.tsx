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
  profile: UserProfileWithStatus | null;
  isAdmin: boolean;
  setProfile: (profile: Partial<UserProfileWithStatus>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  isAdmin: false,
  setProfile: async () => {},
});

const defaultProfile: Omit<UserProfileWithStatus, "name" | "email" | "status" | "isLoggedIn"> = {
  preferredFormat: "Análisis",
  customHostVoice: "Paul",
  episodesCount: 0,
  autoArchive: false,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfileState] = useState<UserProfileWithStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if admin
        let isUserAdmin = currentUser.email === 'vsnrylabs@gmail.com';
        const adminDocRef = doc(db, "admins", currentUser.uid);
        getDoc(adminDocRef).then((adminSnap) => {
          setIsAdmin(isUserAdmin || adminSnap.exists());
        }).catch((err) => {
          console.error(err);
          setIsAdmin(isUserAdmin);
        });

        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfileState({ ...(docSnap.data() as UserProfileWithStatus), isLoggedIn: true, uid: currentUser.uid });
          } else {
            // Create default profile as pending
            const newProfile: UserProfileWithStatus = {
              ...defaultProfile,
              name: currentUser.displayName || "Usuario",
              email: currentUser.email || "",
              isLoggedIn: true,
              status: "pending",
            };
            setDoc(userDocRef, { ...newProfile, updatedAt: serverTimestamp() }).catch(console.error);
            setProfileState({ ...newProfile, uid: currentUser.uid });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching profile", error);
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setProfileState(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
    <AuthContext.Provider value={{ user, loading, profile, isAdmin, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
