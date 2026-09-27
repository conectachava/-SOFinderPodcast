"use client";
import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

// Reemplaza esto con el ID exacto que le corresponde a esta App en la constante APPS del Hub
const APP_ID = "1:438537482408:web:9d43a0f924ed8d4b04529d";
const HUB_URL = "https://gs.conectachava.com/";

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getStoredToken() {
  return localStorage.getItem('auth_token');
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToStorage, getStoredToken, () => null);

  useEffect(() => {
    if (!token) {
      const returnTo = encodeURIComponent(`${window.location.origin}/callback`);
      window.location.assign(`${HUB_URL}?appId=${APP_ID}&returnTo=${returnTo}`);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-medium">Redirigiéndote al inicio de sesión seguro...</h3>
        <p className="text-sm text-slate-500 mt-2">Conectando con VSNRY Labs Hub</p>
      </div>
    );
  }

  // Token presence controls only this UI route; it is not server authentication.
  return <>{children}</>;
}