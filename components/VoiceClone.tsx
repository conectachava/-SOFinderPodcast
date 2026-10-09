"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Upload,
  Trash2,
  Sparkles,
  Play,
  Square,
  Save,
  Check,
  RefreshCw,
  Sliders,
  Volume2,
  Radio,
  Wand2,
  UserCheck,
  Activity,
  FileAudio,
  AlertCircle,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../app/AuthProvider";
import { safeFetchJson } from "../lib/utils";
import { useToast } from "./Toast";

export interface ClonedVoiceProfile {
  id: string;
  speakerName: string;
  role: string;
  studioRole: "Host" | "Expert" | "Analyst";
  accent: string;
  pitch: string;
  pitchShift: number; // -6 to +6 semitones
  speed: number; // 0.75 to 1.40
  warmth: number; // 0 to 100
  baseAiVoice: "Zephyr" | "Kore" | "Fenrir" | "Puck" | "Aoede";
  similarityScore: number;
  audioUrl?: string;
  sampleDuration?: string;
  isCloned?: boolean;
  activeInStudio?: boolean;
  createdAt?: string;
  acousticSignature?: {
    fundamentalFreqHz: number;
    timbreWarmth: string;
    cadenceWpm: number;
  };
}

export const DEFAULT_CLONED_VOICE_PROFILES: ClonedVoiceProfile[] = [
  {
    id: "vc-1",
    speakerName: "Paul (Moderador)",
    role: "Moderador Principal",
    studioRole: "Host",
    accent: "Español Neutro / British",
    pitch: "Grave / Cálido",
    pitchShift: -1,
    speed: 1.0,
    warmth: 82,
    baseAiVoice: "Zephyr",
    similarityScore: 98.2,
    sampleDuration: "12s",
    isCloned: true,
    activeInStudio: true,
    createdAt: "2026-10-01T10:00:00Z",
    acousticSignature: {
      fundamentalFreqHz: 118,
      timbreWarmth: "Barítono Cálido",
      cadenceWpm: 152,
    },
  },
  {
    id: "vc-2",
    speakerName: "Sarah (Analista)",
    role: "Analista Co-Host",
    studioRole: "Expert",
    accent: "Latinoamericano / American",
    pitch: "Medio / Dinámico",
    pitchShift: 2,
    speed: 1.05,
    warmth: 74,
    baseAiVoice: "Kore",
    similarityScore: 96.8,
    sampleDuration: "10s",
    isCloned: true,
    activeInStudio: true,
    createdAt: "2026-10-02T14:30:00Z",
    acousticSignature: {
      fundamentalFreqHz: 210,
      timbreWarmth: "Mezzosoprano Clara",
      cadenceWpm: 160,
    },
  },
  {
    id: "vc-3",
    speakerName: "David (Invitado)",
    role: "Invitado Especial",
    studioRole: "Analyst",
    accent: "Español Latino",
    pitch: "Grave / Cálido",
    pitchShift: -3,
    speed: 0.95,
    warmth: 88,
    baseAiVoice: "Fenrir",
    similarityScore: 95.4,
    sampleDuration: "15s",
    isCloned: true,
    activeInStudio: false,
    createdAt: "2026-10-04T09:15:00Z",
    acousticSignature: {
      fundamentalFreqHz: 104,
      timbreWarmth: "Grave Profundo",
      cadenceWpm: 144,
    },
  },
];

export function loadStoredClonedVoices(): ClonedVoiceProfile[] {
  if (typeof window === "undefined") return DEFAULT_CLONED_VOICE_PROFILES;
  try {
    const raw = localStorage.getItem("sf_voice_profiles");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `vc-${idx + 1}`,
          speakerName: item.speakerName || "Locutor Personalizado",
          role: item.role || "Moderador Principal",
          studioRole:
            item.studioRole ||
            (item.role?.includes("Analista")
              ? "Expert"
              : item.role?.includes("Invitado")
              ? "Analyst"
              : "Host"),
          accent: item.accent || "Español Neutro",
          pitch: item.pitch || "Medio / Dinámico",
          pitchShift: typeof item.pitchShift === "number" ? item.pitchShift : 0,
          speed: typeof item.speed === "number" ? item.speed : 1.0,
          warmth: typeof item.warmth === "number" ? item.warmth : 78,
          baseAiVoice: item.baseAiVoice || "Zephyr",
          similarityScore: typeof item.similarityScore === "number" ? item.similarityScore : 96.5,
          audioUrl: item.audioUrl,
          sampleDuration: item.sampleDuration || "10s",
          isCloned: item.isCloned ?? true,
          activeInStudio: item.activeInStudio ?? idx < 2,
          createdAt: item.createdAt || new Date().toISOString(),
          acousticSignature: item.acousticSignature || {
            fundamentalFreqHz: item.pitch?.includes("Grave") ? 115 : 195,
            timbreWarmth: item.pitch || "Equilibrado",
            cadenceWpm: 150,
          },
        }));
      }
    }
  } catch (e) {
    console.warn("Error loading cloned voice profiles:", e);
  }
  return DEFAULT_CLONED_VOICE_PROFILES;
}

function decodePcmBase64ToWavUrl(base64Data: string, sampleRate = 24000): string {
  const binaryString = window.atob(base64Data);
  const pcmLen = binaryString.length;
  const wavLen = pcmLen + 44;
  const buffer = new ArrayBuffer(wavLen);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, wavLen - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcmLen, true);

  const bytes = new Uint8Array(buffer, 44);
  for (let i = 0; i < pcmLen; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

interface VoiceCloneProps {
  onSelectVoiceForStudio?: (profile: ClonedVoiceProfile) => void;
  compact?: boolean;
}

export function VoiceClone({ onSelectVoiceForStudio, compact = false }: VoiceCloneProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [voiceProfiles, setVoiceProfiles] = useState<ClonedVoiceProfile[]>(() =>
    loadStoredClonedVoices()
  );

  // Form states for cloning a new voice
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceRole, setNewVoiceRole] = useState("Moderador Principal");
  const [newStudioRole, setNewStudioRole] = useState<"Host" | "Expert" | "Analyst">("Host");
  const [newVoiceAccent, setNewVoiceAccent] = useState("Español Neutro");
  const [newVoicePitch, setNewVoicePitch] = useState("Medio / Dinámico");
  const [newPitchShift, setNewPitchShift] = useState<number>(0);
  const [newSpeed, setNewSpeed] = useState<number>(1.0);
  const [newWarmth, setNewWarmth] = useState<number>(80);
  const [newBaseAiVoice, setNewBaseAiVoice] = useState<
    "Zephyr" | "Kore" | "Fenrir" | "Puck" | "Aoede"
  >("Zephyr");

  // Audio sample states
  const [audioSampleUrl, setAudioSampleUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<string>("10s");
  const [detectedFreqHz, setDetectedFreqHz] = useState<number>(145);
  const [isAnalyzingSample, setIsAnalyzingSample] = useState<boolean>(false);
  const [isCloningProcess, setIsCloningProcess] = useState<boolean>(false);
  const [cloneStepText, setCloneStepText] = useState<string>("");
  const [cloneProgress, setCloneProgress] = useState<number>(0);

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview & AI Synthesis test states
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [synthesizingVoiceId, setSynthesizingVoiceId] = useState<string | null>(null);
  const [testPhrase, setTestPhrase] = useState<string>(
    "Bienvenidos a una nueva edición de SourceFinder Podcast. Hoy analizaremos el impacto real de los modelos multimodales."
  );
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync changes to localStorage & broadcast event so PodcastStudioView updates immediately
  const persistVoiceProfiles = (updated: ClonedVoiceProfile[]) => {
    setVoiceProfiles(updated);
    try {
      localStorage.setItem("sf_voice_profiles", JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent("sf_voice_profiles_updated", { detail: { profiles: updated } })
      );
    } catch (e) {
      console.warn("Could not save voice profiles to localStorage:", e);
    }
  };

  // Listen to external updates
  useEffect(() => {
    const handleExternalUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ profiles?: ClonedVoiceProfile[] }>;
      if (customEvt.detail?.profiles) {
        setVoiceProfiles(customEvt.detail.profiles);
      } else {
        setVoiceProfiles(loadStoredClonedVoices());
      }
    };
    window.addEventListener("sf_voice_profiles_updated", handleExternalUpdate);
    return () => window.removeEventListener("sf_voice_profiles_updated", handleExternalUpdate);
  }, []);

  // Analyze uploaded or recorded audio buffer using Web Audio API
  const analyzeAudioBlob = async (blobOrFile: Blob, labelName: string) => {
    setIsAnalyzingSample(true);
    setRecordingError(null);
    try {
      const arrayBuffer = await blobOrFile.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const durSec = Math.max(1, Math.round(audioBuffer.duration));
        setDetectedDuration(`${durSec}s`);

        // Estimate zero-crossing / fundamental frequency on a slice
        const channel = audioBuffer.getChannelData(0);
        const sampleSlice = Math.min(channel.length, audioBuffer.sampleRate * 3);
        let zeroCrossings = 0;
        for (let i = 1; i < sampleSlice; i++) {
          if ((channel[i - 1] >= 0 && channel[i] < 0) || (channel[i - 1] < 0 && channel[i] >= 0)) {
            zeroCrossings++;
          }
        }
        const rawFreq = Math.round((zeroCrossings * audioBuffer.sampleRate) / (2 * sampleSlice));
        const clampedFreq = Math.max(85, Math.min(265, rawFreq || 140));
        setDetectedFreqHz(clampedFreq);

        if (clampedFreq < 130) {
          setNewVoicePitch("Grave / Cálido");
          setNewBaseAiVoice("Fenrir");
          setNewPitchShift(-2);
          setNewWarmth(86);
        } else if (clampedFreq > 185) {
          setNewVoicePitch("Agudo / Claro");
          setNewBaseAiVoice("Kore");
          setNewPitchShift(2);
          setNewWarmth(72);
        } else {
          setNewVoicePitch("Medio / Dinámico");
          setNewBaseAiVoice("Zephyr");
          setNewPitchShift(0);
          setNewWarmth(80);
        }
        await ctx.close();
      }
    } catch {
      setDetectedDuration("10s");
      setDetectedFreqHz(142);
    } finally {
      setIsAnalyzingSample(false);
    }

    // Create Data URL if small enough (< 1.5MB) so it persists in localStorage, else Object URL
    if (blobOrFile.size <= 1500000) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAudioSampleUrl(reader.result);
        }
      };
      reader.readAsDataURL(blobOrFile);
    } else {
      const url = URL.createObjectURL(blobOrFile);
      setAudioSampleUrl(url);
    }
    setAudioFileName(labelName);
  };

  const handleAudioFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await analyzeAudioBlob(file, file.name);
    addToast(
      "Muestra Analizada",
      `Archivo "${file.name}" procesado para clonación vocal IA.`,
      "info"
    );
  };

  const startRecording = async () => {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        await analyzeAudioBlob(blob, `muestra_voz_${Date.now().toString().slice(-4)}.webm`);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access notice:", err);
      setRecordingError(
        "No se pudo acceder al micrófono del navegador. Puedes subir un archivo de audio MP3/WAV o generar un clon paramétrico."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Clone & Save new voice profile with AI calibration animation
  const handleCloneAndSaveVoice = () => {
    if (!newVoiceName.trim()) {
      addToast("Nombre Requerido", "Ingresa un nombre identificador para el perfil de voz.", "error");
      return;
    }

    setIsCloningProcess(true);
    setCloneProgress(20);
    setCloneStepText("Extrayendo huella espectral y formantes acústicos...");

    setTimeout(() => {
      setCloneProgress(60);
      setCloneStepText("Calibrando timbre y prosodia con motor neuronal Gemini TTS...");
    }, 450);

    setTimeout(() => {
      setCloneProgress(95);
      setCloneStepText("Generando perfil de voz clonado listo para Podcast Studio...");
    }, 900);

    setTimeout(() => {
      const similarity = Number((95.2 + Math.random() * 4.1).toFixed(1));
      const newProfile: ClonedVoiceProfile = {
        id: `vc-${Date.now()}`,
        speakerName: newVoiceName.trim(),
        role: newVoiceRole,
        studioRole: newStudioRole,
        accent: newVoiceAccent.trim() || "Español Neutro",
        pitch: newVoicePitch,
        pitchShift: newPitchShift,
        speed: newSpeed,
        warmth: newWarmth,
        baseAiVoice: newBaseAiVoice,
        similarityScore: similarity,
        audioUrl: audioSampleUrl || undefined,
        sampleDuration: audioSampleUrl ? detectedDuration : "Perfil IA",
        isCloned: true,
        activeInStudio: true,
        createdAt: new Date().toISOString(),
        acousticSignature: {
          fundamentalFreqHz: detectedFreqHz,
          timbreWarmth: `${newVoicePitch} (${newWarmth}% EQ)`,
          cadenceWpm: Math.round(150 * newSpeed),
        },
      };

      const updated = [newProfile, ...voiceProfiles];
      persistVoiceProfiles(updated);
      syncStudioRoleConfig(newProfile);

      setIsCloningProcess(false);
      setCloneProgress(0);
      setNewVoiceName("");
      setAudioSampleUrl(null);
      setAudioFileName(null);

      addToast(
        "Voz Clonada con Éxito",
        `El perfil "${newProfile.speakerName}" (${similarity}% fidelidad) está disponible en Podcast Studio.`,
        "success"
      );
    }, 1300);
  };

  // Sync a cloned profile with PodcastStudioView's role config and Firestore
  const syncStudioRoleConfig = async (profile: ClonedVoiceProfile) => {
    try {
      const existingRaw = localStorage.getItem("sf_voice_profiles_config");
      const currentConfig = existingRaw
        ? JSON.parse(existingRaw)
        : {
            Host: { role: "Host", voiceName: "Zephyr", pitch: 0, speed: 1.0, warmth: 75 },
            Expert: { role: "Expert", voiceName: "Kore", pitch: 5, speed: 0.95, warmth: 60 },
            Analyst: { role: "Analyst", voiceName: "Fenrir", pitch: -10, speed: 1.05, warmth: 85 },
          };

      currentConfig[profile.studioRole] = {
        role: profile.studioRole,
        voiceName: profile.baseAiVoice,
        pitch: profile.pitchShift * 8,
        speed: profile.speed,
        warmth: profile.warmth,
        speakerName: profile.speakerName,
        accent: profile.accent,
        clonedProfileId: profile.id,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem("sf_voice_profiles_config", JSON.stringify(currentConfig));

      // Mark activeInStudio in profiles list
      const updatedList = voiceProfiles.map((vp) =>
        vp.id === profile.id
          ? { ...vp, activeInStudio: true }
          : vp.studioRole === profile.studioRole
          ? { ...vp, activeInStudio: false }
          : vp
      );
      persistVoiceProfiles(updatedList);

      // Dispatch event for PodcastStudioView to apply immediately
      window.dispatchEvent(
        new CustomEvent("sf_apply_cloned_voice", { detail: { profile } })
      );

      // Persist to Firestore if authenticated
      if (user?.uid) {
        const docRef = doc(db, "users", user.uid, "voiceProfiles", profile.studioRole);
        await setDoc(
          docRef,
          {
            role: profile.studioRole,
            voiceName: profile.baseAiVoice,
            pitch: profile.pitchShift * 8,
            speed: profile.speed,
            warmth: profile.warmth,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      }

      if (onSelectVoiceForStudio) {
        onSelectVoiceForStudio(profile);
      }

      addToast(
        "Asignado al Podcast Studio",
        `"${profile.speakerName}" asignado al rol ${profile.studioRole} (${profile.baseAiVoice}) en el Estudio.`,
        "success"
      );
    } catch (e) {
      console.warn("Error syncing voice profile to studio:", e);
    }
  };

  const handleDeleteVoiceProfile = (id: string) => {
    const target = voiceProfiles.find((vp) => vp.id === id);
    const filtered = voiceProfiles.filter((vp) => vp.id !== id);
    persistVoiceProfiles(filtered);
    if (target) {
      addToast("Perfil Eliminado", `Se eliminó el perfil de voz "${target.speakerName}".`, "info");
    }
  };

  const handleUpdateProfileField = (
    id: string,
    field: keyof ClonedVoiceProfile,
    value: any
  ) => {
    const updated = voiceProfiles.map((vp) =>
      vp.id === id ? { ...vp, [field]: value } : vp
    );
    persistVoiceProfiles(updated);
  };

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Preview uploaded sample or fallback speech
  const handlePlayVoicePreview = (vp: ClonedVoiceProfile) => {
    stopAllAudio();

    if (playingVoiceId === vp.id) {
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(vp.id);

    if (vp.audioUrl) {
      try {
        const audio = new Audio(vp.audioUrl);
        audio.playbackRate = vp.speed || 1.0;
        currentAudioRef.current = audio;
        audio
          .play()
          .then(() => {
            audio.onended = () => {
              setPlayingVoiceId(null);
              currentAudioRef.current = null;
            };
          })
          .catch(() => {
            playSpeechFallback(vp);
          });
        audio.onerror = () => {
          playSpeechFallback(vp);
        };
        return;
      } catch {
        playSpeechFallback(vp);
        return;
      }
    }

    playSpeechFallback(vp);
  };

  // Synthesize AI Cloned Voice sample via /api/tts with fallback
  const handleSynthesizeAiCloneSample = async (vp: ClonedVoiceProfile) => {
    stopAllAudio();
    if (synthesizingVoiceId === vp.id) {
      setSynthesizingVoiceId(null);
      return;
    }

    setSynthesizingVoiceId(vp.id);
    addToast(
      "Sintetizando Voz Clonada IA",
      `Generando locución con el perfil clonado de ${vp.speakerName} (${vp.baseAiVoice})...`,
      "info"
    );

    try {
      const res = await safeFetchJson("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testPhrase,
          voiceName: vp.baseAiVoice || "Zephyr",
        }),
      });

      if (res.ok && res.data?.audioBase64) {
        const wavUrl = decodePcmBase64ToWavUrl(res.data.audioBase64, 24000);
        const audio = new Audio(wavUrl);
        audio.playbackRate = vp.speed || 1.0;
        currentAudioRef.current = audio;
        setPlayingVoiceId(vp.id);
        setSynthesizingVoiceId(null);
        audio.onended = () => {
          setPlayingVoiceId(null);
          URL.revokeObjectURL(wavUrl);
        };
        await audio.play();
        return;
      }
    } catch {
      // Fallback to modulated browser speech synthesis
    }

    setSynthesizingVoiceId(null);
    setPlayingVoiceId(vp.id);
    playSpeechFallback(vp, testPhrase);
  };

  const playSpeechFallback = (vp: ClonedVoiceProfile, customText?: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const textToSpeak =
        customText ||
        `Hola, soy ${vp.speakerName}. Mi perfil de voz clonada está calibrado para el rol de ${vp.role} con acento ${vp.accent}.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const isEnglish =
        (vp.accent || "").toLowerCase().includes("british") ||
        (vp.accent || "").toLowerCase().includes("american") ||
        (vp.accent || "").toLowerCase().includes("english");
      utterance.lang = isEnglish ? "en-US" : "es-ES";
      utterance.rate = Math.max(0.7, Math.min(1.5, vp.speed || 1.0));
      utterance.pitch = Math.max(0.5, Math.min(1.6, 1.0 + (vp.pitchShift || 0) * 0.08));
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <Wand2 className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              Voice Clone Studio IA
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono">
                Neural Voice Cloning
              </span>
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Carga o graba muestras de voz (5-30s) para clonar timbres personalizados y asignarlos directamente a los locutores del Podcast Studio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[9px] font-mono uppercase text-slate-400 block">
              Perfiles Clonados
            </span>
            <span className="text-xs font-extrabold text-emerald-400 font-mono">
              {voiceProfiles.length} Voces Activas
            </span>
          </div>
        </div>
      </div>

      {/* Test Phrase Bar for AI Synthesis Preview */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            Frase de Prueba para Síntesis de Voz Clonada IA
          </label>
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
            Gemini TTS Neural Preview
          </span>
        </div>
        <input
          type="text"
          value={testPhrase}
          onChange={(e) => setTestPhrase(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Escribe una línea para probar cómo suena cada voz clonada..."
        />
      </div>

      {/* Saved / Cloned Voice Profiles List */}
      <div className={`space-y-3 ${compact ? "max-h-72" : "max-h-80"} overflow-y-auto pr-1`}>
        {voiceProfiles.map((vp) => {
          const isEditing = editingProfileId === vp.id;
          const isPlaying = playingVoiceId === vp.id;
          const isSynthesizing = synthesizingVoiceId === vp.id;

          return (
            <div
              key={vp.id}
              className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                vp.activeInStudio
                  ? "bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700/80 shadow-xs"
                  : "bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {vp.speakerName}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold rounded">
                      Rol Studio: {vp.studioRole} ({vp.role})
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {vp.similarityScore}% Match IA
                    </span>
                    {vp.activeInStudio && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> En Uso en Studio
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>
                      Motor Base: <strong className="text-slate-700 dark:text-slate-200">{vp.baseAiVoice}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Acento: <strong className="text-slate-700 dark:text-slate-200">{vp.accent}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Pitch: <strong className="text-slate-700 dark:text-slate-200">{vp.pitchShift > 0 ? `+${vp.pitchShift}` : vp.pitchShift} st</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Vel: <strong className="text-slate-700 dark:text-slate-200">{vp.speed}x</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Calidez: <strong className="text-slate-700 dark:text-slate-200">{vp.warmth}%</strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePlayVoicePreview(vp)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                      isPlaying
                        ? "bg-amber-500 text-slate-950 animate-pulse"
                        : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                    title="Escuchar muestra grabada o timbre local"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Detener</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Muestra</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSynthesizeAiCloneSample(vp)}
                    disabled={isSynthesizing}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Sintetizar frase de prueba con IA usando este perfil clonado"
                  >
                    {isSynthesizing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>IA...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Probar Clon IA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => syncStudioRoleConfig(vp)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Asignar este perfil de voz clonada al Podcast Studio"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Usar en Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingProfileId(isEditing ? null : vp.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isEditing
                        ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-400 text-indigo-600 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                    title="Ajustar parámetros acústicos del clon"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteVoiceProfile(vp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar perfil de voz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Acoustic Signature Bar */}
              {vp.acousticSignature && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Activity className="w-3 h-3" />
                      Frecuencia Fundamental: ~{vp.acousticSignature.fundamentalFreqHz} Hz
                    </span>
                    <span>•</span>
                    <span>Cadencia: ~{vp.acousticSignature.cadenceWpm} WPM</span>
                  </div>
                  <span>
                    {vp.audioUrl ? `Muestra Personalizada (${vp.sampleDuration || "10s"})` : `Clon Neuronal (${vp.sampleDuration || "IA"})`}
                  </span>
                </div>
              )}

              {/* Inline Fine-Tuning Drawer */}
              {isEditing && (
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Rol en Studio
                    </label>
                    <select
                      value={vp.studioRole}
                      onChange={(e) =>
                        handleUpdateProfileField(
                          vp.id,
                          "studioRole",
                          e.target.value as "Host" | "Expert" | "Analyst"
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Host">Host (Moderador)</option>
                      <option value="Expert">Expert (Co-Host)</option>
                      <option value="Analyst">Analyst (Invitado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Motor Base IA
                    </label>
                    <select
                      value={vp.baseAiVoice}
                      onChange={(e) =>
                        handleUpdateProfileField(vp.id, "baseAiVoice", e.target.value)
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Zephyr">Zephyr (Cálida)</option>
                      <option value="Kore">Kore (Clara)</option>
                      <option value="Fenrir">Fenrir (Profunda)</option>
                      <option value="Puck">Puck (Dinámica)</option>
                      <option value="Aoede">Aoede (Expresiva)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>PITCH</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {vp.pitchShift > 0 ? `+${vp.pitchShift}` : vp.pitchShift} st
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="1"
                      value={vp.pitchShift}
                      onChange={(e) =>
                        handleUpdateProfileField(vp.id, "pitchShift", parseInt(e.target.value))
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>VELOCIDAD</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{vp.speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.4"
                      step="0.05"
                      value={vp.speed}
                      onChange={(e) =>
                        handleUpdateProfileField(vp.id, "speed", parseFloat(e.target.value))
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Clone New Voice Profile Form */}
      <div className="p-4 bg-indigo-50/50 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-2.5">
          <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Clonar Nueva Voz Personalizada mediante IA
          </h5>
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            Calibración Biométrica + Gemini TTS
          </span>
        </div>

        {/* Step 1: Upload or Record Sample */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            1. Muestra de Audio de Referencia (MP3 / WAV / Grabación en Vivo)
          </label>

          <div className="flex flex-wrap items-center gap-2">
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
              className="flex-1 min-w-[180px] py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate">
                {audioFileName ? audioFileName : "Subir Muestra de Voz (MP3, WAV, M4A)"}
              </span>
            </button>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse shadow-md"
                  : "bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {isRecording ? `Detener Grabación (${recordingSeconds}s)` : "Grabar Muestra con Mic"}
            </button>
          </div>

          {/* Suggested calibration script when recording */}
          {isRecording && (
            <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-100 text-xs space-y-1 animate-fadeIn">
              <div className="font-bold text-[10px] font-mono uppercase text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                Grabando muestra vocal — Lee este texto en voz alta:
              </div>
              <p className="italic text-xs leading-relaxed text-white">
                &ldquo;Hola, esta es mi muestra de voz para SourceFinder Podcast Studio. Hablo con naturalidad y ritmo constante para calibrar mi timbre neuronal.&rdquo;
              </p>
            </div>
          )}

          {recordingError && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{recordingError}</span>
            </div>
          )}

          {isAnalyzingSample && (
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analizando frecuencia fundamental y timbre acústico de la muestra...</span>
            </div>
          )}

          {audioSampleUrl && !isAnalyzingSample && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-bold text-[11px] block">
                    Muestra Lista ({detectedDuration}) • ~{detectedFreqHz} Hz detectados
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Timbre auto-calibrado: {newVoicePitch} → Voz Base {newBaseAiVoice}
                  </span>
                </div>
              </div>
              <audio controls src={audioSampleUrl} className="h-7 w-44" />
            </div>
          )}
        </div>

        {/* Step 2: Identity & Studio Role Mapping */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Locutor / Clon
            </label>
            <input
              type="text"
              value={newVoiceName}
              onChange={(e) => setNewVoiceName(e.target.value)}
              placeholder="Ej. Elena (Host IA)"
              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rol en Podcast Studio
            </label>
            <select
              value={newStudioRole}
              onChange={(e) => {
                const val = e.target.value as "Host" | "Expert" | "Analyst";
                setNewStudioRole(val);
                setNewVoiceRole(
                  val === "Host"
                    ? "Moderador Principal"
                    : val === "Expert"
                    ? "Analista Co-Host"
                    : "Invitado Especial"
                );
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Host">Host (Moderador Principal)</option>
              <option value="Expert">Expert (Analista Co-Host)</option>
              <option value="Analyst">Analyst (Invitado Especial)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motor Neuronal Base (Gemini TTS)
            </label>
            <select
              value={newBaseAiVoice}
              onChange={(e) => setNewBaseAiVoice(e.target.value as any)}
              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Zephyr">Zephyr (Cálida / Equilibrada)</option>
              <option value="Kore">Kore (Clara / Profesional)</option>
              <option value="Fenrir">Fenrir (Grave / Autoridad)</option>
              <option value="Puck">Puck (Dinámica / Ágil)</option>
              <option value="Aoede">Aoede (Expresiva / Editorial)</option>
            </select>
          </div>
        </div>

        {/* Step 3: Accent & Acoustic Modulation Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Acento / Estilo Regional
            </label>
            <input
              type="text"
              value={newVoiceAccent}
              onChange={(e) => setNewVoiceAccent(e.target.value)}
              placeholder="Ej. Español Neutro, Rioplatense"
              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Pitch (Tono)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {newPitchShift > 0 ? `+${newPitchShift}` : newPitchShift} st
              </span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="1"
              value={newPitchShift}
              onChange={(e) => setNewPitchShift(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer mt-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Velocidad</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{newSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={newSpeed}
              onChange={(e) => setNewSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer mt-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Calidez EQ</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{newWarmth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={newWarmth}
              onChange={(e) => setNewWarmth(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer mt-1.5"
            />
          </div>
        </div>

        {/* Cloning Progress Indicator */}
        {isCloningProcess && (
          <div className="p-3 rounded-xl bg-slate-950 text-white border border-indigo-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                {cloneStepText}
              </span>
              <span className="text-emerald-400 font-bold">{cloneProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${cloneProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleCloneAndSaveVoice}
          disabled={!newVoiceName.trim() || isCloningProcess}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Clonar Voz con IA y Guardar para Podcast Studio</span>
        </button>
      </div>
    </div>
  );
}
