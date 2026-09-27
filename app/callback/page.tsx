"use client";
import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

function subscribeToLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function hasHubToken() {
  return new URLSearchParams(window.location.search).has('token');
}

export default function AuthCallback() {
  const router = useRouter();
  const tokenReceived = useSyncExternalStore(subscribeToLocation, hasHubToken, () => false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token || !tokenReceived) return;

    localStorage.setItem('auth_token', token);
    window.history.replaceState({}, document.title, window.location.pathname);
    router.replace('/');
  }, [router, tokenReceived]);

  const status = tokenReceived
    ? 'Token recibido. La identidad requiere verificación del servidor antes de autorizar acceso.'
    : 'Error de sincronización: No se recibió un token del Hub.';

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 font-sans p-4">
      <div className="text-center p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm max-w-md w-full">
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-3">Ecosistema VSNRY Labs</h2>
        <p className="text-slate-600 dark:text-slate-400 text-base">{status}</p>

        {!tokenReceived && (
          <button
            onClick={() => router.replace('/')}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Volver a intentar
          </button>
        )}
      </div>
    </div>
  );
}
