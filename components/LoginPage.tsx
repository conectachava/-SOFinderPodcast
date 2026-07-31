"use client";

import React, { useState } from "react";
import { Radio, Shield, Sparkles, ArrowRight, CheckCircle2, Lock, Cpu } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "./Toast";

interface LoginPageProps {
  onBypassGuest?: () => void;
}

export function LoginPage({ onBypassGuest }: LoginPageProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      addToast("¡Bienvenido!", "Sesión iniciada con éxito en SourceFinder Pod.", "success");
    } catch (error) {
      console.error(error);
      addToast("Aviso", "Popup bloqueado o cancelado. Puedes usar el modo invitado si lo prefieres.", "info");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      if (onBypassGuest) {
        onBypassGuest();
      }
      addToast("Modo Invitado", "Has ingresado al espacio de trabajo en modo demostración.", "success");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Radio className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              SourceFinder Pod <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">PRO v3.5</span>
            </h1>
            <p className="text-xs text-slate-400">Inteligencia Artificial & Producción de Podcasts Multivoz</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Firestore Secured</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center gap-12 z-10">
        {/* Left Column: Mission & Highlights */}
        <div className="flex-1 space-y-8 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Motor de Investigación Gemini & Google Search Grounding</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Transforma cualquier tema en un <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300">Podcast de Nivel Profesional</span> en segundos.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            SourceFinder Pod automatiza la recolección de fuentes web con URLs auditadas, redacta guiones dinámicos multivoz y masteriza el audio final con control de loudness y efectos sonoros inmersivos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-xs text-white">Auditoría de Fuentes</h4>
              <p className="text-[11px] text-slate-400">Califica la credibilidad y extrae citas exactas con IA.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-xs text-white">Consola de Masterización</h4>
              <p className="text-[11px] text-slate-400">Control de compresor Glue, excitador y LUFS para streaming.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center backdrop-blur-md">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Acceso al Sistema</h3>
            <p className="text-xs text-slate-400">Inicia sesión para sincronizar tu historial con Firestore</p>
          </div>

          <div className="space-y-4 pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar con Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 uppercase">o explorar demo</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
            >
              🚀 Ingresar como Invitado (Modo Demo)
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Al continuar, aceptas las políticas de seguridad de SourceFinder Pod y Firestore Database.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 SourceFinder Pod AI. Todos los derechos reservados.</p>
        <p className="font-mono text-[10px]">Powered by Google Gemini AI & Firebase</p>
      </footer>
    </div>
  );
}
