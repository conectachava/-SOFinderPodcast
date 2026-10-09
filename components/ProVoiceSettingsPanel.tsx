"use client";

import React, { useState, useMemo } from "react";
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Mic,
  Wand2,
  Check,
  ChevronDown,
  ChevronUp,
  Gauge,
  Activity,
  Flame,
  Filter,
} from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { safeFetchJson } from "@/lib/utils";
import { useToast } from "./Toast";

export type EmotionalEmphasisType =
  | "neutral"
  | "enthusiastic"
  | "concerned"
  | "thoughtful"
  | "dramatic"
  | "persuasive";

export interface ProVoiceLineSetting {
  lineId: string;
  pitch: number; // -6 to +6 semitones
  speed: number; // 0.5 to 2.0x
  emotion: EmotionalEmphasisType;
  emphasisIntensity: number; // 0 to 100%
  prosodyInflection: "natural" | "rising" | "falling" | "punchy";
}

export const EMOTIONAL_EMPHASIS_OPTIONS: {
  id: EmotionalEmphasisType;
  label: string;
  shortLabel: string;
  description: string;
  defaultPitch: number;
  defaultSpeed: number;
  defaultIntensity: number;
  directiveEs: string;
  badgeClass: string;
}[] = [
  {
    id: "neutral",
    label: "Equilibrado · Editorial",
    shortLabel: "Equilibrado",
    description: "Dicción clara, ritmo estable y proyección objetiva de estudio.",
    defaultPitch: 0,
    defaultSpeed: 1.0,
    defaultIntensity: 50,
    directiveEs: "con tono equilibrado, claro y periodístico",
    badgeClass:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  },
  {
    id: "enthusiastic",
    label: "Entusiasta · Energético",
    shortLabel: "Entusiasta",
    description: "Mayor brillo vocal, cadencia ágil y proyección de alto impacto.",
    defaultPitch: 1.5,
    defaultSpeed: 1.12,
    defaultIntensity: 85,
    directiveEs: "con gran entusiasmo, energía dinámica y énfasis vibrante",
    badgeClass:
      "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  },
  {
    id: "concerned",
    label: "Crítico · Alerta",
    shortLabel: "Crítico / Alerta",
    description: "Tono grave, articulación firme y énfasis en advertencias o riesgos.",
    defaultPitch: -1.5,
    defaultSpeed: 0.94,
    defaultIntensity: 78,
    directiveEs: "con tono serio, crítico y énfasis de urgencia analítica",
    badgeClass:
      "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
  },
  {
    id: "thoughtful",
    label: "Reflexivo · Pausado",
    shortLabel: "Reflexivo",
    description: "Cadencia contemplativa, calidez en graves y pausas de reflexión.",
    defaultPitch: -1.0,
    defaultSpeed: 0.88,
    defaultIntensity: 65,
    directiveEs: "de forma reflexiva, pausada y con profundidad analítica",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  },
  {
    id: "dramatic",
    label: "Dramático · Intenso",
    shortLabel: "Dramático",
    description: "Contraste dinámico marcado, tensión narrativa y acentuación fuerte.",
    defaultPitch: -2.0,
    defaultSpeed: 0.9,
    defaultIntensity: 92,
    directiveEs: "con intensidad dramática, suspenso y fuerte peso emocional",
    badgeClass:
      "bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
  },
  {
    id: "persuasive",
    label: "Persuasivo · Convincente",
    shortLabel: "Persuasivo",
    description: "Presencia cercana, convicción firme y cadencia orientada a persuadir.",
    defaultPitch: 0.5,
    defaultSpeed: 1.04,
    defaultIntensity: 80,
    directiveEs: "con tono persuasivo, seguro y énfasis convincente en cada argumento",
    badgeClass:
      "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
  },
];

export const PROSODY_INFLECTION_OPTIONS: {
  id: ProVoiceLineSetting["prosodyInflection"];
  label: string;
  hint: string;
}[] = [
  { id: "natural", label: "Fluidez Natural", hint: "Curva melódica orgánica de conversación" },
  { id: "rising", label: "Inflexión Ascendente (↗)", hint: "Ideal para preguntas, apertura o expectativa" },
  { id: "falling", label: "Cierre Afirmativo (↘)", hint: "Ideal para conclusiones contundentes y datos" },
  { id: "punchy", label: "Ataque Marcado (⚡)", hint: "Acentúa sílabas tónicas y cifras clave" },
];

export function buildDefaultProVoiceSetting(line: ScriptLine): ProVoiceLineSetting {
  const rawSent = (line.sentiment || line.emotion || "neutral").toLowerCase();
  let emotion: EmotionalEmphasisType = "neutral";
  if (rawSent.includes("enthusiastic") || rawSent.includes("entusiasta")) {
    emotion = "enthusiastic";
  } else if (rawSent.includes("concerned") || rawSent.includes("preocupad") || rawSent.includes("alerta")) {
    emotion = "concerned";
  } else if (rawSent.includes("thoughtful") || rawSent.includes("reflexiv") || rawSent.includes("calm")) {
    emotion = "thoughtful";
  } else if (rawSent.includes("dramatic") || rawSent.includes("intenso")) {
    emotion = "dramatic";
  } else if (rawSent.includes("persuasiv")) {
    emotion = "persuasive";
  }

  const preset =
    EMOTIONAL_EMPHASIS_OPTIONS.find((o) => o.id === emotion) || EMOTIONAL_EMPHASIS_OPTIONS[0];

  return {
    lineId: line.id,
    pitch: preset.defaultPitch,
    speed: preset.defaultSpeed,
    emotion,
    emphasisIntensity: preset.defaultIntensity,
    prosodyInflection: line.text.trim().endsWith("?") ? "rising" : "natural",
  };
}

export function buildSynthesizablePromptForLine(
  lineText: string,
  setting: ProVoiceLineSetting
): string {
  const emotionMeta =
    EMOTIONAL_EMPHASIS_OPTIONS.find((e) => e.id === setting.emotion) ||
    EMOTIONAL_EMPHASIS_OPTIONS[0];

  const intensityDescriptor =
    setting.emphasisIntensity >= 80
      ? "énfasis emocional alto y proyección marcada"
      : setting.emphasisIntensity >= 55
      ? "énfasis emocional moderado y expresivo"
      : "énfasis sutil y controlado";

  const pitchDescriptor =
    setting.pitch >= 2
      ? "registro tonal ligeramente más agudo y brillante"
      : setting.pitch <= -2
      ? "registro tonal profundo y con cuerpo grave"
      : "registro tonal natural";

  const speedDescriptor =
    setting.speed >= 1.2
      ? "ritmo ágil y dinámico"
      : setting.speed <= 0.88
      ? "ritmo pausado y deliberado"
      : "velocidad de locución fluida";

  const inflectionDescriptor =
    setting.prosodyInflection === "rising"
      ? "con cadencia interrogativa/ascendente al final"
      : setting.prosodyInflection === "falling"
      ? "con cierre asertivo y conclusivo"
      : setting.prosodyInflection === "punchy"
      ? "remarcando las palabras clave con ataque preciso"
      : "";

  const cues = [
    emotionMeta.directiveEs,
    intensityDescriptor,
    pitchDescriptor,
    speedDescriptor,
    inflectionDescriptor,
  ]
    .filter(Boolean)
    .join(", ");

  return `[Dirección de voz: ${cues}] ${lineText}`;
}

interface ProVoiceSettingsPanelProps {
  lines: ScriptLine[];
  proSettings: Record<string, ProVoiceLineSetting>;
  onUpdateLineSetting: (lineId: string, patch: Partial<ProVoiceLineSetting>) => void;
  onBulkUpdateSettings: (nextMap: Record<string, ProVoiceLineSetting>) => void;
  onUpdateLineText?: (lineId: string, newText: string) => void;
  onTriggerBatchSynthesis?: () => void;
  isBatchProcessingTTS?: boolean;
  speakerPitches?: Record<string, number>;
  speakerSpeeds?: Record<string, number>;
}

export function ProVoiceSettingsPanel({
  lines,
  proSettings,
  onUpdateLineSetting,
  onBulkUpdateSettings,
  onUpdateLineText,
  onTriggerBatchSynthesis,
  isBatchProcessingTTS = false,
}: ProVoiceSettingsPanelProps) {
  const { addToast } = useToast();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [speakerFilter, setSpeakerFilter] = useState<string>("ALL");
  const [emotionFilter, setEmotionFilter] = useState<string>("ALL");
  const [previewingLineId, setPreviewingLineId] = useState<string | null>(null);
  const [cloudSynthesizingLineId, setCloudSynthesizingLineId] = useState<string | null>(null);
  const [lineCloudAudioUrls, setLineCloudAudioUrls] = useState<Record<string, string>>({});
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingTextDraft, setEditingTextDraft] = useState<string>("");

  const uniqueSpeakers = useMemo(() => {
    return Array.from(new Set(lines.map((l) => l.speaker)));
  }, [lines]);

  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      const setting = proSettings[line.id] || buildDefaultProVoiceSetting(line);
      if (speakerFilter !== "ALL" && line.speaker !== speakerFilter) return false;
      if (emotionFilter !== "ALL" && setting.emotion !== emotionFilter) return false;
      return true;
    });
  }, [lines, proSettings, speakerFilter, emotionFilter]);

  // Summary metrics across all lines
  const summaryStats = useMemo(() => {
    if (lines.length === 0) {
      return { avgSpeed: 1.0, avgPitch: 0, avgIntensity: 60, customizedCount: 0 };
    }
    let totalSpeed = 0;
    let totalPitch = 0;
    let totalIntensity = 0;
    let customizedCount = 0;

    lines.forEach((line) => {
      const def = buildDefaultProVoiceSetting(line);
      const cur = proSettings[line.id] || def;
      totalSpeed += cur.speed;
      totalPitch += cur.pitch;
      totalIntensity += cur.emphasisIntensity;
      if (
        cur.pitch !== 0 ||
        Math.abs(cur.speed - 1.0) > 0.01 ||
        cur.emotion !== "neutral" ||
        cur.emphasisIntensity !== 50 ||
        cur.prosodyInflection !== "natural"
      ) {
        customizedCount++;
      }
    });

    return {
      avgSpeed: totalSpeed / lines.length,
      avgPitch: totalPitch / lines.length,
      avgIntensity: Math.round(totalIntensity / lines.length),
      customizedCount,
    };
  }, [lines, proSettings]);

  // Auto-calibrate per-line settings by analyzing punctuation, length, and sentiment
  const handleAutoCalibrateLines = () => {
    const nextMap: Record<string, ProVoiceLineSetting> = {};
    lines.forEach((line, idx) => {
      const text = line.text || "";
      const hasExclamation = text.includes("!") || text.includes("¡");
      const hasQuestion = text.includes("?") || text.includes("¿");
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const base = buildDefaultProVoiceSetting(line);

      let emotion: EmotionalEmphasisType = base.emotion;
      let pitch = base.pitch;
      let speed = base.speed;
      let emphasisIntensity = base.emphasisIntensity;
      let prosodyInflection: ProVoiceLineSetting["prosodyInflection"] = base.prosodyInflection;

      if (hasExclamation) {
        emotion = "enthusiastic";
        pitch = 1.5;
        speed = 1.1;
        emphasisIntensity = 88;
        prosodyInflection = "punchy";
      } else if (hasQuestion) {
        emotion = emotion === "neutral" ? "persuasive" : emotion;
        pitch = 1.0;
        speed = 1.02;
        emphasisIntensity = 76;
        prosodyInflection = "rising";
      } else if (wordCount > 38) {
        emotion = emotion === "neutral" ? "thoughtful" : emotion;
        pitch = -1.0;
        speed = 0.92;
        emphasisIntensity = 70;
        prosodyInflection = "falling";
      } else if (idx === 0 || idx === lines.length - 1) {
        emotion = idx === 0 ? "enthusiastic" : "persuasive";
        pitch = idx === 0 ? 1.0 : -0.5;
        speed = idx === 0 ? 1.05 : 0.95;
        emphasisIntensity = 82;
        prosodyInflection = idx === 0 ? "punchy" : "falling";
      }

      nextMap[line.id] = {
        lineId: line.id,
        pitch,
        speed,
        emotion,
        emphasisIntensity,
        prosodyInflection,
      };
    });

    onBulkUpdateSettings(nextMap);
    addToast(
      "Calibración Pro IA Aplicada",
      `Se optimizaron tono, velocidad y énfasis emocional en ${lines.length} líneas según puntuación y arco dramático.`,
      "success"
    );
  };

  const handleResetAll = () => {
    const resetMap: Record<string, ProVoiceLineSetting> = {};
    lines.forEach((line) => {
      resetMap[line.id] = {
        lineId: line.id,
        pitch: 0,
        speed: 1.0,
        emotion: "neutral",
        emphasisIntensity: 50,
        prosodyInflection: "natural",
      };
    });
    onBulkUpdateSettings(resetMap);
    addToast(
      "Ajustes Restablecidos",
      "Todas las líneas de diálogo volvieron a sus parámetros neutros base (0 st, 1.00x, 50%).",
      "info"
    );
  };

  const handleApplySpeakerPreset = (speaker: string, emotionId: EmotionalEmphasisType) => {
    const preset = EMOTIONAL_EMPHASIS_OPTIONS.find((o) => o.id === emotionId);
    if (!preset) return;

    const nextMap: Record<string, ProVoiceLineSetting> = { ...proSettings };
    lines.forEach((line) => {
      if (speaker === "ALL" || line.speaker === speaker) {
        const current = nextMap[line.id] || buildDefaultProVoiceSetting(line);
        nextMap[line.id] = {
          ...current,
          emotion: preset.id,
          pitch: preset.defaultPitch,
          speed: preset.defaultSpeed,
          emphasisIntensity: preset.defaultIntensity,
        };
      }
    });

    onBulkUpdateSettings(nextMap);
    addToast(
      "Perfil Emocional Aplicado",
      `Se aplicó "${preset.shortLabel}" a ${speaker === "ALL" ? "todas las líneas" : `las intervenciones de ${speaker}`}.`,
      "info"
    );
  };

  // Instant browser preview with exact pitch, rate, and emphasis volume modulation
  const handlePreviewLineLocal = (line: ScriptLine) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      addToast("Navegador no compatible", "Tu navegador no soporta pre-escucha Web Speech.", "error");
      return;
    }

    if (previewingLineId === line.id) {
      window.speechSynthesis.cancel();
      setPreviewingLineId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const setting = proSettings[line.id] || buildDefaultProVoiceSetting(line);

    const utterance = new SpeechSynthesisUtterance(line.text);
    // Map pitch (-6 to +6 semitones) to SpeechSynthesisUtterance pitch (0.5 to 1.5)
    utterance.pitch = Math.max(0.5, Math.min(1.6, 1.0 + setting.pitch * 0.08));
    utterance.rate = Math.max(0.5, Math.min(2.0, setting.speed));
    utterance.volume = Math.max(0.4, Math.min(1.0, 0.65 + (setting.emphasisIntensity / 100) * 0.35));

    const voices = window.speechSynthesis.getVoices();
    const isFemale = line.gender === "Female";
    const matchedVoice = voices.find(
      (v) =>
        (v.lang.startsWith("es") || v.lang.startsWith("en")) &&
        (isFemale
          ? v.name.includes("Female") || v.name.includes("Monica") || v.name.includes("Paulina")
          : v.name.includes("Male") || v.name.includes("Jorge") || v.name.includes("Diego"))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    setPreviewingLineId(line.id);
    utterance.onend = () => setPreviewingLineId(null);
    utterance.onerror = () => setPreviewingLineId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Cloud Gemini TTS pre-synthesis for a single dialogue line with granular parameters
  const handleSynthesizeSingleLineCloud = async (line: ScriptLine) => {
    const setting = proSettings[line.id] || buildDefaultProVoiceSetting(line);
    setCloudSynthesizingLineId(line.id);

    const voiceName =
      (line as any).voiceName ||
      (line.speakerRole === "host" ? "Zephyr" : line.gender === "Female" ? "Kore" : "Fenrir");

    const directedText = buildSynthesizablePromptForLine(line.text, setting);

    try {
      const res = await safeFetchJson("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: directedText,
          voiceName,
          pitch: setting.pitch,
          speed: setting.speed,
          emotion: setting.emotion,
          emphasisIntensity: setting.emphasisIntensity,
        }),
      });

      if (!res.ok || !res.data?.audioBase64) {
        throw new Error(res.error || "No se pudo sintetizar la línea con Gemini TTS");
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      const binaryString = window.atob(res.data.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);

      // Apply speed & pitch resampling + emphasis gain envelope
      const effectiveRate = Math.max(0.5, Math.min(2.0, setting.speed * Math.pow(2, setting.pitch / 24)));
      const outputLength = Math.max(1, Math.floor(int16Array.length / effectiveRate));
      const gainMultiplier = 0.8 + (setting.emphasisIntensity / 100) * 0.35;

      const buffer = audioCtx.createBuffer(1, outputLength, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < outputLength; i++) {
        const srcIdx = Math.min(int16Array.length - 1, Math.floor(i * effectiveRate));
        const sample = (int16Array[srcIdx] / 32768.0) * gainMultiplier;
        channel[i] = Math.max(-1, Math.min(1, sample));
      }

      // Encode to WAV blob for instant replay
      const wavLength = buffer.length * 2 + 44;
      const out = new DataView(new ArrayBuffer(wavLength));
      let pos = 0;
      const writeStr = (s: string) => {
        for (let i = 0; i < s.length; i++) out.setUint8(pos++, s.charCodeAt(i));
      };
      writeStr("RIFF");
      out.setUint32(pos, wavLength - 8, true);
      pos += 4;
      writeStr("WAVEfmt ");
      out.setUint32(pos, 16, true);
      pos += 4;
      out.setUint16(pos, 1, true);
      pos += 2;
      out.setUint16(pos, 1, true);
      pos += 2;
      out.setUint32(pos, 24000, true);
      pos += 4;
      out.setUint32(pos, 48000, true);
      pos += 4;
      out.setUint16(pos, 2, true);
      pos += 2;
      out.setUint16(pos, 16, true);
      pos += 2;
      writeStr("data");
      out.setUint32(pos, wavLength - pos - 4, true);
      pos += 4;
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, channel[i]));
        out.setInt16(pos, (s < 0 ? s * 32768 : s * 32767) | 0, true);
        pos += 2;
      }

      const wavBlob = new Blob([out], { type: "audio/wav" });
      const objectUrl = URL.createObjectURL(wavBlob);
      setLineCloudAudioUrls((prev) => ({ ...prev, [line.id]: objectUrl }));

      addToast(
        "Línea Sintetizada (Pro)",
        `Audio de ${line.speaker} generado con Tono ${setting.pitch > 0 ? `+${setting.pitch}` : setting.pitch}st, ${setting.speed.toFixed(2)}x y énfasis ${setting.emphasisIntensity}%.`,
        "success"
      );
    } catch (err: any) {
      addToast(
        "Aviso de Síntesis Pro",
        err?.message || "Se aplicaron los parámetros al perfil de síntesis local.",
        "error"
      );
    } finally {
      setCloudSynthesizingLineId(null);
    }
  };

  return (
    <section
      aria-label="Panel de Ajustes de Voz Pro"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors"
    >
      {/* Top Studio Header Bar */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-extrabold tracking-tight text-white">
                Ajustes de Voz Pro · Control Granular por Línea
              </h3>
              <span className="text-[11px] font-mono text-amber-300">
                Pre-Síntesis Studio DSP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibra el tono (semitonos), la velocidad de locución y el énfasis emocional de cada intervención antes de ejecutar la síntesis.
            </p>
          </div>
        </div>

        {/* Live Telemetry Summary & Collapse Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono tabular-nums text-slate-300">
            <span>
              Tono Prom:{" "}
              <strong className="text-amber-400">
                {summaryStats.avgPitch > 0
                  ? `+${summaryStats.avgPitch.toFixed(1)}`
                  : summaryStats.avgPitch.toFixed(1)}{" "}
                st
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>
              Vel Prom: <strong className="text-emerald-400">{summaryStats.avgSpeed.toFixed(2)}x</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>
              Énfasis: <strong className="text-indigo-400">{summaryStats.avgIntensity}%</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Contraer Panel</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Expandir ({lines.length} líneas)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Toolbar: Filters, Auto-Calibration & Global Presets */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Filtrar Orador:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSpeakerFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    speakerFilter === "ALL"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Todos ({lines.length})
                </button>
                {uniqueSpeakers.map((spk) => {
                  const count = lines.filter((l) => l.speaker === spk).length;
                  return (
                    <button
                      key={spk}
                      type="button"
                      onClick={() => setSpeakerFilter(spk)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        speakerFilter === spk
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {spk} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Emotion Filter */}
              <select
                aria-label="Filtrar por énfasis emocional"
                value={emotionFilter}
                onChange={(e) => setEmotionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Todas las Emociones</option>
                {EMOTIONAL_EMPHASIS_OPTIONS.map((em) => (
                  <option key={em.id} value={em.id}>
                    Énfasis: {em.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons: Auto-Calibrate, Apply Preset to Current Filter, Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoCalibrateLines}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Analiza signos de interrogación, exclamación y longitud para sugerir tono, velocidad y énfasis por línea"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Calibrar Guion con IA</span>
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Todo</span>
              </button>

              {onTriggerBatchSynthesis && (
                <button
                  type="button"
                  onClick={onTriggerBatchSynthesis}
                  disabled={isBatchProcessingTTS}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>
                    {isBatchProcessingTTS
                      ? "Sintetizando con Ajustes Pro..."
                      : "Sintetizar Episodio con Ajustes Pro"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Bulk Emotion Bar for Selected Speaker */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/70 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Aplicar preajuste emocional rápido a{" "}
                <strong className="text-slate-900 dark:text-white">
                  {speakerFilter === "ALL" ? "todas las líneas" : `las líneas de ${speakerFilter}`}
                </strong>
                :
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {EMOTIONAL_EMPHASIS_OPTIONS.map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => handleApplySpeakerPreset(speakerFilter, em.id)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-500 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {em.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Line Granular Editor Cards */}
          <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
            {filteredLines.map((line) => {
              const globalIdx = lines.findIndex((l) => l.id === line.id);
              const setting = proSettings[line.id] || buildDefaultProVoiceSetting(line);
              const emotionConfig =
                EMOTIONAL_EMPHASIS_OPTIONS.find((e) => e.id === setting.emotion) ||
                EMOTIONAL_EMPHASIS_OPTIONS[0];
              const isPreviewingLocal = previewingLineId === line.id;
              const isSynthesizingCloud = cloudSynthesizingLineId === line.id;
              const cloudAudioUrl = lineCloudAudioUrls[line.id];
              const isEditingThisLine = editingLineId === line.id;

              return (
                <div
                  key={line.id}
                  data-testid={`pro-voice-line-${globalIdx}`}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Top Row: Speaker Info, Line Number, Dialogue Text & Pre-synthesis Preview */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                          #{String(globalIdx + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-amber-500" />
                          {line.speaker}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {line.speakerRole === "host" ? "Moderador" : "Analista Invitado"} ({line.timestamp})
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {emotionConfig.label}
                        </span>
                      </div>

                      {/* Dialogue Text or Inline Editor */}
                      {isEditingThisLine ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingTextDraft}
                            onChange={(e) => setEditingTextDraft(e.target.value)}
                            rows={2}
                            className="w-full p-2.5 rounded-lg border border-amber-400 dark:border-amber-500 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateLineText && editingTextDraft.trim()) {
                                  onUpdateLineText(line.id, editingTextDraft.trim());
                                  addToast(
                                    "Línea Actualizada",
                                    `Diálogo #${globalIdx + 1} actualizado antes de la síntesis.`,
                                    "success"
                                  );
                                }
                                setEditingLineId(null);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Guardar Texto
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLineId(null)}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-start justify-between gap-2">
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            “{line.text}”
                          </p>
                          {onUpdateLineText && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLineId(line.id);
                                setEditingTextDraft(line.text);
                              }}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 transition-opacity cursor-pointer"
                            >
                              Editar diálogo
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pre-synthesis Preview Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewLineLocal(line)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          isPreviewingLocal
                            ? "bg-amber-500 text-slate-950 border-amber-500"
                            : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        }`}
                        title="Pre-escucha inmediata con modulación de tono, velocidad y énfasis"
                      >
                        {isPreviewingLocal ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Detener Prueba</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pre-escuchar Línea</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSynthesizeSingleLineCloud(line)}
                        disabled={isSynthesizingCloud}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Sintetizar esta línea individual con Gemini TTS aplicando sus ajustes Pro"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isSynthesizingCloud ? "Sintetizando..." : "Síntesis Pro IA"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Granular Controls Grid: 1) Pitch (Tono), 2) Speed (Velocidad), 3) Emotional Emphasis & Intensity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                    {/* 1. PITCH / TONO GRANULAR CONTROL */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor={`pitch-slider-${line.id}`}
                          className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tono (Pitch)</span>
                        </label>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {setting.pitch > 0 ? `+${setting.pitch.toFixed(1)}` : setting.pitch.toFixed(1)} st
                        </span>
                      </div>

                      <input
                        id={`pitch-slider-${line.id}`}
                        type="range"
                        min="-6"
                        max="6"
                        step="0.5"
                        value={setting.pitch}
                        onChange={(e) =>
                          onUpdateLineSetting(line.id, { pitch: parseFloat(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>-6 st (Grave)</span>
                        <button
                          type="button"
                          onClick={() => onUpdateLineSetting(line.id, { pitch: 0 })}
                          className="hover:text-amber-500 underline cursor-pointer"
                        >
                          0 st (Natural)
                        </button>
                        <span>+6 st (Agudo)</span>
                      </div>
                    </div>

                    {/* 2. SPEED / VELOCIDAD GRANULAR CONTROL */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor={`speed-slider-${line.id}`}
                          className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Velocidad (Cadencia)</span>
                        </label>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {setting.speed.toFixed(2)}x
                        </span>
                      </div>

                      <input
                        id={`speed-slider-${line.id}`}
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={setting.speed}
                        onChange={(e) =>
                          onUpdateLineSetting(line.id, { speed: parseFloat(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>0.50x (Pausado)</span>
                        <button
                          type="button"
                          onClick={() => onUpdateLineSetting(line.id, { speed: 1.0 })}
                          className="hover:text-emerald-500 underline cursor-pointer"
                        >
                          1.00x (Base)
                        </button>
                        <span>2.00x (Rápido)</span>
                      </div>
                    </div>

                    {/* 3. EMOTIONAL EMPHASIS & INTENSITY CONTROL */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor={`emotion-select-${line.id}`}
                          className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Énfasis Emocional</span>
                        </label>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          Intensidad {setting.emphasisIntensity}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          id={`emotion-select-${line.id}`}
                          value={setting.emotion}
                          onChange={(e) => {
                            const nextEmotion = e.target.value as EmotionalEmphasisType;
                            const found = EMOTIONAL_EMPHASIS_OPTIONS.find(
                              (o) => o.id === nextEmotion
                            );
                            onUpdateLineSetting(line.id, {
                              emotion: nextEmotion,
                              emphasisIntensity: found
                                ? found.defaultIntensity
                                : setting.emphasisIntensity,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {EMOTIONAL_EMPHASIS_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.shortLabel}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label={`Inflexión prosódica para línea ${globalIdx + 1}`}
                          value={setting.prosodyInflection}
                          onChange={(e) =>
                            onUpdateLineSetting(line.id, {
                              prosodyInflection: e.target
                                .value as ProVoiceLineSetting["prosodyInflection"],
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {PROSODY_INFLECTION_OPTIONS.map((inf) => (
                            <option key={inf.id} value={inf.id}>
                              {inf.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <input
                          id={`intensity-slider-${line.id}`}
                          aria-label={`Intensidad de énfasis emocional para línea ${globalIdx + 1}`}
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={setting.emphasisIntensity}
                          onChange={(e) =>
                            onUpdateLineSetting(line.id, {
                              emphasisIntensity: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>0% (Sutil)</span>
                          <span>50% (Medio)</span>
                          <span>100% (Máximo)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Cloud Synthesized Audio Player if generated for this line */}
                  {cloudAudioUrl && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white px-3.5 py-2.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        Muestra Gemini TTS Pro Lista · {line.speaker} ({setting.pitch >= 0 ? `+${setting.pitch}` : setting.pitch}st · {setting.speed.toFixed(2)}x · {emotionConfig.shortLabel} {setting.emphasisIntensity}%)
                      </span>
                      <audio src={cloudAudioUrl} controls className="h-8 w-full sm:w-64" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
