"use client";

import React from "react";
import { Radio, Layers, Search, FileText, Mic, BookOpen, History, User, HelpCircle, Sun, Moon } from "lucide-react";
import { UserProfile } from "./UserProfileModal";
import { useAuth } from "../app/AuthProvider";

export type TabType = "orchestrator" | "sourcefinder" | "script" | "studio" | "storyboard" | "docs";

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onSelectPreset: (preset: { topic: string; contentType: string; format: "Debate" | "Análisis" | "Opinión" }) => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenTutorial: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onSelectPreset,
  onOpenHistory,
  onOpenProfile,
  onOpenTutorial,
  theme = "light",
  onToggleTheme,
}: HeaderProps) {
  const { profile: userProfile } = useAuth();
  const PRESETS = [
    {
      label: "🔥 TENDENCIAS (Signal Analyst)",
      topic: "TENDENCIAS",
      contentType: "Noticia Tecnológica",
      format: "Debate" as const,
    },
    {
      label: "⚡ iPhone 15 Pro & Earnings",
      topic: "Lanzamiento de iPhone 15 Pro y Reporte de Ganancias Apple",
      contentType: "Noticia Tecnológica",
      format: "Debate" as const,
    },
    {
      label: "⚡ NVIDIA Blackwell RTX 5090",
      topic: "Lanzamiento de NVIDIA Blackwell RTX 5090 y Mercado de GPUs AI",
      contentType: "Análisis de Producto",
      format: "Análisis" as const,
    },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded flex items-center justify-center font-bold text-sm shadow-xs">
              SF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  SourceFinder Pod <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">v2.0 Orchestrator</span>
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">
                  GEMINI_API Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Plataforma de Investigación de Inteligencia & Producción de Podcasts Multivoz
              </p>
            </div>
          </div>

          {/* Preset Buttons & User Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 mr-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPreset(p)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs"
                title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span className="hidden sm:inline">Oscuro</span>
                  </>
                )}
              </button>
            )}

            {/* Utility buttons */}
            <button
              onClick={onOpenHistory}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              title="Historial de Podcasts"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Historial</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              title="Perfil de Usuario"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{userProfile?.name || "Perfil"}</span>
            </button>

            <button
              onClick={onOpenTutorial}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
              title="Guía Interactiva"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
              <span className="hidden sm:inline">Tutorial</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
          <button
            onClick={() => setActiveTab("orchestrator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "orchestrator"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Orquestador Completo
          </button>

          <button
            onClick={() => setActiveTab("sourcefinder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "sourcefinder"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Agente SourceFinder
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "script"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Guionista v2.0
          </button>

          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "studio"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Podcast Studio Audio Deck
          </button>

          <button
            onClick={() => setActiveTab("storyboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "storyboard"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-pink-500" />
            Storyboard Video (Flow)
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "docs"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Manual de Operación
          </button>
        </nav>
      </div>
    </header>
  );
}
