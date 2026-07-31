"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, Zap, Search, Mic, FileText, ArrowRight } from "lucide-react";
import { useAuth } from "../app/AuthProvider";

interface LandingHeroProps {
  onStartNow: () => void;
}

export function LandingHero({ onStartNow }: LandingHeroProps) {
  const { user, profile } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-800 relative overflow-hidden mb-8 transition-all">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-mono font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>SourceFinder AI v2.0 • El Ecosistema Definitivo para Podcasters & Investigadores</span>
        </div>

        {/* Main Headline tackling user pain points */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            ¿Harto de pasar <span className="text-amber-400 underline decoration-amber-500/50 underline-offset-8">8 horas</span> buscando fuentes confiables y redactando guiones que nadie escucha?
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            Crear un podcast o boletín de autoridad no debería requerir saltar entre 6 herramientas desconectadas, arriesgarte a publicar fake news o lidiar con textos planos sin alma.
          </p>
        </div>

        {/* Pain points vs Solution grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pain 1 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> El Dolor: Desinformación
            </div>
            <p className="text-xs text-slate-300">
              Horas investigando en internet, cruzando datos dudosos y temiendo publicar información inexacta o sesgada.
            </p>
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>SourceFinder AI: Curaduría y calificación automática de reputación de fuentes.</span>
            </div>
          </div>

          {/* Pain 2 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> El Dolor: Guiones Planos
            </div>
            <p className="text-xs text-slate-300">
              Redactar diálogos aburridos que suenan robóticos, sin ganchos de retención ni dinámicas de debate atractivas.
            </p>
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Guionista v2.0: Estructuras dinámicas (Debate, Análisis, Opinión) en segundos.</span>
            </div>
          </div>

          {/* Pain 3 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> El Dolor: Caos Técnico
            </div>
            <p className="text-xs text-slate-300">
              Procesos fragmentados para editar audio, generar portadas y gestionar aprobaciones de equipo.
            </p>
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Pipeline 1-Click: De la noticia al Audio Studio y Storyboard visual sin salir de aquí.</span>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <p className="text-sm font-bold text-white">Acceso Seguro con Google & Validación Admin</p>
              <p className="text-xs text-slate-400">Protegido por políticas de Firestore y control de calidad empresarial.</p>
            </div>
          </div>

          <button
            onClick={onStartNow}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Crear mi Podcast Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
