"use client";

import React from "react";
import { Search, FileCheck, FileText, Mic, Check } from "lucide-react";
import { TabType } from "./Header";

interface PipelineProgressProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasReport: boolean;
  hasScript: boolean;
}

export function PipelineProgress({ activeTab, setActiveTab, hasReport, hasScript }: PipelineProgressProps) {
  const steps = [
    {
      id: "sourcefinder" as TabType,
      label: "1. Search",
      subLabel: "SourceFinder Búsqueda",
      icon: Search,
      isCompleted: hasReport,
    },
    {
      id: "sourcefinder" as TabType,
      label: "2. Report",
      subLabel: "Informe Verificado",
      icon: FileCheck,
      isCompleted: hasReport,
    },
    {
      id: "script" as TabType,
      label: "3. Script",
      subLabel: "Guionista v2.0",
      icon: FileText,
      isCompleted: hasScript,
    },
    {
      id: "studio" as TabType,
      label: "4. Studio",
      subLabel: "Audio Deck Multivoz",
      icon: Mic,
      isCompleted: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs mb-6 transition-colors">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Flujo del Pipeline de Inteligencia & Producción
        </span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          Estado: {hasScript ? "Guion Listo" : hasReport ? "Informe Listo" : "Esperando Tema"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeTab === step.id;

          return (
            <button
              key={idx}
              onClick={() => setActiveTab(step.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all relative ${
                isActive
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                  : step.isCompleted
                  ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                  : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    : step.isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {step.isCompleted && !isActive ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isActive ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-slate-100"}`}>
                  {step.label}
                </p>
                <p className={`text-[10px] truncate ${isActive ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                  {step.subLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
