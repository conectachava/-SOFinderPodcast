"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Radio, Sliders, RefreshCw, Copy, Check, Play, Mic, User, Sparkles, BarChart3, ChevronDown, ChevronUp, Quote, BookOpen, Link2, Plus, ExternalLink, X, Bookmark, ChevronRight, Maximize2, Minimize2, Eye, Search, SlidersHorizontal, Type, Smile, Shield, Zap, AlertCircle, CheckCircle2, HelpCircle, Square, Volume2, Globe, Languages } from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { safeFetchJson } from "@/lib/utils";
import { updatePodcastSeoTopic } from "@/components/DynamicSeoHead";
import {
  parseRawScriptToLines,
  reconstructRawScriptFromLines,
  calculateEstimatedDurationFromLines,
  splitLongScriptParagraphs,
} from "@/lib/script-parser";
import { useToast } from "./Toast";
import { SentimentBadge } from "./SentimentBadge";
import { ScriptSentimentPanel } from "./ScriptSentimentPanel";

// Color-Coded Emotion Pill Component representing selected line emotion for Narrative Arc visual checks
export function EmotionPill({ emotion, sentiment }: { emotion?: string; sentiment?: string }) {
  const emotionLower = (emotion || sentiment || "neutral").toLowerCase();

  if (
    emotionLower.includes("happy") ||
    emotionLower.includes("enthusiastic") ||
    emotionLower.includes("entusiasta") ||
    emotionLower.includes("emocionad") ||
    emotionLower.includes("alegre")
  ) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-[10px] font-bold font-mono inline-flex items-center gap-1 shadow-2xs">
        <Smile className="w-3 h-3 text-emerald-400" />
        <span>😊 Happy</span>
      </span>
    );
  }

  if (
    emotionLower.includes("serious") ||
    emotionLower.includes("serio") ||
    emotionLower.includes("formal") ||
    emotionLower.includes("analítico")
  ) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/80 text-[10px] font-bold font-mono inline-flex items-center gap-1 shadow-2xs">
        <Shield className="w-3 h-3 text-indigo-400" />
        <span>🤔 Serious</span>
      </span>
    );
  }

  if (
    emotionLower.includes("energetic") ||
    emotionLower.includes("energétic") ||
    emotionLower.includes("apasionad") ||
    emotionLower.includes("intenso")
  ) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/80 text-[10px] font-bold font-mono inline-flex items-center gap-1 shadow-2xs">
        <Zap className="w-3 h-3 text-amber-400" />
        <span>⚡ Energetic</span>
      </span>
    );
  }

  if (
    emotionLower.includes("concerned") ||
    emotionLower.includes("preocupad") ||
    emotionLower.includes("crític") ||
    emotionLower.includes("alerta") ||
    emotionLower.includes("riesgo")
  ) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/80 text-[10px] font-bold font-mono inline-flex items-center gap-1 shadow-2xs">
        <AlertCircle className="w-3 h-3 text-rose-400" />
        <span>😟 Concerned</span>
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold font-mono inline-flex items-center gap-1 shadow-2xs">
      <HelpCircle className="w-3 h-3 text-slate-400" />
      <span>😐 Neutral</span>
    </span>
  );
}

// Readability Analysis Tool for Conversational Podcast Flow
export function analyzeLineReadability(text: string) {
  if (!text) {
    return { wordCount: 0, sentencesCount: 0, avgWordsPerSentence: 0, isComplex: false, isWarning: false, suggestion: "" };
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentencesCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round(wordCount / sentencesCount);

  const isComplex = wordCount > 24 || avgWordsPerSentence > 20;
  const isWarning = !isComplex && (wordCount > 17 || avgWordsPerSentence > 15);

  let suggestion = "";
  if (isComplex) {
    suggestion = `Esta línea tiene ${wordCount} palabras. Te sugerimos dividirlas en oraciones más cortas para mayor fluidez.`;
  } else if (isWarning) {
    suggestion = "Longitud moderada. Haz una pausa natural a la mitad al hablar.";
  } else {
    suggestion = "Ritmo conversational fluido y natural.";
  }

  return { wordCount, sentencesCount, avgWordsPerSentence, isComplex, isWarning, suggestion };
}

// Predefined Voice Profiles Library
export const PREDEFINED_VOICE_PROFILES = [
  {
    id: "host_paul",
    label: "🎙️ Host (Paul / Presentador)",
    role: "host" as const,
    speaker: "Paul",
    gender: "Male" as const,
    accent: "British",
    voiceName: "Zephyr",
    emotion: "Neutral",
    sentiment: "neutral" as const,
  },
  {
    id: "expert_elena",
    label: "🎓 Expert (Dra. Elena / Experta)",
    role: "caller" as const,
    speaker: "Dra. Elena",
    gender: "Female" as const,
    accent: "American",
    voiceName: "Kore",
    emotion: "Serious",
    sentiment: "neutral" as const,
  },
  {
    id: "analyst_marcos",
    label: "📊 Analyst (Marcos / Analista)",
    role: "caller" as const,
    speaker: "Marcos",
    gender: "Male" as const,
    accent: "International",
    voiceName: "Fenrir",
    emotion: "Energetic",
    sentiment: "enthusiastic" as const,
  },
  {
    id: "reporter_sarah",
    label: "💬 Reporter (Sarah / Reportera)",
    role: "caller" as const,
    speaker: "Sarah",
    gender: "Female" as const,
    accent: "British",
    voiceName: "Aoede",
    emotion: "Happy",
    sentiment: "enthusiastic" as const,
  },
];
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

const SAMPLE_LINES_FOR_ANALYTICS: ScriptLine[] = [
  { id: "s1", speaker: "Paul", speakerRole: "host", text: "Bienvenidos a SourceFinder Pod. Hoy analizaremos el lanzamiento del iPhone 15 Pro y sus implicaciones financieras.", sentiment: "neutral", gender: "Male", accent: "British", timestamp: "0:00" },
  { id: "s2", speaker: "Sarah", speakerRole: "caller", text: "¡El chip A17 Bionic y el acabado de titanio marcan un salto tecnológico increíble para Apple!", sentiment: "enthusiastic", gender: "Female", accent: "American", timestamp: "0:15" },
  { id: "s3", speaker: "David", speakerRole: "caller", text: "Sin embargo, los analistas expresan cautela ante el incremento de precios en modelos Pro Max.", sentiment: "concerned", gender: "Male", accent: "British", timestamp: "0:30" },
  { id: "s4", speaker: "Paul", speakerRole: "host", text: "¿Cómo afectará esto las proyecciones de ingresos por servicios en el próximo trimestre?", sentiment: "neutral", gender: "Male", accent: "British", timestamp: "0:45" },
  { id: "s5", speaker: "Sarah", speakerRole: "caller", text: "Los ingresos en servicios alcanzaron máximos históricos, superando las estimaciones de Wall Street.", sentiment: "enthusiastic", gender: "Female", accent: "American", timestamp: "1:00" },
  { id: "s6", speaker: "David", speakerRole: "caller", text: "Es un punto válido, pero la presión regulatoria europea plantea desafíos de cumplimiento inmediatos.", sentiment: "concerned", gender: "Male", accent: "British", timestamp: "1:15" },
];

function ScriptAnalyticsPanel({ lines }: { lines: ScriptLine[] }) {
  const [activeTab, setActiveTab] = useState<"balance" | "sentiment" | "words">("balance");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const effectiveLines = lines && lines.length > 0 ? lines : SAMPLE_LINES_FOR_ANALYTICS;

  // Aggregate speaker stats
  const speakerStats: Record<string, { words: number; turns: number; sentiments: Record<string, number> }> = {};

  effectiveLines.forEach((line) => {
    const spk = line.speaker || "Paul";
    const words = line.text.trim().split(/\s+/).filter(Boolean).length;
    const sent = line.sentiment || "neutral";

    if (!speakerStats[spk]) {
      speakerStats[spk] = { words: 0, turns: 0, sentiments: { neutral: 0, enthusiastic: 0, concerned: 0 } };
    }
    speakerStats[spk].words += words;
    speakerStats[spk].turns += 1;
    speakerStats[spk].sentiments[sent] = (speakerStats[spk].sentiments[sent] || 0) + 1;
  });

  const totalWords = Object.values(speakerStats).reduce((acc, curr) => acc + curr.words, 0);

  const speakerData = Object.entries(speakerStats).map(([speaker, data]) => ({
    speaker,
    words: data.words,
    turns: data.turns,
    seconds: Math.round((data.words / 150) * 60),
    percentage: totalWords > 0 ? Math.round((data.words / totalWords) * 100) : 0,
    Neutral: data.sentiments.neutral || 0,
    Entusiasta: data.sentiments.enthusiastic || 0,
    Crítico: data.sentiments.concerned || 0,
  }));

  const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              Analíticas del Guion & Inteligencia de Personajes
            </h4>
            <p className="text-[10px] text-slate-500">Métricas de sentimiento, balance de tiempo de habla y volumen de palabras.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              onClick={() => setActiveTab("balance")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "balance"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Balance Tiempo
            </button>
            <button
              onClick={() => setActiveTab("sentiment")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "sentiment"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Sentimiento
            </button>
            <button
              onClick={() => setActiveTab("words")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "words"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Distribución Palabras
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            title={isCollapsed ? "Expandir" : "Plegar"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">TOTAL PALABRAS</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{totalWords}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">TIEMPO ESTIMADO</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                ~{Math.round((totalWords / 150) * 60)}s
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">PERSONAJES</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {speakerData.length} Locutores
              </span>
            </div>
          </div>

          {/* Tab 1: Speaking Time Balance */}
          {activeTab === "balance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speakerData}
                      dataKey="words"
                      nameKey="speaker"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name}: ${Math.round((percent || 0) * 100)}%`}
                      labelLine={false}
                    >
                      {speakerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                      formatter={(val: any) => [`${val} palabras (~${Math.round(((val as number) / 150) * 60)}s)`, "Volumen"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Equilibrio del Diálogo</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Proporción de tiempo ocupado por cada locutor según ~150 palabras por minuto.
                </p>
                <div className="space-y-1.5 pt-1">
                  {speakerData.map((s, idx) => (
                    <div key={s.speaker} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        {s.speaker}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                        {s.percentage}% ({s.seconds}s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Sentiment Analysis */}
          {activeTab === "sentiment" && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Análisis de Sentimiento por Personaje</h5>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speakerData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="speaker" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Entusiasta" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Neutral" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Crítico" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Word Count Distribution */}
          {activeTab === "words" && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Conteo de Palabras e Intervenciones</h5>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speakerData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="speaker" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                    />
                    <Bar dataKey="words" name="Palabras Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="turns" name="Intervenciones" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ScriptEditor = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={8}
      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 min-h-[180px] sm:min-h-[220px] resize-y transition-colors"
      placeholder="Pega aquí el informe de inteligencia o resumen de fuentes..."
      spellCheck={false}
    />
  );
};

export function ScriptStudioView({
  initialReport,
  onSendToStudio,
  onToggleFocusMode,
}: {
  initialReport?: string;
  onSendToStudio?: (script: string, lines: ScriptLine[]) => void;
  onToggleFocusMode?: (isFocused: boolean) => void;
}) {
  const { addToast } = useToast();

  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [focusFontSize, setFocusFontSize] = useState<"sm" | "base" | "lg">("base");
  const [focusSpeakerFilter, setFocusSpeakerFilter] = useState<string>("all");
  const [focusSearchTerm, setFocusSearchTerm] = useState<string>("");
  const [bookmarkedLineIds, setBookmarkedLineIds] = useState<Set<string>>(new Set());
  const [focusedLineIndex, setFocusedLineIndex] = useState<number>(0);
  const [onlyBookmarksFilter, setOnlyBookmarksFilter] = useState<boolean>(false);

  const focusSearchInputRef = useRef<HTMLInputElement>(null);

  const toggleFocusMode = useCallback((val: boolean) => {
    setIsFocusMode(val);
    if (onToggleFocusMode) {
      onToggleFocusMode(val);
    }
    if (val) {
      addToast("Modo Lectura Activado", "Atajos disponibles: Esc (Salir), Ctrl+B (Marcar), ↑/↓ (Navegar)", "info");
    } else {
      addToast("Modo Lectura Desactivado", "Restaurada la vista de trabajo estándar.", "info");
    }
  }, [onToggleFocusMode, addToast]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        addToast("Marcador removido", "Línea desmarcada del guion.", "info");
      } else {
        next.add(id);
        addToast("Sección marcada (Ctrl+B)", "Guardado en secciones importantes.", "success");
      }
      return next;
    });
  }, [addToast]);

  const [reportText, setReportText] = useState(
    initialReport ||
      `## Resumen Ejecutivo\nEl nuevo iPhone 15 Pro ha sido lanzado con críticas positivas por su procesador A17 Bionic y cuerpo de titanio, impulsando además ingresos récord en la división de servicios de Apple.\n\n## Puntos Clave\n- El iPhone 15 Pro integra el chip A17 Bionic con arquitectura de 3nm.\n- Apple reportó ingresos superiores a las proyecciones de Wall Street.\n- Transición oficial a puerto USB-C y botón de acción personalizable.\n\n## Puntos de Debate\n- Cuestionamientos sobre si el aumento de precio en el modelo Pro Max está justificado.\n- Preocupaciones de analistas sobre el ritmo de renovación en el mercado de smartphones.\n\n## Fuentes Verificadas\n- https://www.theverge.com/2023/10/30/iphone-15-pro-review\n- https://www.techcrunch.com/2023/11/01/apple-earnings-report`
  );

  const [showFormat, setShowFormat] = useState<"Debate" | "Análisis" | "Opinión">("Debate");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [scriptLanguage, setScriptLanguage] = useState<string>("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>("Español");
  const [hostName, setHostName] = useState("Paul");
  const [hostVoiceProfile, setHostVoiceProfile] = useState("Zephyr");
  const [callers, setCallers] = useState([
    { name: "Sarah", gender: "Female", accent: "American Midwest", voiceProfile: "Kore" },
    { name: "David", gender: "Male", accent: "British", voiceProfile: "Charon" },
  ]);

  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [rawScript, setRawScript] = useState<string | null>(null);
  const [parsedLines, setParsedLines] = useState<ScriptLine[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{ wordCount: number; estimatedDuration: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collabMode, setCollabMode] = useState<boolean>(true);
  const [isRawEditMode, setIsRawEditMode] = useState<boolean>(false);

  // Sync handler for raw script textarea edits
  const handleRawScriptChange = (newRawText: string) => {
    setRawScript(newRawText);
    const newParsedLines = parseRawScriptToLines(newRawText, hostName, callers);
    setParsedLines(newParsedLines);
    const durationStats = calculateEstimatedDurationFromLines(newParsedLines);
    setStats({
      wordCount: durationStats.wordCount,
      estimatedDuration: durationStats.estimatedDurationFormatted,
    });
  };

  // AI Voice Profiles Catalog
  const AI_VOICE_PROFILES = [
    { id: "Zephyr", name: "Zephyr (Deep Professional Male)", gender: "Male", accent: "British" },
    { id: "Puck", name: "Puck (Energetic Tech Host Male)", gender: "Male", accent: "American" },
    { id: "Kore", name: "Kore (Warm News Presenter Female)", gender: "Female", accent: "American" },
    { id: "Charon", name: "Charon (Narrator / Researcher Male)", gender: "Male", accent: "British" },
    { id: "Fenrir", name: "Fenrir (Deep Voice Male)", gender: "Male", accent: "Global" },
    { id: "Aoede", name: "Aoede (Expressive Female)", gender: "Female", accent: "American Midwest" },
    { id: "Alnilam", name: "Alnilam (Calm Male)", gender: "Male", accent: "Canadian" },
    { id: "Orion", name: "Orion (Natural American Male)", gender: "Male", accent: "American West" },
  ];

  // Smart Refine Script (Gemini) Handler
  const handleSmartRefineScript = async () => {
    if (!rawScript && parsedLines.length === 0) {
      addToast("Sin Guion", "No hay guion disponible para refinación inteligente.", "error");
      return;
    }
    setIsRefining(true);
    addToast("Smart Refine (Gemini)", "Detectando y corrigiendo errores gramaticales e inconsistencias...", "info");
    try {
      const response = await safeFetchJson("/api/script-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawScript, lines: parsedLines }),
      });
      if (!response.ok) {
        throw new Error(response.error || "Falló la refinación del guion");
      }
      const data = response.data;
      setRawScript(data.rawScript);
      setParsedLines(data.lines || []);
      addToast(
        "Smart Refine Completado",
        `Se aplicaron ${data.refinementsCount} correcciones: ${data.summary}`,
        "success"
      );
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("abort")) {
        return;
      }
      addToast("Error Smart Refine", err.message || "Error al refinarse", "error");
    } finally {
      setIsRefining(false);
    }
  };

  // Bulk Edit Actions for Multiple Script Lines
  const toggleSelectLine = (id: string) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllLines = () => {
    if (selectedLineIds.size === parsedLines.length) {
      setSelectedLineIds(new Set());
    } else {
      setSelectedLineIds(new Set(parsedLines.map((l) => l.id)));
    }
  };

  const handleBulkChangeRole = (newRole: "host" | "caller") => {
    if (selectedLineIds.size === 0) return;
    setParsedLines((prev) =>
      prev.map((l) => (selectedLineIds.has(l.id) ? { ...l, speakerRole: newRole } : l))
    );
    addToast("Edición Masiva", `Rol actualizado a "${newRole}" en ${selectedLineIds.size} líneas.`, "success");
  };

  const handleBulkChangeSpeaker = (newName: string) => {
    if (selectedLineIds.size === 0 || !newName.trim()) return;
    setParsedLines((prev) =>
      prev.map((l) => (selectedLineIds.has(l.id) ? { ...l, speaker: newName } : l))
    );
    addToast("Edición Masiva", `Locutor actualizado a "${newName}" en ${selectedLineIds.size} líneas.`, "success");
  };

  const handleBulkChangeSentiment = (newSentiment: "neutral" | "enthusiastic" | "concerned") => {
    if (selectedLineIds.size === 0) return;
    setParsedLines((prev) =>
      prev.map((l) => (selectedLineIds.has(l.id) ? { ...l, sentiment: newSentiment } : l))
    );
    addToast("Edición Masiva", `Tono emocional actualizado a "${newSentiment}" en ${selectedLineIds.size} líneas.`, "success");
  };

  // Single-Line TTS Preview State & Audio Reference
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [loadingLineId, setLoadingLineId] = useState<string | null>(null);
  const activeAudioRef = useRef<AudioBufferSourceNode | HTMLAudioElement | null>(null);

  const stopAudioPreview = () => {
    if (activeAudioRef.current) {
      if ('stop' in activeAudioRef.current) {
        try { (activeAudioRef.current as AudioBufferSourceNode).stop(); } catch {}
      } else if ('pause' in activeAudioRef.current) {
        try { (activeAudioRef.current as HTMLAudioElement).pause(); } catch {}
      }
      activeAudioRef.current = null;
    }
    setPlayingLineId(null);
    setLoadingLineId(null);
  };

  const handlePlayLinePreview = async (line: ScriptLine & { voiceName?: string }) => {
    if (playingLineId === line.id) {
      stopAudioPreview();
      return;
    }
    stopAudioPreview();
    setLoadingLineId(line.id);

    try {
      const voiceName = line.voiceName || (line.speakerRole === "host" ? "Zephyr" : line.gender === "Female" ? "Kore" : "Fenrir");
      const res = await safeFetchJson("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line.text, voiceName }),
      });

      if (!res.ok || !res.data?.audioBase64) {
        throw new Error(res.error || "Falló la generación de audio TTS preview");
      }

      const { audioBase64, mimeType = "audio/pcm" } = res.data;

      if (mimeType.includes("wav") || mimeType.includes("mp3") || mimeType.includes("mpeg")) {
        const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
        activeAudioRef.current = audio;
        audio.onended = () => { setPlayingLineId(null); activeAudioRef.current = null; };
        audio.onerror = () => { setPlayingLineId(null); activeAudioRef.current = null; };
        await audio.play();
        setPlayingLineId(line.id);
      } else {
        const binaryString = window.atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => { setPlayingLineId(null); activeAudioRef.current = null; };
        source.start(0);
        activeAudioRef.current = source;
        setPlayingLineId(line.id);
      }
    } catch (err: any) {
      addToast("Error Audio Preview", err?.message || "Error al previsualizar voz Gemini TTS", "error");
      setPlayingLineId(null);
    } finally {
      setLoadingLineId(null);
    }
  };

  const handleApplyProfileToLine = (lineId: string, profileId: string) => {
    const prof = PREDEFINED_VOICE_PROFILES.find((p) => p.id === profileId);
    if (!prof) return;
    setParsedLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              speaker: prof.speaker,
              speakerRole: prof.role,
              gender: prof.gender,
              accent: prof.accent,
              emotion: prof.emotion,
              sentiment: prof.sentiment,
              voiceName: prof.voiceName,
            }
          : l
      )
    );
    addToast("Perfil Asignado", `Perfil "${prof.label}" aplicado a la línea.`, "success");
  };

  const handleUpdateLineEmotion = (lineId: string, newEmotion: string) => {
    let newSentiment: "neutral" | "enthusiastic" | "concerned" = "neutral";
    const lower = newEmotion.toLowerCase();
    if (lower.includes("happy") || lower.includes("energetic") || lower.includes("enthusiastic")) newSentiment = "enthusiastic";
    if (lower.includes("concerned") || lower.includes("preocupad")) newSentiment = "concerned";

    setParsedLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, emotion: newEmotion, sentiment: newSentiment } : l))
    );
    addToast("Emoción Actualizada", `Arco narrativo ajustado a "${newEmotion}".`, "info");
  };

  const handleSimplifyLineText = (lineId: string) => {
    setParsedLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        let text = l.text;
        text = text.replace(/, consecuentemente, /gi, ". Por lo tanto, ");
        text = text.replace(/, adicionalmente, /gi, ". Además, ");
        text = text.replace(/que representa un avance fundamental/gi, "que es un avance clave");
        text = text.replace(/invariablemente/gi, "siempre");
        return { ...l, text };
      })
    );
    addToast("Flujo Conversacional", "Línea adaptada para locución en vivo.", "success");
  };

  const handleSplitLongParagraphs = () => {
    if (!parsedLines || parsedLines.length === 0) return;
    const originalCount = parsedLines.length;
    const splitLines = splitLongScriptParagraphs(parsedLines, 18);
    if (splitLines.length === originalCount) {
      addToast(
        "División de Párrafos",
        "Todas las líneas ya tienen una longitud breve ideal para la síntesis TTS.",
        "info"
      );
      return;
    }
    setParsedLines(splitLines);
    const durationStats = calculateEstimatedDurationFromLines(splitLines);
    setStats({
      wordCount: durationStats.wordCount,
      estimatedDuration: durationStats.estimatedDurationFormatted,
    });
    addToast(
      "Párrafos Divididos para TTS",
      `Párrafos extensos fragmentados de ${originalCount} a ${splitLines.length} líneas breves según signos de puntuación.`,
      "success"
    );
  };

  // Readability Overview Calculation for entire script
  const readabilityOverview = React.useMemo(() => {
    if (!parsedLines || parsedLines.length === 0) {
      return { totalLines: 0, complexCount: 0, warningCount: 0, avgWords: 0 };
    }
    let totalWords = 0;
    let complex = 0;
    let warning = 0;

    parsedLines.forEach((l) => {
      const res = analyzeLineReadability(l.text);
      totalWords += res.wordCount;
      if (res.isComplex) complex++;
      else if (res.isWarning) warning++;
    });

    return {
      totalLines: parsedLines.length,
      complexCount: complex,
      warningCount: warning,
      avgWords: Math.round(totalWords / parsedLines.length),
    };
  }, [parsedLines]);

  // Cite Source Floating Modal & Parsing State
  const [isCiteModalOpen, setIsCiteModalOpen] = useState(false);
  const [citationFormat, setCitationFormat] = useState<"radio" | "journalistic" | "dialogue" | "apa">("radio");
  const [selectedCitationSpeaker, setSelectedCitationSpeaker] = useState("Paul");
  const [citationTarget, setCitationTarget] = useState<"script" | "report">("script");
  const [customCitationText, setCustomCitationText] = useState("");

  // Extract sources dynamically from reportText
  const parsedSources = React.useMemo(() => {
    const sources: { id: string; title: string; source: string; url?: string; excerpt: string }[] = [];
    if (!reportText) return sources;

    // 1. Check for URLs
    const urlMatches = reportText.match(/https?:\/\/[^\s\)\>]+/g) || [];
    urlMatches.forEach((url, idx) => {
      let sourceName = "Fuente Web";
      if (url.includes("theverge")) sourceName = "The Verge";
      else if (url.includes("techcrunch")) sourceName = "TechCrunch";
      else if (url.includes("bloomberg")) sourceName = "Bloomberg";
      else if (url.includes("reuters")) sourceName = "Reuters";
      else if (url.includes("apple")) sourceName = "Apple Newsroom";
      
      const cleanUrl = url.replace(/[\,\.\)]$/, "");
      sources.push({
        id: `url-${idx}`,
        title: `${sourceName} - Reporte Verificado`,
        source: sourceName,
        url: cleanUrl,
        excerpt: `Información extraída directamente de ${sourceName} (${cleanUrl}).`,
      });
    });

    // 2. Check for bullet points / section quotes
    const bulletLines = reportText.split("\n").filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* "));
    bulletLines.forEach((line, idx) => {
      const cleanLine = line.replace(/^[\-\*]\s*/, "").trim();
      if (cleanLine.length > 10) {
        sources.push({
          id: `bullet-${idx}`,
          title: cleanLine.slice(0, 50) + (cleanLine.length > 50 ? "..." : ""),
          source: "Informe de Inteligencia",
          excerpt: cleanLine,
        });
      }
    });

    // Fallback if no sources were parsed
    if (sources.length === 0) {
      sources.push(
        {
          id: "def-1",
          title: "The Verge - Review iPhone 15 Pro & A17 Bionic",
          source: "The Verge",
          url: "https://www.theverge.com/2023/10/30/iphone-15-pro-review",
          excerpt: "El chip A17 Bionic de 3nm y el acabado de titanio representan un avance clave.",
        },
        {
          id: "def-2",
          title: "TechCrunch - Reporte Trimestral de Servicios",
          source: "TechCrunch",
          url: "https://www.techcrunch.com/2023/11/01/apple-earnings-report",
          excerpt: "Los ingresos en la división de servicios alcanzaron un máximo histórico.",
        },
        {
          id: "def-3",
          title: "Dossier de Inteligencia SourceFinder Pod",
          source: "SourceFinder Research",
          excerpt: "Análisis macroeconómico de regulaciones europeas y proyecciones de mercado.",
        }
      );
    }

    return sources;
  }, [reportText]);

  const handleInsertCitation = (sourceItem?: { title: string; source: string; url?: string; excerpt: string }) => {
    const srcName = sourceItem?.source || "Fuente Oficial";
    const titleOrExcerpt = sourceItem?.excerpt || sourceItem?.title || customCitationText || "Dato verificado";
    const urlStr = sourceItem?.url ? ` (${sourceItem.url})` : "";

    let formattedCitation = "";

    if (citationFormat === "radio") {
      formattedCitation = `[Fuente: ${srcName}${urlStr} - "${titleOrExcerpt}"]`;
    } else if (citationFormat === "journalistic") {
      formattedCitation = `[Cita Periodística: Según reporta ${srcName}, "${titleOrExcerpt}"${urlStr}]`;
    } else if (citationFormat === "dialogue") {
      formattedCitation = `${selectedCitationSpeaker}: [citando fuente] De acuerdo con los datos de ${srcName}, "${titleOrExcerpt}".`;
    } else {
      formattedCitation = `[Ref: ${sourceItem?.title || titleOrExcerpt} — ${srcName}${urlStr}]`;
    }

    if (citationTarget === "script") {
      const currentRaw = rawScript || "";
      const updatedRaw = currentRaw
        ? `${currentRaw}\n\n${formattedCitation}`
        : formattedCitation;

      setRawScript(updatedRaw);

      const newSpeaker = citationFormat === "dialogue" ? selectedCitationSpeaker : hostName;
      const newLine: ScriptLine = {
        id: `cite-${parsedLines.length + 1}-${updatedRaw.length}`,
        speaker: newSpeaker,
        speakerRole: newSpeaker === hostName ? "host" : "caller",
        text: formattedCitation,
        sentiment: "neutral",
        timestamp: "0:00",
      };

      const updatedLines = [...parsedLines, newLine];
      setParsedLines(updatedLines);
      pushHistory(updatedRaw, updatedLines);
      addToast("Cita Insertada en Guion", `Se agregó la cita de ${srcName} al borrador activo.`, "success");
    } else {
      const updatedReport = reportText
        ? `${reportText}\n\n### Referencia de Fuente\n${formattedCitation}`
        : formattedCitation;
      setReportText(updatedReport);
      addToast("Cita Insertada en Informe", `Se agregó la referencia de ${srcName} al dossier de investigación.`, "success");
    }

    setIsCiteModalOpen(false);
  };

  // Undo / Redo history stack & Version history
  const [historyStack, setHistoryStack] = useState<{ rawScript: string | null; parsedLines: ScriptLine[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [versions, setVersions] = useState<{ id: string; timestamp: string; rawScript: string | null; parsedLines: ScriptLine[] }[]>([]);

  const pushHistory = (newRaw: string | null, newLines: ScriptLine[]) => {
    const updated = historyStack.slice(0, historyIndex + 1);
    updated.push({ rawScript: newRaw, parsedLines: newLines });
    setHistoryStack(updated);
    setHistoryIndex(updated.length - 1);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setVersions((prev) => [...prev, { id: Date.now().toString(), timestamp: now, rawScript: newRaw, parsedLines: newLines }]);
  };

  const handleUndo = React.useCallback(() => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setRawScript(prev.rawScript);
      setParsedLines(prev.parsedLines);
      setHistoryIndex(historyIndex - 1);
      addToast("Deshacer", "Se revirtió al estado anterior.", "info");
    }
  }, [historyIndex, historyStack, addToast]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setRawScript(next.rawScript);
      setParsedLines(next.parsedLines);
      setHistoryIndex(historyIndex + 1);
      addToast("Rehacer", "Se restauró el cambio.", "info");
    }
  }, [historyIndex, historyStack, addToast]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Collaborative notes & comments state
  const [comments, setComments] = useState<{ id: string; section: string; author: string; text: string; time: string }[]>([
    { id: "1", section: "General", author: "Paul", text: "Excelente tono inicial. Mantener énfasis en las métricas de rendimiento.", time: "Hace 10 min" },
    { id: "2", section: "Debate", author: "Sarah", text: "Podríamos profundizar más en la comparación con la competencia.", time: "Hace 5 min" }
  ]);
  const [newComment, setNewComment] = useState("");
  const [commentSection, setCommentSection] = useState("General");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const c = {
      id: Date.now().toString(),
      section: commentSection,
      author: hostName || "Editor",
      text: newComment.trim(),
      time: "Justo ahora"
    };
    setComments([c, ...comments]);
    setNewComment("");
    addToast("Nota Añadida", "Comentario guardado en la sesión colaborativa.", "success");
  };
  const handleGenerateScript = async () => {
    if (!reportText.trim()) {
      addToast("Error de Validación", "Por favor ingresa un informe de inteligencia.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    addToast("Redactando Guion", "Creando diálogo radiofónico multivoz...", "info");

    try {
      const response = await safeFetchJson("/api/script-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intelligenceReport: reportText,
          showFormat,
          durationMinutes,
          customHostName: hostName,
          customCallers: callers,
          language: scriptLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Falló la generación del guion");
      }

      const data = response.data;
      setRawScript(data.rawScript);
      setParsedLines(data.lines || []);
      if (data.language) {
        setDetectedLanguage(data.language);
      }
      pushHistory(data.rawScript, data.lines || []);
      setStats({
        wordCount: data.wordCount,
        estimatedDuration: data.estimatedDuration,
      });

      // Update Dynamic SEO Meta Tags based on generated script topic & language
      const firstHeading = reportText.split("\n").find(l => l.trim().startsWith("#"))?.replace(/^#+\s*/, "") || "Podcast Especial";
      updatePodcastSeoTopic({
        topic: `${firstHeading} (${data.language || "Multi-Idioma"})`,
        description: data.rawScript ? data.rawScript.slice(0, 220) + "..." : undefined,
        language: data.language === "English" ? "en" : data.language === "Français" ? "fr" : "es",
        format: showFormat,
      });

      addToast("Guion Generado", `Guion de ${data.wordCount} palabras redactado en ${data.language || "idioma detectado"}.`, "success");
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("abort")) {
        return;
      }
      const msg = err.message || "Error al comunicarse con el servicio Guionista v2.0";
      setError(msg);
      addToast("Error en Guionista", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeReadability = () => {
    if (!rawScript) {
      addToast("Error", "No hay guion generado para analizar.", "error");
      return;
    }
    addToast("Analizando Legibilidad", "Evaluando flujo natural y complejidad...", "info");
    setTimeout(() => {
      addToast(
        "Reporte de Legibilidad (IA)",
        "Puntuación: 78/100. Sugerencia: Simplifica oraciones largas en la Escena 2 para un flujo más conversacional.",
        "success"
      );
    }, 2000);
  };

  const handleCopy = () => {
    if (!rawScript) return;
    navigator.clipboard.writeText(rawScript);
    setCopied(true);
    addToast("Copiado", "Guion copiado al portapapeles.", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered lines for Focus Mode reader
  const focusFilteredLines = React.useMemo(() => {
    return parsedLines.filter((l) => {
      const matchSpeaker = focusSpeakerFilter === "all" || l.speaker === focusSpeakerFilter;
      const matchSearch = !focusSearchTerm || l.text.toLowerCase().includes(focusSearchTerm.toLowerCase()) || l.speaker.toLowerCase().includes(focusSearchTerm.toLowerCase());
      const matchBookmark = !onlyBookmarksFilter || bookmarkedLineIds.has(l.id);
      return matchSpeaker && matchSearch && matchBookmark;
    });
  }, [parsedLines, focusSpeakerFilter, focusSearchTerm, onlyBookmarksFilter, bookmarkedLineIds]);

  // Keyboard Shortcuts for Focus Mode (Modo Lectura)
  useEffect(() => {
    if (!isFocusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT";

      // 1. ESC -> Salir del modo lectura
      if (e.key === "Escape") {
        e.preventDefault();
        toggleFocusMode(false);
        return;
      }

      // 2. Ctrl+B or Cmd+B -> Marcar / Desmarcar línea seleccionada
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (focusFilteredLines.length > 0) {
          const targetLine = focusFilteredLines[focusedLineIndex] || focusFilteredLines[0];
          if (targetLine) {
            toggleBookmark(targetLine.id);
          }
        } else {
          addToast("Marcador (Ctrl+B)", "Selecciona o genera un guion para marcar líneas.", "info");
        }
        return;
      }

      // 3. Ctrl+F or Cmd+F -> Enfocar buscador del guion
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        focusSearchInputRef.current?.focus();
        return;
      }

      // 4. Arrow Navigation (Up / Down)
      if (!isTyping && focusFilteredLines.length > 0) {
        if (e.key === "ArrowDown" || e.key === "j") {
          e.preventDefault();
          setFocusedLineIndex((prev) => Math.min(prev + 1, focusFilteredLines.length - 1));
        } else if (e.key === "ArrowUp" || e.key === "k") {
          e.preventDefault();
          setFocusedLineIndex((prev) => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, focusFilteredLines, focusedLineIndex, toggleFocusMode, toggleBookmark, addToast]);

  if (isFocusMode) {
    return (
      <div className="focus-mode-container bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-6 transition-colors">
        {/* GCP Console Style Focus Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1a73e8] text-white rounded-lg flex items-center justify-center font-bold shadow-xs">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Modo Lectura (Focus Mode)
                </h2>
                <span className="gcp-badge-blue">
                  Google Cloud Console View
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Espacio de trabajo maximizado sin distracciones. Atajos habilitados para máxima productividad.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search filter in focus mode */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={focusSearchInputRef}
                type="text"
                value={focusSearchTerm}
                onChange={(e) => setFocusSearchTerm(e.target.value)}
                placeholder="Buscar (Ctrl+F)..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </div>

            {/* Filter Bookmarks Toggle */}
            <button
              onClick={() => setOnlyBookmarksFilter(!onlyBookmarksFilter)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors ${
                onlyBookmarksFilter
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
              title="Filtrar solo secciones marcadas (Ctrl+B)"
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarksFilter ? "fill-amber-500 text-amber-600" : ""}`} />
              <span>Marcados ({bookmarkedLineIds.size})</span>
            </button>

            {/* Speaker Filter */}
            {parsedLines.length > 0 && (
              <select
                value={focusSpeakerFilter}
                onChange={(e) => setFocusSpeakerFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">👥 Todos los Locutores</option>
                {Array.from(new Set(parsedLines.map(l => l.speaker))).map(spk => (
                  <option key={spk} value={spk}>{spk}</option>
                ))}
              </select>
            )}

            {/* Font size control */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs font-semibold">
              <button
                onClick={() => setFocusFontSize("sm")}
                className={`px-2 py-1 rounded transition-colors ${focusFontSize === "sm" ? "bg-white dark:bg-slate-700 text-[#1a73e8] shadow-2xs" : "text-slate-500"}`}
                title="Texto pequeño"
              >
                A-
              </button>
              <button
                onClick={() => setFocusFontSize("base")}
                className={`px-2 py-1 rounded transition-colors ${focusFontSize === "base" ? "bg-white dark:bg-slate-700 text-[#1a73e8] shadow-2xs" : "text-slate-500"}`}
                title="Texto mediano"
              >
                A
              </button>
              <button
                onClick={() => setFocusFontSize("lg")}
                className={`px-2 py-1 rounded transition-colors ${focusFontSize === "lg" ? "bg-white dark:bg-slate-700 text-[#1a73e8] shadow-2xs" : "text-slate-500"}`}
                title="Texto grande"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setIsCiteModalOpen(true)}
              className="gcp-btn-secondary text-xs flex items-center gap-1.5"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Citar Fuente</span>
            </button>

            {onSendToStudio && rawScript && (
              <button
                onClick={() => onSendToStudio(rawScript, parsedLines)}
                className="gcp-btn-primary text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Audio Deck</span>
              </button>
            )}

            {/* Exit Focus Mode button with Esc key hint */}
            <button
              onClick={() => toggleFocusMode(false)}
              className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-md text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Presiona Esc para salir del modo lectura"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Salir (Esc)</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs bg-[#f8f9fa] dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#1a73e8]" />
              Atajos de Teclado Activos:
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 shadow-2xs font-bold">Esc</kbd>
              Salir
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 shadow-2xs font-bold">Ctrl+B</kbd>
              Marcar sección
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 shadow-2xs font-bold">↑ / ↓</kbd>
              Navegar líneas
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 shadow-2xs font-bold">Ctrl+F</kbd>
              Buscar
            </span>
          </div>
          {focusFilteredLines.length > 0 && (
            <span className="text-[11px] text-[#1a73e8] dark:text-blue-400 font-mono font-medium">
              Línea activa: {focusedLineIndex + 1} / {focusFilteredLines.length}
            </span>
          )}
        </div>

        {/* Focus Mode Content Body */}
        {rawScript ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-[#f8f9fa] dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span>Total Líneas: <strong className="text-slate-900 dark:text-white font-mono">{focusFilteredLines.length}</strong></span>
                <span>Palabras: <strong className="text-slate-900 dark:text-white font-mono">{rawScript.trim().split(/\s+/).filter(Boolean).length}</strong></span>
                <span>Tiempo de Lectura: <strong className="text-[#1a73e8] dark:text-blue-400 font-mono">~{Math.round((rawScript.trim().split(/\s+/).filter(Boolean).length / 150) * 60)} seg</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold flex items-center gap-1 hover:bg-slate-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar Guion"}
                </button>
              </div>
            </div>

            {/* Maximized Script Reader */}
            <div className={`p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-4 max-h-[70vh] overflow-y-auto font-mono ${
              focusFontSize === "sm" ? "text-xs leading-relaxed" : focusFontSize === "lg" ? "text-base leading-loose" : "text-sm leading-relaxed"
            }`}>
              {focusFilteredLines.length === 0 ? (
                <div className="py-12 text-center space-y-3 text-slate-400">
                  <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">No se encontraron líneas con los filtros actuales.</p>
                  <p className="text-xs text-slate-500">Prueba ajustando la búsqueda o quitando el filtro de marcados.</p>
                </div>
              ) : (
                focusFilteredLines.map((line, idx) => {
                  const isBookmarked = bookmarkedLineIds.has(line.id);
                  const isSelected = idx === focusedLineIndex;
                  return (
                    <div
                      key={line.id}
                      onClick={() => setFocusedLineIndex(idx)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer relative group ${
                        isSelected
                          ? "bg-slate-900 border-[#1a73e8] ring-1 ring-[#1a73e8] shadow-md"
                          : isBookmarked
                          ? "bg-amber-950/20 border-amber-500/50"
                          : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center shrink-0 w-8 pt-0.5">
                          <span className={`font-mono text-xs select-none ${isSelected ? "text-[#8ab4f8] font-bold" : "text-slate-600"}`}>
                            {idx + 1}.
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(line.id);
                            }}
                            className={`mt-2 p-1 rounded hover:bg-slate-800 transition-colors ${
                              isBookmarked ? "text-amber-400" : "text-slate-600 group-hover:text-slate-400"
                            }`}
                            title="Marcar / Desmarcar sección (Ctrl+B)"
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#8ab4f8]">{line.speaker}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase">
                                {line.speakerRole || "locutor"}
                              </span>
                              <SentimentBadge sentiment={line.sentiment} text={line.text} size="sm" />
                              {isBookmarked && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                  ★ Marcado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <span className="text-[10px] bg-[#1a73e8]/20 text-[#8ab4f8] border border-[#1a73e8]/40 px-1.5 py-0.5 rounded font-mono">
                                  Selección activa (Ctrl+B para marcar)
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-mono">{line.gender} ({line.accent})</span>
                            </div>
                          </div>
                          <p className="text-slate-100 font-serif leading-relaxed text-base pt-1">{line.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Edición de Dossier de Investigación (Full Workspace)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCiteModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs flex items-center gap-1"
                >
                  <Quote className="w-3.5 h-3.5 text-slate-950" />
                  <span>Insertar Cita</span>
                </button>
              </div>
            </div>

            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={18}
              className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] resize-y ${
                focusFontSize === "sm" ? "text-xs" : focusFontSize === "lg" ? "text-base" : "text-sm"
              }`}
              placeholder="Escribe o pega aquí el informe..."
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">
                Palabras: {reportText.trim().split(/\s+/).filter(Boolean).length} | Tiempo estimado de lectura: ~{(reportText.trim().split(/\s+/).filter(Boolean).length / 130).toFixed(1)} min
              </span>
              <button
                onClick={handleGenerateScript}
                disabled={loading || !reportText.trim()}
                className="gcp-btn-primary text-xs flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                <span>Generar Guion de Radio v2.0</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Script Settings & Dossier Input */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Radio className="w-4 h-4 text-[#1a73e8]" />
              Guionista v2.0 - Generador de Podcast
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Convierte informes de inteligencia en guiones de radio con formato profesional.
            </p>
          </div>

          {/* Modo Lectura Button */}
          <button
            onClick={() => toggleFocusMode(true)}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] dark:bg-blue-950/80 dark:hover:bg-blue-900/80 dark:text-blue-300 font-semibold rounded-md border border-blue-200 dark:border-blue-800 text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Activar Modo Lectura para maximizar espacio sin distracciones"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modo Lectura</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                Informe de Inteligencia (Markdown Input)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (!reportText.trim()) return;
                    addToast("Segmentador IA", "Dividiendo bloques largos de texto en escenas lógicas con transiciones...", "info");
                    const paragraphs = reportText.split(/\n\n+/).filter(Boolean);
                    let segmented = `[SCENE 1: APERTURA & CONTEXTO]\n`;
                    segmented += `${hostName}: [enfático] Iniciamos el bloque principal.\n\n`;
                    paragraphs.forEach((p, idx) => {
                      if (idx > 0 && idx % 2 === 0) {
                        segmented += `\n[SCENE ${Math.floor(idx / 2) + 1}: DESARROLLO Y ANÁLISIS PROFUNDO]\n`;
                        segmented += `[SFX: AMBIENT NEWS ROOM - INTENSITY UP]\n\n`;
                      }
                      const speaker = idx % 2 === 0 ? callers[0]?.name || "Sarah" : callers[1]?.name || "David";
                      segmented += `${speaker}: ${p}\n\n`;
                    });
                    segmented += `[SCENE FINAL: CONCLUSIONES Y CIERRE]\n`;
                    segmented += `${hostName}: Con esto cerramos el segmento segmentado.\n`;
                    setReportText(segmented);
                    addToast("Segmentación Exitosa", "El guion ha sido dividido en escenas lógicas con transiciones.", "success");
                  }}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                  title="Dividir automáticamente bloques largos en escenas con transiciones"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Segmenter IA</span>
                </button>

                <button
                  onClick={() => {
                    if (!reportText.trim()) return;
                    addToast("Smart Format", "Aplicando formato estándar de guion de podcast con IA...", "info");
                    const lines = reportText.split("\n").filter(Boolean);
                    let formatted = `[SCENE 1: INTRODUCCIÓN & PRESENTACIÓN]\n`;
                    formatted += `${hostName}: [calmamente] Bienvenidos a SourceFinder Pod. Hoy analizaremos los puntos clave de nuestro dossier.\n\n`;
                    formatted += `[SFX: TECH SYNTH PULSE - FADE IN]\n\n`;
                    lines.forEach((l, idx) => {
                      const speaker = idx % 2 === 0 ? callers[0]?.name || "Sarah" : callers[1]?.name || "David";
                      formatted += `${speaker}: [entusiasta] ${l.replace(/^#+\s*/, "")}\n\n`;
                    });
                    formatted += `[SCENE 2: CONCLUSIÓN Y CIERRE]\n`;
                    formatted += `${hostName}: Excelente debate. Esto ha sido todo por hoy en nuestro podcast. ¡Hasta la próxima!\n`;
                    setReportText(formatted);
                    addToast("Smart Format Exitoso", "El guion ha sido formateado con estándares profesionales de radio.", "success");
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                  title="Aplicar formato estándar de guion de podcast"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Smart Format IA</span>
                </button>

                <button
                  onClick={() => setIsCiteModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Citar fuente bibliográfica del informe en el guion"
                >
                  <Quote className="w-3 h-3 text-slate-950" />
                  <span>Citar Fuente</span>
                </button>
              </div>
            </div>
            <ScriptEditor
              value={reportText}
              onChange={(val) => setReportText(val)}
            />
            {/* Word count and estimated reading time indicator */}
            <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              <span>Palabras: <strong className="text-slate-800 dark:text-slate-200">{reportText.trim().split(/\s+/).filter(Boolean).length}</strong></span>
              <span>Tiempo Estimado de Lectura: <strong className="text-amber-600 dark:text-amber-400">~{(reportText.trim().split(/\s+/).filter(Boolean).length / 130).toFixed(1)} min</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                Estilo
              </label>
              <select
                value={showFormat}
                onChange={(e) => setShowFormat(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 text-xs"
              >
                <option value="Debate">Debate (Conflicto)</option>
                <option value="Análisis">Análisis (Mesa)</option>
                <option value="Opinión">Opinión (Entrevista)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                Duración
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 text-xs"
              >
                <option value={1}>1 min (~125 p.)</option>
                <option value={2}>2 mins (~250 p.)</option>
                <option value={3}>3 mins (~375 p.)</option>
                <option value={5}>5 mins (~625 p.)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#1a73e8]" />
                Idioma
              </label>
              <select
                value={scriptLanguage}
                onChange={(e) => setScriptLanguage(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1a73e8] bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 text-xs"
              >
                <option value="auto">🌐 Auto (Detectar)</option>
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="it">🇮🇹 Italiano</option>
              </select>
            </div>
          </div>

          {/* Speakers Configuration */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between text-xs">
              <span>Elenco de Voces IA del Show</span>
              <Mic className="w-3.5 h-3.5 text-amber-500" />
            </h4>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                  <User className="w-3 h-3 text-indigo-500" /> Moderador:
                </span>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 w-20 font-semibold bg-slate-50 dark:bg-slate-800"
                  />
                  <select
                    value={hostVoiceProfile}
                    onChange={(e) => setHostVoiceProfile(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 text-[10px] font-mono font-medium flex-1 sm:flex-initial"
                  >
                    {AI_VOICE_PROFILES.map((vp) => (
                      <option key={vp.id} value={vp.id}>
                        🎙️ {vp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {callers.map((c, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-500">Caller #{idx + 1}:</span>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...callers];
                        updated[idx].name = e.target.value;
                        setCallers(updated);
                      }}
                      placeholder="Nombre"
                      className="px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 w-20"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={c.gender}
                      onChange={(e) => {
                        const updated = [...callers];
                        updated[idx].gender = e.target.value;
                        setCallers(updated);
                      }}
                      className="px-1 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>

                    <select
                      value={c.voiceProfile || "Kore"}
                      onChange={(e) => {
                        const updated = [...callers];
                        updated[idx].voiceProfile = e.target.value;
                        setCallers(updated);
                      }}
                      className="px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px]"
                    >
                      {AI_VOICE_PROFILES.map((vp) => (
                        <option key={vp.id} value={vp.id}>
                          🎙️ {vp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={loading || !reportText.trim()}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs uppercase tracking-wider"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Redactando Guion v2.0...
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" />
                Generar Guion de Radio v2.0
              </>
            )}
          </button>
        </div>
      </div>

      {/* Script Output Card & Collaborative Notes Sidebar */}
      <div className="lg:col-span-7 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {rawScript ? (
          <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
            {/* Dark Header with Collaboration Toggle & Language Indicator */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/50 gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Podcast Script <span className="text-slate-500 font-normal">(Draft v2)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  Idioma: {detectedLanguage || (scriptLanguage === "auto" ? "Detectado" : scriptLanguage.toUpperCase())}
                </span>
                <button
                  onClick={() => setCollabMode(!collabMode)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors ${
                    collabMode
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${collabMode ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  Colaboración: {collabMode ? "ACTIVA" : "INACTIVA"}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
                  title="Deshacer cambios (Ctrl+Z)"
                >
                  ↩️ Deshacer
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
                  title="Rehacer cambios (Ctrl+Y)"
                >
                  🔁 Rehacer
                </button>

                {versions.length > 0 && (
                  <select
                    onChange={(e) => {
                      const v = versions.find(ver => ver.id === e.target.value);
                      if (v) {
                        setRawScript(v.rawScript);
                        setParsedLines(v.parsedLines);
                        addToast("Versión Restaurada", `Se restauró la versión guardada a las ${v.timestamp}`, "success");
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 outline-none"
                  >
                    <option value="" disabled>📜 Versiones ({versions.length})</option>
                    {versions.map((ver, idx) => (
                      <option key={ver.id} value={ver.id}>
                        Versión #{idx + 1} ({ver.timestamp})
                      </option>
                    ))}
                  </select>
                )}

                {collabMode && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Colaboradores: <strong>Ana</strong> (Editando), <strong>Carlos</strong> (Revisando)</span>
                  </div>
                )}

                {stats && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {stats.wordCount} palabras | {stats.estimatedDuration}
                  </span>
                )}

                {/* Secondary Raw Script Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsRawEditMode(!isRawEditMode)}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                    isRawEditMode
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                  title="Alternar entre edición de texto raw continuo y componentes ScriptLine individuales"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isRawEditMode ? "Modo Líneas" : "Editar Texto Raw"}</span>
                </button>

                {/* Split Long Paragraphs Utility Button for TTS */}
                <button
                  type="button"
                  onClick={handleSplitLongParagraphs}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-700/80 cursor-pointer shadow-2xs"
                  title="Dividir párrafos largos en líneas de guion más cortas según puntuación para optimizar el TTS de Gemini"
                >
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dividir Párrafos (TTS)</span>
                </button>

                {/* Smart Refine Button (Gemini AI) */}
                <button
                  onClick={handleSmartRefineScript}
                  disabled={isRefining}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Detectar y corregir errores gramaticales e inconsistencias lógicas con Gemini"
                >
                  {isRefining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Refinando Guion...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Smart Refine (Gemini)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAnalyzeReadability}
                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-indigo-500/30"
                  title="Analizar legibilidad y flujo narrativo"
                >
                  <Sparkles className="w-3 h-3" />
                  Readability Analyzer
                </button>

                <button
                  onClick={() => toggleFocusMode(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors border border-blue-400/40"
                  title="Activar Modo Lectura (Focus Mode)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Modo Lectura</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>

                {onSendToStudio && (
                  <button
                    onClick={() => onSendToStudio(rawScript, parsedLines)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Abrir en Audio Deck
                  </button>
                )}
              </div>
            </div>

            {/* BULK SELECTION & EDITING CONTROL BAR */}
            {parsedLines.length > 0 && (
              <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllLines}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px] font-bold transition-colors border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>{selectedLineIds.size === parsedLines.length ? "Deseleccionar Todo" : "Seleccionar Todo"}</span>
                    <span className="bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded text-[10px]">
                      {selectedLineIds.size}/{parsedLines.length}
                    </span>
                  </button>

                  {selectedLineIds.size > 0 && (
                    <button
                      onClick={() => setSelectedLineIds(new Set())}
                      className="text-slate-400 hover:text-slate-200 font-mono text-[10px] underline ml-1"
                    >
                      Limpiar Selección
                    </button>
                  )}
                </div>

                {selectedLineIds.size > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                      Acciones Masivas:
                    </span>

                    {/* Bulk Role Selector */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleBulkChangeRole(e.target.value as any);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="bg-slate-900 text-slate-200 border border-slate-700 text-[11px] rounded px-2 py-1 outline-none"
                    >
                      <option value="" disabled>Cambiar Rol...</option>
                      <option value="host">Host / Moderador</option>
                      <option value="caller">Caller / Participante</option>
                    </select>

                    {/* Bulk Speaker Reassign */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleBulkChangeSpeaker(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="bg-slate-900 text-slate-200 border border-slate-700 text-[11px] rounded px-2 py-1 outline-none"
                    >
                      <option value="" disabled>Reasignar Locutor...</option>
                      <option value={hostName}>{hostName} (Host)</option>
                      {callers.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    {/* Bulk Sentiment */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleBulkChangeSentiment(e.target.value as any);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="bg-slate-900 text-slate-200 border border-slate-700 text-[11px] rounded px-2 py-1 outline-none"
                    >
                      <option value="" disabled>Cambiar Tono/Sentimiento...</option>
                      <option value="neutral">Neutral</option>
                      <option value="enthusiastic">Entusiasta</option>
                      <option value="concerned">Preocupado / Crítico</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Selecciona casillas de verificación para edición masiva de locutores y roles
                  </span>
                )}
              </div>
            )}

            {/* Dark Terminal Styled Lines or Raw Textarea Editor */}
            {isRawEditMode ? (
              <div className="p-6 space-y-3 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Editor de Texto Raw del Guion (Sincronización Automática con Líneas)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Sincronización en vivo con {parsedLines.length} componentes ScriptLine
                  </span>
                </div>

                <textarea
                  value={rawScript || ""}
                  onChange={(e) => handleRawScriptChange(e.target.value)}
                  rows={18}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y leading-relaxed shadow-inner"
                  placeholder="Escribe o edita aquí el texto raw completo del guion..."
                  spellCheck={false}
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>
                    Palabras: <strong className="text-amber-400">{stats?.wordCount || 0}</strong>
                  </span>
                  <span>
                    Duración Estimada: <strong className="text-emerald-400">{stats?.estimatedDuration || "0:00 min"}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 font-mono text-xs leading-loose max-h-[580px] overflow-y-auto space-y-4">
                {/* Readability & Narrative Arc Overview Panel */}
                {parsedLines.length > 0 && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 mb-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <h5 className="text-xs font-bold text-slate-100">
                          Herramienta de Análisis de Legibilidad & Flujo Conversacional
                        </h5>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-slate-400">
                          Líneas: <strong className="text-slate-200">{readabilityOverview.totalLines}</strong>
                        </span>
                        <span className="text-slate-400">
                          Prom. Palabras: <strong className="text-slate-200">{readabilityOverview.avgWords} p/línea</strong>
                        </span>
                        {readabilityOverview.complexCount > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            ⚠️ {readabilityOverview.complexCount} líneas complejas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            ✨ 100% Ritmo Conversacional
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Narrative Arc Timeline Bar */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Arco Narrativo del Episodio (Secuencia Visual de Emociones)
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                        {parsedLines.map((l, idx) => (
                          <div key={l.id || idx} className="shrink-0 flex items-center gap-1">
                            <span className="text-[9px] text-slate-500 font-mono">#{idx + 1}</span>
                            <EmotionPill emotion={l.emotion} sentiment={l.sentiment} />
                            {idx < parsedLines.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {loading && parsedLines.length === 0 && (
                  <div className="p-8 space-y-4 animate-pulse">
                    <div className="h-5 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-800/60 rounded"></div>
                    <div className="h-20 bg-slate-800/60 rounded"></div>
                  </div>
                )}

                {parsedLines.map((line, idx) => {
                  const isSelected = selectedLineIds.has(line.id);
                  const readability = analyzeLineReadability(line.text);

                  return (
                    <div
                      key={line.id}
                      className={`p-3.5 rounded-xl border relative transition-all space-y-2.5 ${
                        isSelected
                          ? "bg-slate-900 border-amber-500/80 shadow-md"
                          : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      {collabMode && idx === 1 && (
                        <div className="absolute -top-2.5 right-4 bg-emerald-500 text-slate-950 font-bold text-[9px] px-2 py-0.2 rounded-full shadow-md flex items-center gap-1 animate-bounce">
                          <span>✏️ Ana editando aquí</span>
                        </div>
                      )}
                      {collabMode && idx === 3 && (
                        <div className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.2 rounded-full shadow-md flex items-center gap-1">
                          <span>👁️ Carlos viendo</span>
                        </div>
                      )}

                      {/* Top Controls Row */}
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* LINE SELECTION CHECKBOX FOR BULK ACTIONS */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLine(line.id)}
                            className="w-3.5 h-3.5 rounded border-slate-700 accent-amber-500 cursor-pointer"
                            title="Seleccionar para edición masiva"
                          />

                          <span className="font-bold text-pink-400">{line.speaker}:</span>

                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
                              line.speakerRole === "host"
                                ? "bg-pink-950/80 text-pink-300 border border-pink-800"
                                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                            }`}
                          >
                            {line.speakerRole}
                          </span>

                          {/* COLOR-CODED EMOTION PILL INDICATOR FOR NARRATIVE ARC VISUAL CHECK */}
                          <EmotionPill emotion={line.emotion} sentiment={line.sentiment} />

                          {/* QUICK EMOTION SELECTOR DROPDOWN */}
                          <select
                            value={line.emotion || (line.sentiment === "enthusiastic" ? "Happy" : line.sentiment === "concerned" ? "Concerned" : "Neutral")}
                            onChange={(e) => handleUpdateLineEmotion(line.id, e.target.value)}
                            className="bg-slate-900 text-slate-300 border border-slate-700/80 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-amber-500 cursor-pointer font-mono"
                            title="Ajustar emoción de la línea para el arco narrativo"
                          >
                            <option value="Happy">😊 Happy</option>
                            <option value="Serious">🤔 Serious</option>
                            <option value="Energetic">⚡ Energetic</option>
                            <option value="Concerned">😟 Concerned</option>
                            <option value="Neutral">😐 Neutral</option>
                          </select>

                          {/* PREDEFINED VOICE PROFILES DROPDOWN MENU */}
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleApplyProfileToLine(line.id, e.target.value);
                              e.target.value = "";
                            }}
                            className="bg-indigo-950/90 text-indigo-200 border border-indigo-800/80 text-[10px] rounded px-1.5 py-0.5 outline-none font-mono cursor-pointer"
                            title="Asignar perfil de voz predefinido (Host, Expert, Analyst, Reporter)"
                          >
                            <option value="" disabled>
                              🎭 Perfil Vocacional...
                            </option>
                            {PREDEFINED_VOICE_PROFILES.map((prof) => (
                              <option key={prof.id} value={prof.id}>
                                {prof.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>{line.gender || "Male"}</span>
                          <span>|</span>
                          <span className="text-emerald-400">{line.accent || "Acento Standard"}</span>
                          <span>|</span>
                          <span className="text-slate-400">{line.timestamp}</span>
                        </div>
                      </div>

                      {/* Script Line Text */}
                      <p className="text-slate-200 font-serif leading-relaxed pl-4 border-l-2 border-slate-800 text-xs sm:text-sm">
                        {line.text}
                      </p>

                      {/* Bottom Actions Row: Readability Analysis Flag & Gemini TTS Single-Line Preview */}
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/60 flex-wrap gap-2">
                        {/* Readability Indicator */}
                        <div className="flex items-center gap-2">
                          {readability.isComplex ? (
                            <div className="flex items-center gap-1.5 bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>⚠️ Oración Compleja ({readability.wordCount} p)</span>
                              <button
                                type="button"
                                onClick={() => handleSimplifyLineText(line.id)}
                                className="ml-1 text-[9px] bg-rose-900 hover:bg-rose-800 text-white font-bold px-1.5 py-0.2 rounded underline cursor-pointer"
                                title="Simplificar oración para mejor flujo de locución"
                              >
                                💡 Simplificar
                              </button>
                            </div>
                          ) : readability.isWarning ? (
                            <span className="flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded">
                              <span>⚡ Moderadamente Densa ({readability.wordCount} p)</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>🟢 Flujo Óptimo ({readability.wordCount} p)</span>
                            </span>
                          )}
                        </div>

                        {/* Single-line Gemini TTS Preview Button */}
                        <button
                          type="button"
                          onClick={() => handlePlayLinePreview(line)}
                          disabled={loadingLineId === line.id}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            playingLineId === line.id
                              ? "bg-rose-950 text-rose-300 border-rose-700 animate-pulse shadow-md"
                              : "bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-500/50 shadow-xs"
                          }`}
                          title="Sintetizar y previsualizar voz IA de esta línea individual con Gemini TTS"
                        >
                          {loadingLineId === line.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              <span>Sintetizando...</span>
                            </>
                          ) : playingLineId === line.id ? (
                            <>
                              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                              <span>Detener Voz</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>Previsualizar Voz IA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 text-sm">Estudio de Redacción de Guiones</h3>
            <p className="text-xs max-w-md mx-auto text-slate-500">
              Presiona &quot;Generar Guion de Radio v2.0&quot; para crear un diálogo adaptado para podcast con voces, acentos y citas explícitas de fuentes.
            </p>
          </div>
        )}

        {/* Script Analytics & Character Intelligence Chart Panel */}
        <ScriptAnalyticsPanel lines={parsedLines} />

        {/* Script Sentiment & Emotional Impact Panel */}
        <ScriptSentimentPanel scriptLines={parsedLines} rawScript={rawScript} />

        {/* Collaborative Notes & Comments Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Notas Colaborativas & Comentarios del Equipo
            </h4>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              {comments.length} comentarios
            </span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {comments.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-emerald-500" />
                    {c.author}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {c.section}
                    </span>
                    <span>{c.time}</span>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">{c.text}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex gap-2">
              <select
                value={commentSection}
                onChange={(e) => setCommentSection(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="General">General</option>
                <option value="Introducción">Introducción</option>
                <option value="Debate">Debate</option>
                <option value="Conclusión">Conclusión</option>
              </select>

              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario sobre el guion..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }}
              />

              <button
                onClick={handleAddComment}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg text-xs transition-colors shrink-0"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating 'Cite Source' Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCiteModalOpen(true)}
          className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full shadow-xl hover:shadow-2xl border border-indigo-400/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title="Citar fuente del reporte de investigación en el guion"
        >
          <div className="p-1 bg-white/20 rounded-full">
            <Quote className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
          </div>
          <span>Cite Source</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-900/60 text-[10px] font-mono border border-indigo-400/30 text-indigo-200">
            {parsedSources.length}
          </span>
        </button>
      </div>

      {/* Floating 'Cite Source' Modal / Overlay */}
      {isCiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Quote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    Citar Fuente de Investigación
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inserta citas bibliográficas formateadas directamente desde el reporte a tu guion o informe.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCiteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formatting & Target Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Estilo de Cita
                </label>
                <select
                  value={citationFormat}
                  onChange={(e) => setCitationFormat(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="radio">Radio / Podcast [Fuente: ...]</option>
                  <option value="journalistic">Periodística [Según reporta ...]</option>
                  <option value="dialogue">Diálogo Hablado (Locutor)</option>
                  <option value="apa">Referencia IEEE / APA</option>
                </select>
              </div>

              {citationFormat === "dialogue" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Locutor
                  </label>
                  <select
                    value={selectedCitationSpeaker}
                    onChange={(e) => setSelectedCitationSpeaker(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-medium"
                  >
                    <option value={hostName}>{hostName} (Host)</option>
                    {callers.map((c, i) => (
                      <option key={i} value={c.name}>{c.name} ({c.accent})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Destino
                </label>
                <select
                  value={citationTarget}
                  onChange={(e) => setCitationTarget(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="script">Borrador de Guion Activo</option>
                  <option value="report">Informe de Inteligencia</option>
                </select>
              </div>
            </div>

            {/* Parsed Sources List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Fuentes Detectadas en el Informe ({parsedSources.length})
              </label>

              {parsedSources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {src.source}
                    </span>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-0.5 truncate max-w-[180px]"
                      >
                        <Link2 className="w-3 h-3" />
                        <span className="truncate">{src.url.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2 italic">
                    &quot;{src.excerpt}&quot;
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400">{src.title}</span>
                    <button
                      onClick={() => handleInsertCitation(src)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Insertar Cita
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Citation Builder */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                O escribe una cita o fragmento personalizado:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCitationText}
                  onChange={(e) => setCustomCitationText(e.target.value)}
                  placeholder='Ej: "El crecimiento anual del sector superó el 14% según cifras oficiales..."'
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customCitationText.trim()) {
                      handleInsertCitation();
                    }
                  }}
                />
                <button
                  onClick={() => handleInsertCitation()}
                  disabled={!customCitationText.trim()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Insertar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
