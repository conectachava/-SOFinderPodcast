"use client";

import React, { useState, useEffect } from "react";
import { Radio, ShieldCheck, Sparkles, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { clearFirestoreAuthCache } from "@/lib/firebase";

interface SkeletonDashboardLoaderProps {
  onClearCache?: () => void;
  onForceUnblock?: () => void;
}

export function SkeletonDashboardLoader({
  onClearCache,
  onForceUnblock,
}: SkeletonDashboardLoaderProps) {
  const [showStuckNotice, setShowStuckNotice] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // If stuck in checking state for more than 2 seconds, display the cache clearance recovery prompt
    const timer = setTimeout(() => {
      setShowStuckNotice(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearFirestoreAuthCache();
      if (onClearCache) {
        onClearCache();
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error("Error clearing auth cache:", e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Skeleton Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 px-4 md:px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-500/50 text-white font-bold text-sm shadow-md">
            <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              SourceFinder Pod <span className="text-[10px] font-mono text-indigo-400">v2.0 Orchestrator</span>
            </h1>
            <p className="text-[10px] text-slate-400">Iniciando plataforma y verificando sesión...</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-300">
          <span className="text-indigo-400 font-bold">Orquestador</span>
          <span className="text-slate-600">•</span>
          <span>SourceFinder</span>
          <span className="text-slate-600">•</span>
          <span>Guionista</span>
          <span className="text-slate-600">•</span>
          <span>Audio Deck</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {onForceUnblock && (
            <button
              onClick={onForceUnblock}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Acceder al Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Infinite Loop Recovery Banner */}
        {showStuckNotice && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-900/50 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  ¿Bucle en &quot;Verificando sesión&quot;?
                </h4>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Si la pantalla de verificación tarda demasiado, es posible que la caché local de Firestore/Auth se haya quedado bloqueada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {isClearing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isClearing ? "Limpiando..." : "Limpiar Caché Firestore"}</span>
              </button>

              {onForceUnblock && (
                <button
                  onClick={onForceUnblock}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero Card Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <div className="w-28 h-3 bg-slate-700/80 rounded animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="w-3/4 h-8 md:h-10 bg-slate-800 rounded-xl animate-pulse" />
              <div className="w-1/2 h-4 bg-slate-800/60 rounded-lg animate-pulse" />
            </div>

            {/* Input Bar Skeleton */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-12 bg-slate-800/90 rounded-2xl border border-slate-700/50 animate-pulse" />
              <div className="w-full sm:w-36 h-12 bg-indigo-600/50 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Grid Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                <div className="w-16 h-5 rounded-full bg-slate-800/60 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="w-3/4 h-5 bg-slate-800 rounded animate-pulse" />
                <div className="w-full h-3 bg-slate-800/60 rounded animate-pulse" />
                <div className="w-5/6 h-3 bg-slate-800/60 rounded animate-pulse" />
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <div className="w-20 h-4 bg-slate-800/50 rounded animate-pulse" />
                <div className="w-6 h-6 rounded-full bg-slate-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Preview Bar Skeleton */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ShieldCheck className="w-5 h-5 text-indigo-400/60" />
            <div className="space-y-1">
              <div className="w-44 h-3.5 bg-slate-800 rounded animate-pulse" />
              <div className="w-32 h-2.5 bg-slate-800/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full sm:w-48 h-3 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </main>
    </div>
  );
}
