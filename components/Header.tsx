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
  history?: any[];
  onSelectHistoryItem?: (item: any) => void;
  onExportProject?: () => void;
  syncStatus?: "saved" | "saving" | "idle";
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
  history = [],
  onSelectHistoryItem,
  onExportProject,
  syncStatus = "saved",
}: HeaderProps) {
  const { profile: userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const filteredHistory = history.filter((item) =>
    (item.topic || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.contentType || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
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
            {/* Global Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 w-48 sm:w-60 focus-within:ring-2 focus-within:ring-slate-900">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Buscar informes, guiones..."
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs ml-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto p-2 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase">
                    Resultados en Historial ({filteredHistory.length})
                  </div>
                  {filteredHistory.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No se encontraron coincidencias.</div>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          if (onSelectHistoryItem) onSelectHistoryItem(item);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs space-y-0.5 transition-colors"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.topic}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                          <span>{item.contentType || "Podcast"}</span>
                          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

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

            {/* Sync status indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
              {syncStatus === "saving" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-600 dark:text-amber-400">Sincronizando...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Guardado en Firestore</span>
                </>
              )}
            </div>

            {onExportProject && (
              <button
                onClick={onExportProject}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                title="Exportar Proyecto Completo (JSON)"
              >
                📥 <span className="hidden sm:inline">Exportar</span>
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
