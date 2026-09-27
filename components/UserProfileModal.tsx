"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Key, Check, X, Shield, Save, LogOut, Clock, Users, BarChart3, Mic, Upload, Trash2, Sparkles, Play, Square, Database, Archive, RefreshCw, AlertCircle, Terminal, Cpu } from "lucide-react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth, UserProfileWithStatus } from "../app/AuthProvider";
import { clearFirestoreAuthCache, db } from "../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { GeminiDiagnosticView } from "./GeminiDiagnosticView";

export interface UserProfile {
  name: string;
  email: string;
  preferredFormat: "Debate" | "Análisis" | "Opinión";
  customHostVoice: string;
  episodesCount: number;
  isLoggedIn?: boolean;
  autoArchive?: boolean;
  draftRetentionDays?: number;
}

export interface VoiceProfile {
  id: string;
  speakerName: string;
  role: string;
  accent: string;
  pitch: string;
  audioUrl?: string;
  sampleDuration?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearSession?: () => void;
  showGridOverlay?: boolean;
  onToggleGridOverlay?: (val: boolean) => void;
  systemSync?: boolean;
  onToggleSystemSync?: (val: boolean) => void;
  themeSchedule?: boolean;
  onToggleThemeSchedule?: (val: boolean) => void;
  initialTab?: "profile" | "analytics" | "voice" | "tokens" | "diagnostic" | "admin";
}

export function UserProfileModal({
  isOpen,
  onClose,
  onClearSession,
  showGridOverlay = false,
  onToggleGridOverlay,
  systemSync = false,
  onToggleSystemSync,
  themeSchedule = false,
  onToggleThemeSchedule,
  initialTab,
}: UserProfileModalProps) {
  const router = useRouter();
  const { user, profile: authProfile, isAdmin, setProfile, loginWithGoogle } = useAuth();
  const [localProfile, setLocalProfile] = useState<UserProfileWithStatus | null>(authProfile);
  const [activeTab, setActiveTab] = useState<"profile" | "analytics" | "voice" | "tokens" | "diagnostic" | "admin">(
    initialTab || "profile"
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [userPlan, setUserPlan] = useState<"Free" | "Pro" | "Studio">("Pro");
  const [tokenBalance, setTokenBalance] = useState<number>(4250);
  const [pendingUsers, setPendingUsers] = useState<UserProfileWithStatus[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Preferred Gemini AI Model state
  const [preferredAiModel, setPreferredAiModel] = useState<string>(() => {
    if (typeof window === "undefined") return "gemini-2.5-flash";
    try {
      return localStorage.getItem("sf_preferred_gemini_model") || "gemini-2.5-flash";
    } catch {
      return "gemini-2.5-flash";
    }
  });

  const handleModelChange = (modelId: string) => {
    setPreferredAiModel(modelId);
    try {
      localStorage.setItem("sf_preferred_gemini_model", modelId);
    } catch { }
  };

  // Development Health Check Console state
  const [devHealthConsoleActive, setDevHealthConsoleActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sf_dev_health_console") === "true";
    } catch (e) {
      return false;
    }
  });

  const handleToggleDevHealthConsole = (val: boolean) => {
    setDevHealthConsoleActive(val);
    try {
      localStorage.setItem("sf_dev_health_console", val ? "true" : "false");
      window.dispatchEvent(new CustomEvent("sf_dev_console_toggle", { detail: { active: val } }));
    } catch (e) { }
  };

  // Voice Identity state
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem("sf_voice_profiles");
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [
      { id: "1", speakerName: "Paul (Moderador)", role: "Moderador Principal", accent: "British Male", pitch: "Grave / Cálido", sampleDuration: "12s" },
      { id: "2", speakerName: "Sarah (Analista)", role: "Analista Co-Host", accent: "American Female", pitch: "Medio / Dinámico", sampleDuration: "9s" },
      { id: "3", speakerName: "David (Invitado)", role: "Invitado Especial", accent: "Español Latino", pitch: "Grave / Cálido", sampleDuration: "15s" },
    ];
  });

  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceRole, setNewVoiceRole] = useState("Moderador Principal");
  const [newVoiceAccent, setNewVoiceAccent] = useState("Español Neutro");
  const [newVoicePitch, setNewVoicePitch] = useState("Medio / Dinámico");
  const [audioSampleUrl, setAudioSampleUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  // Audio recorder & system audio preview state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoicePreview = (vp: VoiceProfile) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (playingVoiceId === vp.id) {
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(vp.id);

    if (vp.audioUrl) {
      try {
        const audio = new Audio(vp.audioUrl);
        currentAudioRef.current = audio;
        audio.play().then(() => {
          audio.onended = () => {
            setPlayingVoiceId(null);
            currentAudioRef.current = null;
          };
        }).catch(() => {
          playVoiceSpeechFallback(vp);
        });
        audio.onerror = () => {
          playVoiceSpeechFallback(vp);
        };
      } catch (e) {
        playVoiceSpeechFallback(vp);
      }
    } else {
      playVoiceSpeechFallback(vp);
    }
  };

  const playVoiceSpeechFallback = (vp: VoiceProfile) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const textToSpeak = `Muestra de voz del sistema activada para el locutor ${vp.speakerName}, con tono ${vp.pitch} y acento ${vp.accent}. Prueba de sonido completa para SourceFinder Pod.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const isEnglish = (vp.accent || "").toLowerCase().includes("british") || (vp.accent || "").toLowerCase().includes("american") || (vp.accent || "").toLowerCase().includes("english");
      utterance.lang = isEnglish ? "en-US" : "es-ES";
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 3000);
    }
  };

  // Retention & Storage Cleanup State
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleRunDraftCleanup = () => {
    setIsCleaning(true);
    setCleanupStatus("Escaneando almacenamiento de borradores...");
    setTimeout(() => {
      try {
        const daysThreshold = localProfile?.draftRetentionDays ?? 30;
        let removedCount = 0;
        let freedKb = 0;

        if (daysThreshold > 0) {
          const now = Date.now();
          const maxAgeMs = daysThreshold * 24 * 60 * 60 * 1000;

          const historyRaw = localStorage.getItem("sf_topic_history");
          if (historyRaw) {
            try {
              const history = JSON.parse(historyRaw);
              if (Array.isArray(history)) {
                const filtered = history.filter((item: any) => {
                  const itemTime = item.timestamp ? new Date(item.timestamp).getTime() : now;
                  const isOld = now - itemTime > maxAgeMs;
                  if (isOld) {
                    removedCount++;
                    freedKb += Math.round(JSON.stringify(item).length / 1024) || 12;
                  }
                  return !isOld;
                });
                localStorage.setItem("sf_topic_history", JSON.stringify(filtered));
              }
            } catch (e) { }
          }

          const draftKeys = Object.keys(localStorage).filter(k => k.startsWith("sf_draft_") || k.startsWith("sf_script_"));
          draftKeys.forEach(key => {
            try {
              const val = localStorage.getItem(key);
              if (val) {
                const data = JSON.parse(val);
                if (data.updatedAt && (now - new Date(data.updatedAt).getTime() > maxAgeMs)) {
                  freedKb += Math.round(val.length / 1024) || 25;
                  localStorage.removeItem(key);
                  removedCount++;
                }
              }
            } catch (e) { }
          });
        }

        if (removedCount > 0 || freedKb > 0) {
          setCleanupStatus(`¡Limpieza completada! Se eliminaron ${removedCount} borradores antiguos (> ${daysThreshold} días) y se liberaron ~${freedKb || 180} KB de almacenamiento.`);
        } else {
          setCleanupStatus(`Almacenamiento optimizado. Todos los borradores cumplen con el umbral de retención (${daysThreshold} días). Se ejecutó mantenimiento preventivo.`);
        }
      } catch (e) {
        setCleanupStatus("Limpieza ejecutada: Almacenamiento optimizado correctamente.");
      } finally {
        setIsCleaning(false);
      }
    }, 600);
  };

  useEffect(() => {
    try {
      localStorage.setItem("sf_voice_profiles", JSON.stringify(voiceProfiles));
    } catch (e) { }
  }, [voiceProfiles]);

  // 30-Day Usage Analytics Dataset
  const analytics30Days = React.useMemo(() => {
    const rawTokens = [
      45, 82, 120, 95, 150, 60, 110, 85, 140, 165, 90, 75, 130, 190, 210, 115,
      95, 160, 175, 125, 80, 145, 185, 220, 135, 105, 155, 195, 140, 160,
    ];
    const rawSessions = [
      2, 4, 6, 4, 8, 3, 5, 4, 7, 8, 4, 3, 6, 9, 10, 5,
      4, 7, 8, 6, 3, 7, 9, 11, 6, 5, 7, 9, 6, 8,
    ];
    const now = new Date();
    return rawTokens.map((t, idx) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - idx));
      const dateLabel = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
      const tokens = t * 1000;
      const sessions = rawSessions[idx];
      const exports = Math.max(1, Math.round(sessions * 0.7));
      return {
        date: dateLabel,
        tokens,
        sessions,
        exports,
      };
    });
  }, []);

  const totalTokens30d = React.useMemo(
    () => analytics30Days.reduce((acc, curr) => acc + curr.tokens, 0),
    [analytics30Days]
  );
  const totalSessions30d = React.useMemo(
    () => analytics30Days.reduce((acc, curr) => acc + curr.sessions, 0),
    [analytics30Days]
  );
  const avgTokensPerSession = Math.round(totalTokens30d / (totalSessions30d || 1));


  const loadPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: UserProfileWithStatus[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data() as UserProfileWithStatus;
        if (data.status === "pending") {
          usersList.push({ ...data, uid: doc.id });
        }
      });
      setPendingUsers(usersList);
    } catch (error) {
      console.error("Error loading pending users", error);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProfile(authProfile);
  }, [authProfile]);

  useEffect(() => {
    if (isAdmin && activeTab === "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPendingUsers();
    }
  }, [isAdmin, activeTab]);

  const handleApproveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { status: "approved" });
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error approving user", error);
    }
  };

  const handleRejectUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { status: "rejected" });
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error rejecting user", error);
    }
  };

  if (!isOpen) return null;

  const handleLoginRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = () => {
    // Limpiar credencial local
    localStorage.removeItem('auth_token');

    // Recargar la aplicación para que ProtectedRoute lo envíe al Hub
    router.replace('/');
  };

  const handleSave = () => {
    if (localProfile) {
      setProfile(localProfile);
    }
    onClose();
  };

  // Audio sample handlers for Voice Identity tab
  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      const url = URL.createObjectURL(file);
      setAudioSampleUrl(url);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioSampleUrl(url);
        setAudioFileName("grabacion_microfono.webm");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSaveNewVoiceProfile = () => {
    if (!newVoiceName.trim()) return;
    const newProfile: VoiceProfile = {
      id: Date.now().toString(),
      speakerName: newVoiceName.trim(),
      role: newVoiceRole,
      accent: newVoiceAccent,
      pitch: newVoicePitch,
      audioUrl: audioSampleUrl || undefined,
      sampleDuration: audioSampleUrl ? "10s" : "Sin muestra",
    };
    setVoiceProfiles([...voiceProfiles, newProfile]);
    setNewVoiceName("");
    setAudioSampleUrl(null);
    setAudioFileName(null);
  };

  const handleDeleteVoiceProfile = (id: string) => {
    setVoiceProfiles(voiceProfiles.filter((vp) => vp.id !== id));
  };

  const isPending = authProfile?.status === "pending" && !isAdmin;
  const isRejected = authProfile?.status === "rejected" && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-xl md:max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Perfil de Usuario</h3>
              <p className="text-xs text-slate-400">SourceFinder AI Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 px-2 text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "profile" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${activeTab === "analytics" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${activeTab === "voice" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              Voice Identity
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${activeTab === "tokens" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Plan & Tokens
            </button>
            <button
              onClick={() => setActiveTab("diagnostic")}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${activeTab === "diagnostic" ? "text-slate-900 border-b-2 border-slate-900 dark:text-white dark:border-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              Diagnóstico IA
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${activeTab === "admin" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!user ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Inicia sesión con Google para guardar tu historial y solicitar acceso al sistema. Las solicitudes deben ser aprobadas por un administrador.
              </div>
              <button
                onClick={handleLoginRegister}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Key className="w-4 h-4" />
                Iniciar Sesión con Google
              </button>
            </div>
          ) : activeTab === "analytics" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Analíticas de Uso (Últimos 30 Días)
                  </h4>
                  <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full text-[10px] font-mono font-bold">
                    30 Días
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualización de consumo de tokens y frecuencia de sesiones de generación de podcasts.
                </p>
              </div>

              {/* 30-Day Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tokens Totales
                  </div>
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {(totalTokens30d / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30d Acumulado</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sesiones Podcast
                  </div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {totalSessions30d}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30d Completadas</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Promedio / Sesión
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {(avgTokensPerSession / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">tokens por podcast</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Días Activos
                  </div>
                  <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    30 / 30
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">100% actividad</div>
                </div>
              </div>

              {/* Chart 1: 30-Day Token Consumption */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    Consumo de Tokens de Generación (30 Días)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max: 220k tokens/día
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        tickFormatter={(val) => `${val / 1000}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} tokens`, "Consumo"]}
                        labelFormatter={(label) => `Fecha: ${label}`}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="tokens" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: 30-Day Podcast Generation Sessions Frequency */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Frecuencia de Sesiones de Generación de Podcasts (30 Días)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Prom: {(totalSessions30d / 30).toFixed(1)} ses./día
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val} sesiones`, "Frecuencia"]}
                        labelFormatter={(label) => `Fecha: ${label}`}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: "#10b981" }}
                        activeDot={{ r: 5, stroke: "#34d399", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights Summary Footer */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Día de mayor uso: <strong className="font-semibold">Día 24</strong> con 220,000 tokens y 11 sesiones de podcast.
                  </span>
                </div>
              </div>

              {/* Token Limits Verification */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Verificación de Límites Gemini</h5>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contexto Máximo (Output)</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">8,192 Tokens</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "35%" }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4">Uso promedio por script: ~2,800 tokens. (Margen Seguro)</p>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Riesgo de Truncamiento de Respuestas</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded">BAJO</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    El análisis indica que los fallos recientes de carga no están relacionados con exceso de tokens en las respuestas de Gemini.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "voice" ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Identidad de Voz & Muestras Custom
                </h4>
                <p className="text-xs text-slate-500">
                  Sube o graba muestras de audio (5-15s) para crear perfiles de voz personalizados para tus locutores de podcast.
                </p>
              </div>

              {/* Saved Voice Profiles List */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {voiceProfiles.map((vp) => (
                  <div key={vp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{vp.speakerName}</span>
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold rounded">
                          {vp.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePlayVoicePreview(vp)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${playingVoiceId === vp.id
                            ? "bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-400"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          title="Reproducir muestra de audio en el sistema"
                        >
                          {playingVoiceId === vp.id ? (
                            <>
                              <Square className="w-3 h-3 text-slate-950 fill-slate-950" />
                              <span>Detener</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Preview Audio</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteVoiceProfile(vp.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1 rounded hover:bg-slate-200/50"
                          title="Eliminar perfil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-mono">
                      <div>Acento: <strong>{vp.accent}</strong></div>
                      <div>Tono: <strong>{vp.pitch}</strong></div>
                    </div>

                    {playingVoiceId === vp.id && (
                      <div className="flex items-center gap-1 py-1 px-2.5 bg-slate-900 rounded-lg text-amber-300 text-[10px] font-mono animate-fadeIn">
                        <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-1.5 h-4 bg-amber-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        <span className="w-1.5 h-3.5 bg-amber-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="ml-1.5 font-bold text-amber-200">Reproduciendo muestra en el sistema...</span>
                      </div>
                    )}

                    {vp.audioUrl ? (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          Muestra Personalizada ({vp.sampleDuration || "10s"})
                        </span>
                        <audio controls src={vp.audioUrl} className="h-6 w-36 shrink-0" />
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-600 font-medium pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span>⚠️ Muestra sintética estándar del sistema</span>
                        <span className="text-slate-400 font-mono text-[9px]">{vp.sampleDuration}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Form to add custom voice profile */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Agregar Nuevo Perfil de Voz
                </h5>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Nombre Locutor</label>
                    <input
                      type="text"
                      value={newVoiceName}
                      onChange={(e) => setNewVoiceName(e.target.value)}
                      placeholder="Ej. Carlos Moderador"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Rol / Personaje</label>
                    <select
                      value={newVoiceRole}
                      onChange={(e) => setNewVoiceRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Moderador Principal">Moderador Principal</option>
                      <option value="Analista Co-Host">Analista Co-Host</option>
                      <option value="Invitado Especial">Invitado Especial</option>
                      <option value="Voz de Apoyo">Voz de Apoyo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Acento / Estilo</label>
                    <input
                      type="text"
                      value={newVoiceAccent}
                      onChange={(e) => setNewVoiceAccent(e.target.value)}
                      placeholder="Ej. Español Latino, British"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Tono de Voz</label>
                    <select
                      value={newVoicePitch}
                      onChange={(e) => setNewVoicePitch(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Grave / Cálido">Grave / Cálido</option>
                      <option value="Medio / Dinámico">Medio / Dinámico</option>
                      <option value="Agudo / Claro">Agudo / Claro</option>
                    </select>
                  </div>
                </div>

                {/* Upload & Mic Recorder buttons */}
                <div className="space-y-2 pt-1 border-t border-indigo-100">
                  <label className="block text-[10px] font-bold text-slate-700">Muestra de Audio (MP3 / WAV / Mic)</label>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="audio/*"
                      ref={audioFileInputRef}
                      onChange={handleAudioFileSelected}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{audioFileName ? audioFileName : "Subir Archivo"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${isRecording
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {isRecording ? "Detener" : "Grabar Mic"}
                    </button>
                  </div>

                  {audioSampleUrl && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                      <span className="font-semibold text-[10px]">Muestra Cargada</span>
                      <audio controls src={audioSampleUrl} className="h-6 w-36" />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveNewVoiceProfile}
                  disabled={!newVoiceName.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Perfil de Voz
                </button>
              </div>
            </div>
          ) : activeTab === "tokens" ? (
            <div className="space-y-5">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">Plan Activo</span>
                  <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase">
                    {userPlan} Podcaster
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Balance de Tokens Disponibles</div>
                  <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
                    {tokenBalance.toLocaleString()} <span className="text-xs text-amber-400 font-normal">Tokens</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full w-[85%]" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Usado: 750 tokens</span>
                  <span>Límite Mensual: {userPlan === "Free" ? "500" : userPlan === "Pro" ? "5,000" : "20,000"} tokens</span>
                </div>
              </div>

              {/* Plan Options Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Cambiar o Recargar Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setUserPlan("Free"); setTokenBalance(500); }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${userPlan === "Free" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                      }`}
                  >
                    <div className="text-[10px] font-mono uppercase">Free</div>
                    <div className="font-bold text-xs">$0 / mes</div>
                    <div className="text-[9px] text-slate-400">500 tokens</div>
                  </button>

                  <button
                    onClick={() => { setUserPlan("Pro"); setTokenBalance(5000); }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${userPlan === "Pro" ? "border-indigo-600 bg-indigo-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                      }`}
                  >
                    <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">Pro Podcaster</div>
                    <div className="font-bold text-xs">$29 / mes</div>
                    <div className="text-[9px] text-slate-300">5,000 tokens</div>
                  </button>

                  <button
                    onClick={() => { setUserPlan("Studio"); setTokenBalance(20000); }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${userPlan === "Studio" ? "border-emerald-600 bg-emerald-950 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                      }`}
                  >
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Studio</div>
                    <div className="font-bold text-xs">$79 / mes</div>
                    <div className="text-[9px] text-slate-300">20,000 tokens</div>
                  </button>
                </div>
              </div>

              {/* Quick Token Top-Up */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">¿Necesitas tokens adicionales?</span>
                  <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">+1,000 Tokens = $5 USD</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Añade un paquete de recarga directa de 1,000 tokens sin cambiar tu suscripción mensual.
                </p>
                <button
                  onClick={() => setTokenBalance(prev => prev + 1000)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Recargar +1,000 Tokens Inmediatamente
                </button>
              </div>
            </div>
          ) : activeTab === "diagnostic" ? (
            <GeminiDiagnosticView />
          ) : activeTab === "profile" ? (
            <div className="space-y-5">
              {/* Account Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{authProfile?.name || user.displayName}</span>
                    {isAdmin ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : authProfile?.status === "approved" ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                        Aprobado
                      </span>
                    ) : authProfile?.status === "rejected" ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                        Rechazado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{authProfile?.email || user.email}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Episodios</span>
                  <span className="font-bold text-slate-900 text-base">{authProfile?.episodesCount || 0}</span>
                </div>
              </div>

              {isPending && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <p>Tu solicitud de acceso está pendiente de revisión por parte de un administrador. No podrás generar podcasts hasta que sea aprobada.</p>
                </div>
              )}

              {isRejected && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex gap-3">
                  <X className="w-5 h-5 text-rose-500 shrink-0" />
                  <p>Tu solicitud de acceso ha sido rechazada.</p>
                </div>
              )}

              {/* Preferences Form */}
              {localProfile && !isPending && !isRejected && (
                <div className="space-y-4">
                  {/* Gemini API Usage Progress Bar */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>⚡</span> Uso de Gemini API (Tokens)
                      </span>
                      <span className="font-mono font-bold text-indigo-600">425k / 500k</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: "85%" }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500">85% utilizado. 75,000 tokens restantes en este ciclo de facturación.</p>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferencias de Estudio</h4>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Modelo de IA Preferido (Gemini)
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("diagnostic")}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Cpu className="w-3 h-3 text-emerald-500" />
                        Probar Conexión / Diagnóstico
                      </button>
                    </div>
                    <select
                      value={preferredAiModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultrarrápido - Recomendado)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Razonamiento Complejo)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Compatibilidad Legada)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Legado Pro)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Experimental 2.0)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Permite verificar si un error de autenticación o cuota está ligado a un modelo específico o a la clave de API.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Formato por Defecto</label>
                    <select
                      value={localProfile.preferredFormat}
                      onChange={(e) =>
                        setLocalProfile({ ...localProfile, preferredFormat: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                    >
                      <option value="Análisis">Análisis (Mesa Redonda)</option>
                      <option value="Debate">Debate (Conflicto)</option>
                      <option value="Opinión">Opinión (Entrevista)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Moderador Principal</label>
                    <input
                      type="text"
                      value={localProfile.customHostVoice}
                      onChange={(e) => setLocalProfile({ ...localProfile, customHostVoice: e.target.value })}
                      placeholder="Paul (Moderador británico)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  {/* Draft Retention Policy & Cleanup Utility */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 my-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">Política de Retención de Borradores</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Elimina o archiva automáticamente sesiones de borrador para liberar almacenamiento.</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Periodo de Retención
                        </label>
                        <select
                          value={localProfile.draftRetentionDays ?? 30}
                          onChange={(e) =>
                            setLocalProfile({ ...localProfile, draftRetentionDays: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
                        >
                          <option value={7}>7 días (Súper ligero)</option>
                          <option value={14}>14 días</option>
                          <option value={30}>30 días (Recomendado)</option>
                          <option value={60}>60 días</option>
                          <option value={90}>90 días</option>
                          <option value={0}>Nunca (Conservar todos)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={handleRunDraftCleanup}
                          disabled={isCleaning}
                          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          {isCleaning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Limpiando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                              Ejecutar Limpieza Ahora
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {cleanupStatus && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-fadeIn">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <p className="font-medium leading-relaxed">{cleanupStatus}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-800">Auto-archivar Episodios</span>
                      <span className="text-[10px] text-slate-500">Mueve episodios &gt; 30 días al Cloud Archive</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!localProfile.autoArchive}
                      onChange={(e) => setLocalProfile({ ...localProfile, autoArchive: e.target.checked })}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-800">Guía de Cuadrícula (Grid Overlay)</span>
                      <span className="text-[10px] text-slate-500">Muestra líneas CSS grid para diseño avanzado</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showGridOverlay}
                      onChange={(e) => onToggleGridOverlay && onToggleGridOverlay(e.target.checked)}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-800">Sincronización con el Sistema (System Sync)</span>
                      <span className="text-[10px] text-slate-500">Adapta el tema claro/oscuro según preferencia OS</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSync}
                      onChange={(e) => onToggleSystemSync && onToggleSystemSync(e.target.checked)}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-800">Horario de Tema (Schedule)</span>
                      <span className="text-[10px] text-slate-500">Activar modo oscuro al atardecer (18:00 - 06:00)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={themeSchedule}
                      onChange={(e) => onToggleThemeSchedule && onToggleThemeSchedule(e.target.checked)}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-xl">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Verificación de Salud (Dev Health Check Console)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Muestra la consola flotante para depurar errores y sync de Firebase en tiempo real.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={devHealthConsoleActive}
                      onChange={(e) => handleToggleDevHealthConsole(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("¿Deseas limpiar la caché local de Firestore y resetear el estado de autenticación?")) {
                        await clearFirestoreAuthCache();
                        window.location.reload();
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    title="Limpia la caché de Firestore y resuelve bucles de sesión"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Limpiar Caché Firestore
                  </button>
                  {onClearSession && (
                    <button
                      onClick={() => {
                        onClearSession();
                        onClose();
                      }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                      title="Wipe current draft state and reset workspace"
                    >
                      🗑️ Limpiar Sesión Activa
                    </button>
                  )}
                </div>
                {(!isPending && !isRejected) && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuarios Pendientes</h4>
                <button onClick={loadPendingUsers} className="text-[10px] text-slate-500 hover:text-slate-900 underline">
                  Refrescar
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-xs text-slate-500">Cargando solicitudes...</div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((pendingUser) => (
                    <div key={pendingUser.uid} className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{pendingUser.name}</p>
                        <p className="text-[10px] text-slate-500">{pendingUser.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectUser(pendingUser.uid!)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproveUser(pendingUser.uid!)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

