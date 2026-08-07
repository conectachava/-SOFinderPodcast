"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, FileCheck, FileText, Mic, Check, HelpCircle, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { TabType } from "./Header";

interface PipelineProgressProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasReport: boolean;
  hasScript: boolean;
  reportText?: string;
  scriptLines?: any[];
  storyboardData?: any;
}

export function PipelineProgress({
  activeTab,
  setActiveTab,
  hasReport,
  hasScript,
  reportText,
  scriptLines,
  storyboardData,
}: PipelineProgressProps) {
  // Compute internal consistency check
  const calculatePipelineHealth = () => {
    const hasValidReportText = Boolean(reportText && reportText.trim().length > 30);
    const hasValidScriptLines = Boolean(Array.isArray(scriptLines) && scriptLines.length > 0);
    const hasValidStoryboard = Boolean(storyboardData && Object.keys(storyboardData).length > 0);

    // Inconsistency detection: Script exists without Report
    if (hasScript && !hasReport && !hasValidReportText) {
      return {
        status: "inconsistent",
        score: 40,
        color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800",
        dotColor: "bg-rose-500 animate-ping",
        icon: AlertTriangle,
        label: "Inconsistencia: Guion sin Informe",
        details: "Atención: Existe un guion local pero falta el informe de investigación previo.",
      };
    }

    if (hasReport && hasScript && (hasValidStoryboard || storyboardData)) {
      return {
        status: "optimal",
        score: 100,
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
        dotColor: "bg-emerald-500 animate-pulse",
        icon: ShieldCheck,
        label: "100% Salud Óptima del Pipeline",
        details: "Informe, guion de diálogo y storyboard están sincronizados correctamente.",
      };
    }

    if (hasReport && hasScript) {
      return {
        status: "partial",
        score: 75,
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800",
        dotColor: "bg-amber-500 animate-pulse",
        icon: Activity,
        label: "75% Guion Listo (Falta Audio)",
        details: "Investigación y guion redactados. Pendiente producción de audio en Studio.",
      };
    }

    if (hasReport || hasValidReportText) {
      return {
        status: "partial",
        score: 35,
        color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800",
        dotColor: "bg-indigo-500",
        icon: Activity,
        label: "35% Informe Verificado",
        details: "Informe listo para ser transformado en guion de diálogo.",
      };
    }

    return {
      status: "idle",
      score: 0,
      color: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      dotColor: "bg-slate-400",
      icon: Activity,
      label: "0% Esperando Tema",
      details: "Inicia buscando un tema en SourceFinder para activar el pipeline.",
    };
  };

  const health = calculatePipelineHealth();
  const HealthIcon = health.icon;

  const steps = [
    {
      id: "sourcefinder" as TabType,
      label: "1. Search",
      subLabel: "SourceFinder Búsqueda",
      icon: Search,
      isCompleted: hasReport,
      estTime: "Tiempo estimado restante: ~1 min",
      explanation: "Explora fuentes web en tiempo real y extrae URLs verificadas usando Gemini.",
    },
    {
      id: "sourcefinder" as TabType,
      label: "2. Report",
      subLabel: "Informe Verificado",
      icon: FileCheck,
      isCompleted: hasReport,
      estTime: "Tiempo estimado restante: ~2 min",
      explanation: "Sintetiza la investigación en un informe estructurado y califica la fiabilidad de las fuentes.",
    },
    {
      id: "script" as TabType,
      label: "3. Script",
      subLabel: "Guionista v2.0",
      icon: FileText,
      isCompleted: hasScript,
      estTime: "Tiempo estimado restante: ~1.5 min",
      explanation: "Genera un guion multi-locutor dinámico adaptado al formato y tono seleccionado.",
    },
    {
      id: "studio" as TabType,
      label: "4. Studio",
      subLabel: "Audio Deck Multivoz",
      icon: Mic,
      isCompleted: false,
      estTime: "Tiempo estimado restante: ~3 min",
      explanation: "Produce el audio final con voces multivoz, efectos sonoros ambientales y control de loudness.",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs mb-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          Flujo del Pipeline de Inteligencia & Producción
        </span>

        <div className="flex items-center gap-2">
          {/* Dynamic Visual Health Indicator Badge */}
          <div className="relative group/health">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold transition-all cursor-help ${health.color}`}>
              <span className={`w-2 h-2 rounded-full ${health.dotColor}`} />
              <HealthIcon className="w-3.5 h-3.5" />
              <span>{health.label}</span>
            </div>

            {/* Health Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-950 text-white text-[11px] rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover/health:opacity-100 group-hover/health:pointer-events-auto transition-all z-50 border border-slate-800 leading-relaxed">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <HealthIcon className="w-3.5 h-3.5" />
                  Salud de Datos del Pipeline
                </span>
                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 font-mono text-[9px] rounded font-bold">
                  Score: {health.score}%
                </span>
              </div>
              <p className="text-slate-300 font-sans">{health.details}</p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Estado: {hasScript ? "Guion Listo" : hasReport ? "Informe Listo" : "Esperando Tema"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        <AnimatePresence mode="popLayout">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;

            return (
              <motion.div
                key={`${step.label}-${activeTab}`}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{
                  duration: 0.25,
                  delay: idx * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all relative group ${
                  isActive
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md ring-2 ring-amber-500/50"
                    : step.isCompleted
                    ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                    : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePipelineRing"
                    className="absolute -inset-0.5 rounded-lg border-2 border-amber-400/80 pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}

                <button
                  onClick={() => setActiveTab(step.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        : step.isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {step.isCompleted && !isActive ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isActive ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-slate-100"}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                      {step.subLabel}
                    </p>
                  </div>
                </button>

                {/* Helper '?' Tooltip */}
                <div className="relative group/tip ml-2 shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors cursor-help ${
                    isActive ? "bg-white/20 text-white border-white/30" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                  }`}>
                    <HelpCircle className="w-3 h-3" />
                  </div>
                  <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-50 leading-relaxed font-normal">
                    <p className="font-bold text-amber-300 mb-0.5">{step.subLabel}</p>
                    {step.explanation}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

