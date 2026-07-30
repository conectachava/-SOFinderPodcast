"use client";

import React, { useState, useEffect } from "react";
import { Header, TabType } from "@/components/Header";
import { OrchestratorView } from "@/components/OrchestratorView";
import { SourceFinderView } from "@/components/SourceFinderView";
import { ScriptStudioView } from "@/components/ScriptStudioView";
import { PodcastStudioView } from "@/components/PodcastStudioView";
import { DocsView } from "@/components/DocsView";
import { ToastProvider } from "@/components/Toast";
import { PipelineProgress } from "@/components/PipelineProgress";
import { RecentDrawer, PodcastHistoryItem } from "@/components/RecentDrawer";
import { UserProfileModal, UserProfile } from "@/components/UserProfileModal";
import { TutorialModal } from "@/components/TutorialModal";
import { ScriptLine } from "@/app/api/script-writer/route";
import { Shield, Sparkles, Activity } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("orchestrator");

  // Theme state (light / dark)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sf_theme");
        if (saved === "dark" || saved === "light") return saved;
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
      } catch (e) {}
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("sf_theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Shared state across views
  const [reportText, setReportText] = useState<string | undefined>(undefined);
  const [rawScript, setRawScript] = useState<string | undefined>(undefined);
  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);

  // Presets trigger state
  const [selectedPreset, setSelectedPreset] = useState<
    { topic: string; contentType: string; format: "Debate" | "Análisis" | "Opinión" } | undefined
  >(undefined);

  // Modals & Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Local history state
  const [history, setHistory] = useState<PodcastHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sf_podcast_history");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "h1",
        topic: "Lanzamiento de iPhone 15 Pro y Reporte de Ganancias Apple",
        contentType: "Noticia Tecnológica",
        format: "Debate",
        date: "Hoy, 14:30",
        scriptLinesCount: 14,
        reportSnippet: "El nuevo iPhone 15 Pro integra procesador A17 Bionic y chasis de titanio...",
      },
      {
        id: "h2",
        topic: "NVIDIA Blackwell RTX 5090 y Mercado GPUs AI",
        contentType: "Análisis de Producto",
        format: "Análisis",
        date: "Ayer, 18:10",
        scriptLinesCount: 18,
        reportSnippet: "Avances significativos en arquitectura Blackwell para aceleración de aprendizaje profundo...",
      },
    ];
  });

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sf_user_profile");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: "Productor Principal",
      email: "productor@sourcefinder.ai",
      preferredFormat: "Análisis",
      customHostVoice: "Paul (Británico)",
      episodesCount: 8,
      isLoggedIn: true,
    };
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sf_podcast_history", JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Save user profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sf_user_profile", JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

  // Default sample script lines if user opens Podcast Studio directly
  const defaultSampleLines: ScriptLine[] = [
    {
      id: "l1",
      speaker: "Paul",
      speakerRole: "host",
      gender: "Male",
      accent: "British",
      text: "Bienvenidos a nuestro programa de análisis tecnológico. Hoy transmitimos una edición especial sobre los avances de la inteligencia artificial y hardware.",
      timestamp: "0:00",
    },
    {
      id: "l2",
      speaker: "Sarah",
      speakerRole: "caller",
      gender: "Female",
      accent: "American Midwest",
      text: "Hola Paul. De acuerdo con los reportes verificados de The Verge, la adopción de las nuevas arquitecturas de chips ha superado los pronósticos iniciales.",
      timestamp: "0:12",
    },
    {
      id: "l3",
      speaker: "David",
      speakerRole: "caller",
      gender: "Male",
      accent: "British",
      text: "Saludos Paul y Sarah. Sin duda el rendimiento impresiona, pero la clave del debate es si la eficiencia energética mantendrá estos costos a raya.",
      timestamp: "0:25",
    },
    {
      id: "l4",
      speaker: "Paul",
      speakerRole: "host",
      gender: "Male",
      accent: "British",
      text: "Perspectivas brillantes de ambos. Gracias por sus valiosas contribuciones a la edición de hoy.",
      timestamp: "0:38",
    },
  ];

  const handleSelectPreset = (preset: {
    topic: string;
    contentType: string;
    format: "Debate" | "Análisis" | "Opinión";
  }) => {
    setSelectedPreset(preset);
    setActiveTab("orchestrator");
  };

  const handleUseReportForScript = (report: string) => {
    setReportText(report);
    setActiveTab("script");
  };

  const handleSendToStudio = (script: string, lines: ScriptLine[]) => {
    setRawScript(script);
    setScriptLines(lines);
    setActiveTab("studio");
  };

  const handleSaveToHistory = (item: PodcastHistoryItem) => {
    setHistory((prev) => [item, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      episodesCount: prev.episodesCount + 1,
    }));
  };

  const handleReRunTopicFromHistory = (item: PodcastHistoryItem) => {
    setSelectedPreset({
      topic: item.topic,
      contentType: item.contentType,
      format: item.format,
    });
    setActiveTab("orchestrator");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
        {/* Header matching Clean Minimalism */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectPreset={handleSelectPreset}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          userProfile={userProfile}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Progress Indicator for Pipeline Flow */}
          <PipelineProgress
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            hasReport={!!reportText}
            hasScript={scriptLines.length > 0}
          />

          {/* Active Tab View */}
          {activeTab === "orchestrator" && (
            <OrchestratorView
              onSaveToHistory={handleSaveToHistory}
              presetTopic={selectedPreset?.topic}
              presetContentType={selectedPreset?.contentType}
              presetFormat={selectedPreset?.format}
            />
          )}

          {activeTab === "sourcefinder" && (
            <SourceFinderView onUseReportForScript={handleUseReportForScript} />
          )}

          {activeTab === "script" && (
            <ScriptStudioView initialReport={reportText} onSendToStudio={handleSendToStudio} />
          )}

          {activeTab === "studio" && (
            <PodcastStudioView
              scriptLines={scriptLines.length > 0 ? scriptLines : defaultSampleLines}
              rawScript={rawScript}
            />
          )}

          {activeTab === "docs" && <DocsView />}
        </main>

        {/* Footer & Status Bar matching Design HTML */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 dark:text-slate-200">SourceFinder Pod v2.0</span>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                <Shield className="w-3 h-3" />
                Filtro de Reputación Activo (&gt;0.6)
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Latencia API: ~120ms
              </span>
              <span>@google/genai SDK</span>
            </div>
          </div>
        </footer>

        {/* Modals & Drawers */}
        <RecentDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectTopic={handleReRunTopicFromHistory}
          onClearHistory={() => setHistory([])}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={userProfile}
          onSaveProfile={(p) => setUserProfile(p)}
        />

        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onStartPipeline={() => setActiveTab("orchestrator")}
        />
      </div>
    </ToastProvider>
  );
}
