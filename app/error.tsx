'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ha ocurrido un error en la aplicación</h2>
      <p className="text-xs text-slate-500 mb-4">{error?.message || 'Error inesperado'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 cursor-pointer"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
