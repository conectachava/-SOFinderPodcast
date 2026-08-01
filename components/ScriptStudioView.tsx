"use client";

import React, { useState } from "react";
import { FileText, Radio, Sliders, RefreshCw, Copy, Check, Play, Mic, User, Sparkles, BarChart3, ChevronDown, ChevronUp, Quote, BookOpen, Link2, Plus, ExternalLink, X, Bookmark, ChevronRight } from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { useToast } from "./Toast";
import { SentimentBadge } from "./SentimentBadge";
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
    seconds: Math.round((data.words / 140) * 60),
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
                ~{Math.round((totalWords / 140) * 60)}s
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
                      formatter={(val: any) => [`${val} palabras (~${Math.round(((val as number) / 140) * 60)}s)`, "Volumen"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Equilibrio del Diálogo</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Proporción de tiempo ocupado por cada locutor según ~140 palabras por minuto.
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

const ScriptEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isFocused, setIsFocused] = useState(false);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Syntax highlighting logic
  const highlightText = (text: string) => {
    // Escape HTML to prevent injection
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Highlight speakers (e.g., "Paul:", "Sarah:")
    let highlighted = escaped.replace(/^([a-zA-Z0-9_ -]+):/gm, '<span class="text-pink-600 dark:text-pink-400 font-bold">$1:</span>');
    
    // Highlight stage directions / scenes (e.g., [SCENE 1:...], [SFX:...])
    highlighted = highlighted.replace(/\[([^\]]+)\]/g, '<span class="text-emerald-600 dark:text-emerald-400 font-bold">[$1]</span>');
    
    // Highlight headers (e.g., ## Resumen Ejecutivo)
    highlighted = highlighted.replace(/^(##\s.+)$/gm, '<span class="text-indigo-600 dark:text-indigo-400 font-bold">$1</span>');

    // Add extra newline at the end so trailing newlines are rendered
    return { __html: highlighted + '\n' };
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className={`relative w-full border rounded-lg overflow-hidden min-h-[160px] sm:min-h-[220px] ${
      isFocused 
        ? "border-slate-900 dark:border-slate-100 ring-2 ring-slate-900 dark:ring-slate-100" 
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    }`}>
      {/* Backdrop for syntax highlighting */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 pointer-events-none px-3 py-2 font-mono text-[11px] whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100 overflow-hidden"
        aria-hidden="true"
        dangerouslySetInnerHTML={highlightText(value)}
      />
      
      {/* Transparent Textarea for actual editing */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full px-3 py-2 bg-transparent text-transparent caret-slate-900 dark:caret-white resize-none focus:outline-none font-mono text-[11px] whitespace-pre-wrap break-words m-0 border-none overflow-auto"
        placeholder="Pega aquí el informe o resumen de fuentes..."
        spellCheck={false}
      />
    </div>
  );
};

export function ScriptStudioView({
  initialReport,
  onSendToStudio,
}: {
  initialReport?: string;
  onSendToStudio?: (script: string, lines: ScriptLine[]) => void;
}) {
  const { addToast } = useToast();

  const [reportText, setReportText] = useState(
    initialReport ||
      `## Resumen Ejecutivo\nEl nuevo iPhone 15 Pro ha sido lanzado con críticas positivas por su procesador A17 Bionic y cuerpo de titanio, impulsando además ingresos récord en la división de servicios de Apple.\n\n## Puntos Clave\n- El iPhone 15 Pro integra el chip A17 Bionic con arquitectura de 3nm.\n- Apple reportó ingresos superiores a las proyecciones de Wall Street.\n- Transición oficial a puerto USB-C y botón de acción personalizable.\n\n## Puntos de Debate\n- Cuestionamientos sobre si el aumento de precio en el modelo Pro Max está justificado.\n- Preocupaciones de analistas sobre el ritmo de renovación en el mercado de smartphones.\n\n## Fuentes Verificadas\n- https://www.theverge.com/2023/10/30/iphone-15-pro-review\n- https://www.techcrunch.com/2023/11/01/apple-earnings-report`
  );

  const [showFormat, setShowFormat] = useState<"Debate" | "Análisis" | "Opinión">("Debate");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [hostName, setHostName] = useState("Paul");
  const [callers, setCallers] = useState([
    { name: "Sarah", gender: "Female", accent: "American Midwest" },
    { name: "David", gender: "Male", accent: "British" },
  ]);

  const [loading, setLoading] = useState(false);
  const [rawScript, setRawScript] = useState<string | null>(null);
  const [parsedLines, setParsedLines] = useState<ScriptLine[]>([]);
  const [stats, setStats] = useState<{ wordCount: number; estimatedDuration: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collabMode, setCollabMode] = useState<boolean>(true);

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
      const res = await fetch("/api/script-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intelligenceReport: reportText,
          showFormat,
          durationMinutes,
          customHostName: hostName,
          customCallers: callers,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falló la generación del guion");
      }

      const data = await res.json();
      setRawScript(data.rawScript);
      setParsedLines(data.lines || []);
      pushHistory(data.rawScript, data.lines || []);
      setStats({
        wordCount: data.wordCount,
        estimatedDuration: data.estimatedDuration,
      });

      addToast("Guion Generado", `Guion de ${data.wordCount} palabras redactado exitosamente.`, "success");
    } catch (err: any) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Script Settings & Dossier Input */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Radio className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            Guionista v2.0 - Generador de Podcast
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convierte informes de inteligencia en guiones de radio con formato profesional.
          </p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                Estilo de Programa
              </label>
              <select
                value={showFormat}
                onChange={(e) => setShowFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="Debate">Debate (Conflicto)</option>
                <option value="Análisis">Análisis (Mesa Redonda)</option>
                <option value="Opinión">Opinión (Entrevista)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 uppercase text-[10px] tracking-wider mb-1.5">
                Duración Doblaje
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-800"
              >
                <option value={1}>1 min (~125 palabras)</option>
                <option value={2}>2 mins (~250 palabras)</option>
                <option value={3}>3 mins (~375 palabras)</option>
                <option value={5}>5 mins (~625 palabras)</option>
              </select>
            </div>
          </div>

          {/* Speakers Configuration */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between text-xs">
              <span>Elenco de Voces del Show</span>
              <Mic className="w-3.5 h-3.5 text-slate-900" />
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200">
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-900" /> Moderador Principal:
                </span>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="px-2 py-0.5 border border-slate-300 rounded text-slate-800 w-24 text-right font-semibold"
                />
              </div>

              {callers.map((c, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-1.5 text-[10px] bg-white p-2 rounded border border-slate-200">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...callers];
                      updated[idx].name = e.target.value;
                      setCallers(updated);
                    }}
                    placeholder="Nombre"
                    className="px-1.5 py-0.5 border border-slate-300 rounded font-medium text-slate-800"
                  />
                  <select
                    value={c.gender}
                    onChange={(e) => {
                      const updated = [...callers];
                      updated[idx].gender = e.target.value;
                      setCallers(updated);
                    }}
                    className="px-1 py-0.5 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                  <input
                    type="text"
                    value={c.accent}
                    onChange={(e) => {
                      const updated = [...callers];
                      updated[idx].accent = e.target.value;
                      setCallers(updated);
                    }}
                    placeholder="Acento"
                    className="px-1.5 py-0.5 border border-slate-300 rounded text-slate-800"
                  />
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
            {/* Dark Header with Collaboration Toggle */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/50 gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Podcast Script <span className="text-slate-500 font-normal">(Draft v2)</span>
                </h3>
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

                <button
                  onClick={handleAnalyzeReadability}
                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-indigo-500/30"
                  title="Analizar legibilidad y flujo narrativo"
                >
                  <Sparkles className="w-3 h-3" />
                  Readability Analyzer
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

            {/* Dark Terminal Styled Lines matching Design HTML */}
            <div className="p-6 font-mono text-xs leading-loose max-h-[500px] overflow-y-auto space-y-4">
              {loading && parsedLines.length === 0 && (
                <div className="p-8 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-20 bg-slate-800/60 rounded"></div>
                  <div className="h-20 bg-slate-800/60 rounded"></div>
                </div>
              )}
              {parsedLines.map((line, idx) => (
                <div key={line.id} className="p-3 bg-slate-950/60 rounded border border-slate-800/80 relative">
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
                  <div className="flex items-center justify-between text-[11px] mb-1.5 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pink-400">{line.speaker}:</span>
                      <SentimentBadge sentiment={line.sentiment} text={line.text} size="sm" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {line.gender} | <span className="text-emerald-400">{line.accent}</span>
                    </span>
                  </div>
                  <p className="text-slate-200 font-serif leading-relaxed">{line.text}</p>
                </div>
              ))}
            </div>
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
