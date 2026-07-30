"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-red-950/60 border border-red-800 rounded-xl flex items-center justify-center font-bold text-lg mb-4 text-red-400">
        !
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">Error en el Sistema</h1>
      <p className="text-xs font-mono text-slate-400 max-w-md mb-6 bg-slate-900 p-3 rounded border border-slate-800 text-left overflow-auto max-h-32">
        {error?.message || "Ocurrió un error inesperado al procesar la solicitud."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
      >
        Reintentar Carga
      </button>
    </div>
  );
}
