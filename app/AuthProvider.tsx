"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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

const defaultProfile: Omit<UserProfileWithStatus, "name" | "email" | "status" | "isLoggedIn"> = {
  preferredFormat: "Análisis",
  customHostVoice: "Paul",
  episodesCount: 0,
  autoArchive: false,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<HubUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);

  const authStatus: AuthStatus = (!ready || loading) ? "checking" : (user ? "authenticated" : "unauthenticated");

  const [profile, setProfileState] = useState<UserProfileWithStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const forceUnblockLoading = React.useCallback(() => {
    setLoading(false);
    setReady(true);
  }, []);

  const retryAuth = React.useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      // Create a mock user from token for now
      const mockUser = { uid: token.substring(0, 20), email: "usuario@vsnrylabs.com", displayName: "Usuario", isAnonymous: false };
      setUser(mockUser);
      setProfileState({
        ...defaultProfile,
        name: "Usuario",
        email: "usuario@vsnrylabs.com",
        isLoggedIn: true,
        status: "pending",
        uid: mockUser.uid,
      });
      setIsAdmin(false);
    } else {
      setUser(null);
      setProfileState(null);
      setIsAdmin(false);
    }
    setLoading(false);
    setReady(true);
  }, []);

  const loginWithGoogle = React.useCallback(async (): Promise<HubUser | null> => {
    const APP_ID = "1:438537482408:web:9d43a0f924ed8d4b04529d";
    const HUB_URL = "https://gs.conectachava.com/";
    const returnTo = encodeURIComponent(`${window.location.origin}/callback`);
    window.location.href = `${HUB_URL}?appId=${APP_ID}&returnTo=${returnTo}`;
    return null;
  }, []);

  const logout = React.useCallback(async () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  }, []);

  useEffect(() => {
    retryAuth();
  }, [retryAuth]);

  const clearAuthCache = React.useCallback(async () => {
    setLoading(true);
    localStorage.removeItem('auth_token');
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
      setProfileState(prev => prev ? { ...prev, ...safeUpdates } : null);
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

