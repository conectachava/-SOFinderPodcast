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
import type { ScriptLine } from "@/app/api/script-writer/route";
import { Shield, Sparkles, Activity } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

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
    setSelectedPreset({
      topic: item.topic,
      contentType: "Investigación Personalizada",
      format: userProfile?.preferredFormat || "Análisis",
    });
    setIsHistoryOpen(false);
    setActiveTab("orchestrator");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectPreset={handleSelectPreset}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Progress Indicator for Pipeline Flow */}
          <PipelineProgress
            activeTab={activeTab}
            hasReport={!!reportText}
            hasScript={scriptLines.length > 0} setActiveTab={setActiveTab}
          />

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[700px] flex flex-col relative transition-colors duration-200">
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
        </main>

        {/* Drawers & Modals */}
        <RecentDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectTopic={handleReRunTopicFromHistory}
          onClearHistory={clearHistory}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
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
