"use client";
import React, { useEffect, useState } from 'react';

// Reemplaza esto con el ID exacto que le corresponde a esta App en la constante APPS del Hub
const APP_ID = "1:438537482408:web:9d43a0f924ed8d4b04529d";
const HUB_URL = "https://gs.conectachava.com/";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem('auth_token');
    setToken(storedToken);

    if (!storedToken) {
      // Definimos de manera dinámica la ruta de callback de la aplicación actual
      const returnTo = encodeURIComponent(`${window.location.origin}/callback`);

      // Redirigir físicamente al Hub de inicio de sesión centralizado
      window.location.href = `${HUB_URL}?appId=${APP_ID}&returnTo=${returnTo}`;
    }
  }, []);

  // Mientras se comprueba o redirige, se puede mostrar una pantalla de carga sutil
  if (!mounted || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-medium">Redirigiéndote al inicio de sesión seguro...</h3>
        <p className="text-sm text-slate-500 mt-2">Conectando con VSNRY Labs Hub</p>
      </div>
    );
  }

  // Si tiene token, renderiza la sección privada (Dashboard, etc.)
  return <>{children}</>;
}