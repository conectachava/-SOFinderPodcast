"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Radio, Layers, Search, FileText, Mic, BookOpen, History, User, HelpCircle, Sun, Moon, Globe, WifiOff, Database, Sparkles, Home, BarChart3, Bell } from "lucide-react";
import { UserProfile } from "./UserProfileModal";
import { useAuth } from "../app/AuthProvider";
import { GeminiStatusBadge } from "./GeminiStatusBadge";

export type TabType = "landing" | "orchestrator" | "sourcefinder" | "script" | "studio" | "storyboard" | "analytics" | "docs";

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onSelectPreset: (preset: { topic: string; contentType: string; format: "Debate" | "Análisis" | "Opinión" }) => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenTutorial: () => void;
  onOpenHelpGuide?: () => void;
  onOpenShortcuts?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  language?: "es" | "en";
  onToggleLanguage?: () => void;
  history?: any[];
  onSelectHistoryItem?: (item: any) => void;
  onExportProject?: () => void;
  syncStatus?: "saved" | "saving" | "idle";
  isFirestoreConnected?: boolean;
  onOpenSnapshotRestore?: () => void;
  onOpenDiagnostic?: () => void;
  onOpenNotifications?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onSelectPreset,
  onOpenHistory,
  onOpenProfile,
  onOpenTutorial,
  onOpenHelpGuide,
  onOpenShortcuts,
  theme = "light",
  onToggleTheme,
  language = "es",
  onToggleLanguage,
  history = [],
  onSelectHistoryItem,
  onExportProject,
  syncStatus = "saved",
  isFirestoreConnected = true,
  onOpenSnapshotRestore,
  onOpenDiagnostic,
  onOpenNotifications,
}: HeaderProps) {
  const { user, profile: userProfile } = useAuth();
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
      label: "🧠 Revolución IA & Era Post-Laboral",
      topic: "Revolución de la Inteligencia Artificial Generativa: Agentes Autónomos, AGI y el Futuro del Trabajo",
      contentType: "Análisis Profundo",
      format: "Debate" as const,
    },
    {
      label: "⚡ NVIDIA Blackwell & Supercomputación AI",
      topic: "Lanzamiento de NVIDIA Blackwell RTX 5090 y Mercado de GPUs AI",
      contentType: "Análisis de Producto",
      format: "Análisis" as const,
    },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#1a73e8] text-white rounded flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              SourceFinder Pod
            </span>
          </div>

          {/* Zone 2: 4-6 clean text navigation links (simplified tabs) */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={() => setActiveTab("orchestrator")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${activeTab === "orchestrator" ? "text-[#1a73e8]" : ""}`}>Orquestador</button>
            <button onClick={() => setActiveTab("sourcefinder")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${activeTab === "sourcefinder" ? "text-[#1a73e8]" : ""}`}>Investigación</button>
            <button onClick={() => setActiveTab("script")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${activeTab === "script" ? "text-[#1a73e8]" : ""}`}>Guion</button>
            <button onClick={() => setActiveTab("studio")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${activeTab === "studio" ? "text-[#1a73e8]" : ""}`}>Studio</button>
            <button onClick={() => setActiveTab("analytics")} className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${activeTab === "analytics" ? "text-[#1a73e8]" : ""}`}>Métricas</button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Sync status (Quiet) */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400">
              {syncStatus === "saving" ? (
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Sincronizando</span>
              ) : (
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Nube OK</span>
              )}
            </div>

            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title="Notificaciones Push de Renderizado (FCM)"
                aria-label="Abrir Notificaciones Push"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              </button>
            )}

            <button
              onClick={onOpenProfile}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenTutorial}
              className="hidden md:flex px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Tutorial
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
          <button
            onClick={() => setActiveTab("landing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "landing"
                ? "bg-[#1a73e8] text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Inicio (Landing)
          </button>

          <button
            onClick={() => setActiveTab("orchestrator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "orchestrator"
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
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
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
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
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
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
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
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
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-300" />
            Storyboard Video (Flow)
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            Métricas &amp; Retención
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === "docs"
                ? "bg-[#1a73e8] text-white font-semibold shadow-xs"
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
