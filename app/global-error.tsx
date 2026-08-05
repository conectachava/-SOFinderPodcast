'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-white flex items-center justify-center min-h-screen p-6 text-center font-sans">
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-bold">Algo salió mal</h2>
          <p className="text-sm text-slate-400">{error?.message || 'Error inesperado'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
