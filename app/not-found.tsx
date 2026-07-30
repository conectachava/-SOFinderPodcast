import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-bold text-lg mb-4 text-slate-300">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Página no encontrada</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        La ruta que intentas acceder no existe en SourceFinder Pod.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
      >
        Volver al Orquestador Principal
      </Link>
    </div>
  );
}
