"use client";
import React, { useEffect, useState } from 'react';

export default function AuthCallback() {
  const [status, setStatus] = useState('Sincronizando tus credenciales de acceso...');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Capturar el token seguro que envió el Hub central en los parámetros
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // 2. Almacenar el token localmente para mantener activa la sesión en la App Cliente
      localStorage.setItem('auth_token', token);

      // 3. Limpiar el token de la barra de direcciones por seguridad
      window.history.replaceState({}, document.title, window.location.pathname);

      setStatus('¡Sesión autorizada con éxito! Redirigiendo a tu espacio de trabajo...');

      // 4. Redirigir al panel o dashboard principal
      setTimeout(() => {
        window.location.href = '/'; // Redirigir a la raíz donde está la app principal
      }, 1500);
    } else {
      setStatus('Error de sincronización: No se recibió un token válido de autenticación.');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 font-sans p-4">
      <div className="text-center p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm max-w-md w-full">
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-3">Ecosistema VSNRY Labs</h2>
        <p className="text-slate-600 dark:text-slate-400 text-base">{status}</p>
        
        {status.includes("Error") && (
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Volver a intentar
          </button>
        )}
      </div>
    </div>
  );
}
