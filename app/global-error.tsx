'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-white font-sans flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Ha ocurrido un error inesperado</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {error?.message || 'Error del sistema en el nivel superior.'}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Reintentar Carga
          </button>
        </div>
      </body>
    </html>
  );
}
