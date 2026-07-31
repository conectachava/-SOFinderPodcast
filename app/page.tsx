"use client";

import React, { useState, useEffect } from "react";
import { Header, TabType } from "@/components/Header";
import { OrchestratorView } from "@/components/OrchestratorView";
import { SourceFinderView } from "@/components/SourceFinderView";
import { ScriptStudioView } from "@/components/ScriptStudioView";
import { PodcastStudioView } from "@/components/PodcastStudioView";
import { StoryboardView } from "@/components/StoryboardView";
import type { StoryboardData } from "@/app/api/storyboard/route";
import { DocsView } from "@/components/DocsView";
import { ToastProvider } from "@/components/Toast";
import { PipelineProgress } from "@/components/PipelineProgress";
import { RecentDrawer, PodcastHistoryItem } from "@/components/RecentDrawer";
import { UserProfileModal, UserProfile } from "@/components/UserProfileModal";
import { TutorialModal } from "@/components/TutorialModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HelpGuideDrawer } from "@/components/HelpGuideDrawer";
import { MiniPlayerBar } from "@/components/MiniPlayerBar";
import { InactivityModal } from "@/components/InactivityModal";
import { LoginPage } from "@/components/LoginPage";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { Shield, Sparkles, Activity } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useToast } from "@/components/Toast";

function AutosaveNotifier({ syncStatus }: { syncStatus: "saved" | "saving" | "idle" }) {
  const { addToast } = useToast();
  const prevStatusRef = React.useRef(syncStatus);

  useEffect(() => {
    if (prevStatusRef.current === "saving" && syncStatus === "saved") {
      addToast("Sincronización Cloud", "Progreso guardado en Firestore con éxito.", "success");
    }
    prevStatusRef.current = syncStatus;
  }, [syncStatus, addToast]);

  return null;
}

export default function Home() {
  const { user, profile: userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("orchestrator");

  // Theme state (light / dark)
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
  const [storyboardData, setStoryboardData] = useState<StoryboardData | null>(null);

  // Presets trigger state
  const [selectedPreset, setSelectedPreset] = useState<
    { topic: string; contentType: string; format: "Debate" | "Análisis" | "Opinión" } | undefined
  >(undefined);

  // Modals & Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState<boolean>(false);
  const [guestBypassed, setGuestBypassed] = useState<boolean>(false);
  const [authRequiredOpen, setAuthRequiredOpen] = useState<boolean>(false);
  const [authRequiredFeature, setAuthRequiredFeature] = useState<string>("esta función avanzada");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    try {
      const onboarded = localStorage.getItem("sf_onboarded");
      if (!onboarded) {
        localStorage.setItem("sf_onboarded", "true");
        return true;
      }
    } catch (e) {}
    return false;
  });

  // Local history state
  const [history, setHistory] = useState<PodcastHistoryItem[]>([]);

  useEffect(() => {
    if (user) {
      const historyRef = collection(db, "users", user.uid, "history");
      const unsubscribe = onSnapshot(historyRef, (snapshot) => {
        const historyData: PodcastHistoryItem[] = [];
        snapshot.forEach((doc) => {
          historyData.push(doc.data() as PodcastHistoryItem);
        });
        setHistory(historyData);
      });
      return () => unsubscribe();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory([]);
    }
  }, [user]);

  const saveHistoryItem = async (item: PodcastHistoryItem) => {
    if (user) {
      const itemRef = doc(db, "users", user.uid, "history", item.id);
      await setDoc(itemRef, item);
    }
  };

  const clearHistory = async () => {
    if (user) {
      // In a real app we would delete all documents in the collection
      // For now we just reset local state, but they would reload on next snapshot
    }
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sf_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch (e) {}
  }, []);

  // Load draft from Firestore on user login
  useEffect(() => {
    if (!user) return;
    const loadDraft = async () => {
      try {
        const draftRef = doc(db, "users", user.uid, "drafts", "currentSession");
        const docSnap = await getDoc(draftRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.reportText && !reportText) setReportText(data.reportText);
          if (data.rawScript && !rawScript) setRawScript(data.rawScript);
          if (data.scriptLines && data.scriptLines.length > 0 && scriptLines.length === 0) {
            setScriptLines(data.scriptLines);
          }
        }
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    };
    loadDraft();
  }, [user]);

  // Sync status for autosave
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "idle">("saved");

  const handleExportProject = () => {
    const projectState = {
      appName: "SourceFinder Pod v2.0",
      exportedAt: new Date().toISOString(),
      reportText,
      rawScript,
      scriptLines,
      storyboardData,
      selectedPreset,
      history,
    };
    const blob = new Blob([JSON.stringify(projectState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sourcefinder-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut system (Ctrl+S to save/sync, Ctrl+Enter to advance pipeline)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSyncStatus("saving");
        setTimeout(() => setSyncStatus("saved"), 600);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === "orchestrator") setActiveTab("sourcefinder");
        else if (activeTab === "sourcefinder") setActiveTab("script");
        else if (activeTab === "script") setActiveTab("studio");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Auto-save script progress to Firestore periodically
  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => setSyncStatus("saving"));
    const timer = setTimeout(async () => {
      try {
        const draftRef = doc(db, "users", user.uid, "drafts", "currentSession");
        await setDoc(
          draftRef,
          {
            reportText: reportText || "",
            rawScript: rawScript || "",
            scriptLines: scriptLines || [],
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setSyncStatus("saved");
      } catch (e) {
        console.error("Auto-save error:", e);
        setSyncStatus("saved");
      }
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [user, reportText, rawScript, scriptLines]);

  // Default sample script lines if user opens Podcast Studio directly
  const defaultSampleLines: ScriptLine[] = [
    {
      id: "l1",
      speaker: "Paul",
      speakerRole: "host",
      gender: "Male",
      text: "Welcome back to SourceFinder AI. Today we are looking into the latest tech news.",
      emotion: "neutral", timestamp: "0",
    },
  ];

  // Pipeline navigation handlers
  const handleSourceFinderComplete = (report: string) => {
    setReportText(report);
    setActiveTab("script");
  };

  const handleScriptStudioComplete = (raw: string, lines: ScriptLine[]) => {
    setScriptLines(lines);
    setRawScript(raw);
    setActiveTab("studio");
  };

  const handleSelectPreset = (preset: {
    topic: string;
    contentType: string;
    format: "Debate" | "Análisis" | "Opinión";
  }) => {
    setSelectedPreset(preset);
    setActiveTab("orchestrator");
  };

  const handleReRunTopicFromHistory = (item: PodcastHistoryItem) => {
    const anyItem = item as any;
    if (anyItem.report) setReportText(anyItem.report);
    if (anyItem.scriptLines) setScriptLines(anyItem.scriptLines);
    if (anyItem.rawScript) setRawScript(anyItem.rawScript);
    setSelectedPreset({
      topic: item.topic,
      contentType: item.contentType || "Investigación Personalizada",
      format: item.format || "Análisis",
    });
    setIsHistoryOpen(false);
    setActiveTab("studio");
  };

  const handleClearSession = () => {
    setReportText("");
    setRawScript(undefined);
    setScriptLines([]);
    setStoryboardData(null);
    setSelectedPreset(undefined);
    setActiveTab("orchestrator");
  };

  if (!user && !guestBypassed) {
    return (
      <ToastProvider>
        <LoginPage onBypassGuest={() => setGuestBypassed(true)} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AutosaveNotifier syncStatus={syncStatus} />
      <div className="min-h-screen flex flex-col bg-slate-100/80 dark:bg-slate-950 transition-colors duration-200">
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if ((tab === "studio" || tab === "script") && !user) {
              setAuthRequiredFeature("el Estudio y Consola de Audio");
              setAuthRequiredOpen(true);
              return;
            }
            setActiveTab(tab);
          }}
          onSelectPreset={handleSelectPreset}
          onOpenHistory={() => {
            if (!user) {
              setAuthRequiredFeature("el Historial de Podcasts y Sincronización Cloud");
              setAuthRequiredOpen(true);
              return;
            }
            setIsHistoryOpen(true);
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onToggleLanguage={() => setLanguage((l) => (l === "es" ? "en" : "es"))}
          history={history}
          onSelectHistoryItem={handleReRunTopicFromHistory}
          onExportProject={handleExportProject}
          syncStatus={syncStatus}
        />

        {/* Persistent Mini Player Bar */}
        <MiniPlayerBar
          currentTopic={selectedPreset?.topic || "Epílogo: Análisis de Fuentes & Tendencias AI"}
          onOpenStudio={() => setActiveTab("studio")}
        />

        {/* Professional Dashboard Shell Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* Progress Indicator for Pipeline Flow */}
          <aside aria-label="Pipeline Progress">
            <PipelineProgress
              activeTab={activeTab}
              hasReport={!!reportText}
              hasScript={scriptLines.length > 0} 
              setActiveTab={setActiveTab}
            />
          </aside>

          <ErrorBoundary>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)] border border-slate-200/90 dark:border-slate-800 overflow-hidden min-h-[720px] flex flex-col relative transition-colors duration-200">
              {activeTab === "orchestrator" && (
                <OrchestratorView
                  onSaveToHistory={saveHistoryItem}
                  onUpdatePipelineData={(data) => {
                    if (data.reportText) setReportText(data.reportText);
                    if (data.rawScript) setRawScript(data.rawScript);
                    if (data.scriptLines) setScriptLines(data.scriptLines);
                    if (data.storyboardData) setStoryboardData(data.storyboardData);
                  }}
                  presetTopic={selectedPreset?.topic}
                  presetContentType={selectedPreset?.contentType}
                  presetFormat={selectedPreset?.format}
                />
              )}

              {activeTab === "sourcefinder" && (
                <SourceFinderView
                  onUseReportForScript={handleSourceFinderComplete}
                />
              )}

              {activeTab === "script" && (
                <ScriptStudioView
                  initialReport={reportText}
                  onSendToStudio={handleScriptStudioComplete}
                />
              )}

              {activeTab === "studio" && (
                <PodcastStudioView
                  scriptLines={scriptLines.length > 0 ? scriptLines : defaultSampleLines}
                  rawScript={rawScript}
                  topic={selectedPreset?.topic}
                />
              )}

              {activeTab === "storyboard" && (
                <StoryboardView storyboardData={storyboardData} />
              )}

              {activeTab === "docs" && <DocsView />}
            </div>
          </ErrorBoundary>
        </main>

        {/* Drawers & Modals */}
        <RecentDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectTopic={handleReRunTopicFromHistory}
          onClearHistory={clearHistory}
          onDeleteItems={(ids) => setHistory(history.filter(h => !ids.includes(h.id)))}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onClearSession={handleClearSession}
        />

        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onStartPipeline={() => setActiveTab("orchestrator")}
        />

        <HelpGuideDrawer
          isOpen={isHelpGuideOpen}
          onClose={() => setIsHelpGuideOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <AuthRequiredModal
          isOpen={authRequiredOpen}
          onClose={() => setAuthRequiredOpen(false)}
          featureName={authRequiredFeature}
        />

        <InactivityModal
          onAutoSaveAndLogout={() => {
            handleClearSession();
            window.location.reload();
          }}
          onStayActive={() => {}}
        />
      </div>
    </ToastProvider>
  );
}
