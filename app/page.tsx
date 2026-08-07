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
import { LandingHero } from "@/components/LandingHero";
import { LandingHeader } from "@/components/LandingHeader";
import { ToastProvider } from "@/components/Toast";
import { PipelineProgress } from "@/components/PipelineProgress";
import { RecentDrawer, PodcastHistoryItem } from "@/components/RecentDrawer";
import { UserProfileModal, UserProfile } from "@/components/UserProfileModal";
import { TutorialModal } from "@/components/TutorialModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HelpGuideDrawer } from "@/components/HelpGuideDrawer";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { InactivityModal } from "@/components/InactivityModal";
import { LoginPage } from "@/components/LoginPage";
import { SkeletonDashboardLoader } from "@/components/SkeletonDashboardLoader";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { SnapshotRestoreModal, ProjectSnapshot } from "@/components/SnapshotRestoreModal";
import { ProjectExportModal } from "@/components/ProjectExportModal";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { Shield, Sparkles, Activity, RotateCw, ArrowRight } from "lucide-react";
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
  const { user, profile: userProfile, loading, ready, authStatus, retryAuth, forceUnblockLoading, clearAuthCache } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("landing");

  const [systemSync, setSystemSync] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sf_system_sync") === "true";
    } catch (e) {
      return false;
    }
  });

  const [themeSchedule, setThemeSchedule] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sf_theme_schedule") === "true";
    } catch (e) {
      return false;
    }
  });

  // Theme state (light / dark)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const isSync = localStorage.getItem("sf_system_sync") === "true";
      if (isSync && typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      const isSchedule = localStorage.getItem("sf_theme_schedule") === "true";
      if (isSchedule) {
        const hour = new Date().getHours();
        return (hour >= 18 || hour < 6) ? "dark" : "light";
      }
      return (localStorage.getItem("sf_theme") as "light" | "dark") || "light";
    } catch (e) {
      return "light";
    }
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

  useEffect(() => {
    if (systemSync) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [systemSync]);

  useEffect(() => {
    if (themeSchedule) {
      // Check every minute
      const interval = setInterval(() => {
        const hour = new Date().getHours();
        setTheme((hour >= 18 || hour < 6) ? "dark" : "light");
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [themeSchedule]);

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
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [isSnapshotRestoreOpen, setIsSnapshotRestoreOpen] = useState<boolean>(false);
  const [guestBypassed, setGuestBypassed] = useState<boolean>(true);
  const [authRequiredOpen, setAuthRequiredOpen] = useState<boolean>(false);
  const [authRequiredFeature, setAuthRequiredFeature] = useState<string>("esta función avanzada");
  const [language, setLanguage] = useState<"es" | "en">("es");
  // Focus Mode state for ScriptStudioView
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Sync status for autosave
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(() => {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });
  const { addToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsFirestoreConnected(true);
      addToast("Conexión Firestore Restablecida", "Reconectado a la base de datos de Firestore. Sincronizando datos.", "success");
    };
    const handleOffline = () => {
      setIsFirestoreConnected(false);
      addToast("Conexión Firestore Interrumpida", "Se perdió la conexión con la base de datos. Los cambios se están guardando localmente en la caché.", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let unsub: (() => void) | null = null;
    try {
      const statusRef = doc(db, "_system_", "connection_check");
      unsub = onSnapshot(statusRef, { includeMetadataChanges: true }, (snapshot) => {
        if (snapshot.metadata.fromCache && typeof navigator !== "undefined" && !navigator.onLine) {
          setIsFirestoreConnected(false);
        } else {
          setIsFirestoreConnected(true);
        }
      }, (err) => {
        console.warn("Firestore connectivity check warning:", err);
      });
    } catch (err) {
      console.warn("Firestore listener init warning:", err);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (unsub) unsub();
    };
  }, [addToast]);

  const handleExportProject = () => {
    setIsExportModalOpen(true);
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

  // Safety check to ensure verifying session modal never hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        console.log("[Home] Auto-resolving unblock loading state.");
        forceUnblockLoading();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [ready, forceUnblockLoading]);
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

  if ((authStatus === "checking" || !ready || loading) && !guestBypassed) {
    return (
      <SkeletonDashboardLoader
        onClearCache={async () => {
          await clearAuthCache();
          setGuestBypassed(true);
        }}
        onForceUnblock={() => {
          forceUnblockLoading();
          setGuestBypassed(true);
        }}
      />
    );
  }

  if (!user && !guestBypassed) {
    return (
      <LoginPage onBypassGuest={() => setGuestBypassed(true)} />
    );
  }

  return (
    <>
      <AutosaveNotifier syncStatus={syncStatus} />
      <div className="min-h-screen flex flex-col bg-slate-100/80 dark:bg-slate-950 transition-colors duration-200">
        {activeTab === "landing" ? (
          <LandingHeader
            onLaunchStudio={() => setActiveTab("orchestrator")}
            onOpenLogin={() => setIsProfileOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === "es" ? "en" : "es"))}
            user={user}
          />
        ) : (
          <Header
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
            }}
            onSelectPreset={handleSelectPreset}
            onOpenHistory={() => {
              setIsHistoryOpen(true);
            }}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === "es" ? "en" : "es"))}
            history={history}
            onSelectHistoryItem={handleReRunTopicFromHistory}
            onExportProject={handleExportProject}
            syncStatus={syncStatus}
            isFirestoreConnected={isFirestoreConnected}
            onOpenSnapshotRestore={() => setIsSnapshotRestoreOpen(true)}
          />
        )}

        {/* Professional Dashboard Shell Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {activeTab === "landing" ? (
            <LandingHero
              onStartNow={() => setActiveTab("orchestrator")}
              onOpenLogin={() => setIsProfileOpen(true)}
            />
          ) : (
            <>
              {/* Progress Indicator for Pipeline Flow - Hidden during Focus Mode */}
              {!isFocusModeActive && (
                <aside aria-label="Pipeline Progress">
                  <PipelineProgress
                    activeTab={activeTab}
                    hasReport={!!reportText}
                    hasScript={scriptLines.length > 0} 
                    setActiveTab={setActiveTab}
                    reportText={reportText}
                    scriptLines={scriptLines}
                    storyboardData={storyboardData}
                  />
                </aside>
              )}

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
                      onToggleFocusMode={(isFocused) => setIsFocusModeActive(isFocused)}
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
            </>
          )}
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
          showGridOverlay={showGridOverlay}
          onToggleGridOverlay={setShowGridOverlay}
          systemSync={systemSync}
          onToggleSystemSync={(val) => {
             setSystemSync(val);
             try {
               localStorage.setItem("sf_system_sync", String(val));
             } catch (e) {}
          }}
          themeSchedule={themeSchedule}
          onToggleThemeSchedule={(val) => {
             setThemeSchedule(val);
             try {
               localStorage.setItem("sf_theme_schedule", String(val));
             } catch (e) {}
          }}
        />

        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {showGridOverlay && (
          <div className="fixed inset-0 pointer-events-none z-50 grid grid-cols-12 gap-4 px-6 opacity-25">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-indigo-500 h-full border-x border-indigo-300"></div>
            ))}
          </div>
        )}

        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onStartPipeline={() => setActiveTab("orchestrator")}
        />

        <SnapshotRestoreModal
          isOpen={isSnapshotRestoreOpen}
          onClose={() => setIsSnapshotRestoreOpen(false)}
          onRestore={(snap: ProjectSnapshot) => {
             // Example action
             console.log("Restoring snapshot:", snap);
          }}
        />

        <HelpGuideDrawer
          isOpen={isHelpGuideOpen}
          onClose={() => setIsHelpGuideOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <ProjectExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          projectData={{
            reportText,
            rawScript,
            scriptLines,
            storyboardData: storyboardData ? (storyboardData.scenes || []) : [],
            selectedPreset,
            topic: selectedPreset?.topic || "SourceFinder Podcast Project",
          }}
          onExportSuccess={(formats) => {
            addToast("Exportación Completada", `Formatos exportados: ${formats.join(", ")}`, "success");
          }}
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

        <footer className="py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <p>SourceFinder Pod © 2026 • Conecta Chava • VSNRY LABS • Todos los derechos reservados.</p>
          <p className="text-[10px] font-mono opacity-60">v0.1.0</p>
        </footer>
      </div>
    </>
  );
}
