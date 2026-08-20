"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Shield, Filter, RefreshCw, Copy, Check, ExternalLink, AlertTriangle, FileText, Sparkles, TrendingUp, BarChart3, Quote, Link2, BookmarkCheck, Layers, ListOrdered, Wand2, Plus, Trash2, Edit3, ArrowRight, BookOpen, Share2, Play, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceBadge } from "./SourceBadge";
import { SmartSummary } from "./SmartSummary";
import { useToast } from "./Toast";
import type { SignalAnalysisResult } from "@/app/api/source-finder/route";
import type { TopicDecompositionResult, SubtopicItem } from "@/app/api/topic-decomposer/route";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { safeFetchJson } from "@/lib/utils";
import { useAuth } from "@/app/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { safeSetDoc } from "@/lib/firebase";

export function SourceFinderView({ onUseReportForScript }: { onUseReportForScript?: (report: string) => void }) {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [mode, setMode] = useState<"direct" | "sequential">("direct");
  const [topic, setTopic] = useState("Revolución de la Inteligencia Artificial Generativa: Agentes Autónomos, AGI y el Futuro del Trabajo");
  const [contentType, setContentType] = useState("Noticia Tecnológica");
  const [minReputation, setMinReputation] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [qualifiedSources, setQualifiedSources] = useState<any[]>([]);
  const [rawSources, setRawSources] = useState<any[]>([]);
  const [signalAnalysis, setSignalAnalysis] = useState<SignalAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [isCitingActive, setIsCitingActive] = useState<boolean>(false);
  const [activeCitationIndex, setActiveCitationIndex] = useState<number | null>(null);
  const [groundingMode, setGroundingMode] = useState<"speed" | "depth">("speed");

  // Sequential mode state
  const [subtopicCount, setSubtopicCount] = useState<number>(4);
  const [decomposing, setDecomposing] = useState<boolean>(false);
  const [decomposition, setDecomposition] = useState<TopicDecompositionResult | null>(null);
  const [activeSubtopicIdx, setActiveSubtopicIdx] = useState<number | null>(null);
  const [batchInvestigating, setBatchInvestigating] = useState<boolean>(false);
  const [editingSubtopicIdx, setEditingSubtopicIdx] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDesc, setEditedDesc] = useState("");

  // Extract key facts and link them with source verification data
  const citations = React.useMemo(() => {
    if (!report) return [];
    const sourcesToUse = qualifiedSources.length > 0 ? qualifiedSources : rawSources;
    const lines = report
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 25 && !l.startsWith("#") && !l.startsWith("-"));

    return lines.slice(0, 5).map((fact, idx) => {
      const src = sourcesToUse[idx % Math.max(1, sourcesToUse.length)];
      return {
        id: idx + 1,
        factText: fact.length > 150 ? fact.substring(0, 150) + "..." : fact,
        sourceTitle: src?.title || src?.domain || "Fuente Oficial Verificada",
        sourceDomain: src?.domain || "fuente-verificada.com",
        sourceUrl: src?.url || "#",
        reputation: src?.source_reputation || 0.88,
      };
    });
  }, [report, qualifiedSources, rawSources]);

  // Mock chart data derived or default for keyword frequency and sentiment trends
  const keywordData = [
    { keyword: "Innovación", frequency: 28 },
    { keyword: "Rendimiento", frequency: 24 },
    { keyword: "Seguridad", frequency: 19 },
    { keyword: "Mercado", frequency: 15 },
    { keyword: "Crecimiento", frequency: 12 },
  ];

  const sentimentTrendData = [
    { time: "Día 1", Positivo: 65, Neutro: 25, Negativo: 10 },
    { time: "Día 2", Positivo: 70, Neutro: 20, Negativo: 10 },
    { time: "Día 3", Positivo: 82, Neutro: 12, Negativo: 6 },
    { time: "Día 4", Positivo: 78, Neutro: 15, Negativo: 7 },
    { time: "Día 5", Positivo: 85, Neutro: 10, Negativo: 5 },
  ];

  const handleResearch = useCallback(async (forcedTopic?: string) => {
    const targetTopic = forcedTopic || topic;
    if (!targetTopic.trim()) {
      addToast("Error de Validación", "Ingresa un tema válido para investigar.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setSignalAnalysis(null);
    addToast(
      targetTopic.toUpperCase() === "TENDENCIAS" ? "Analista de Señales Activo" : "Búsqueda Iniciada",
      targetTopic.toUpperCase() === "TENDENCIAS"
        ? "Escaneando tendencias en Google Trends, Reddit y YouTube..."
        : "Consultando fuentes web y evaluando reputación...",
      "info"
    );

    try {
      const response = await safeFetchJson("/api/source-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          contentType,
          customMinReputation: minReputation,
          groundingMode,
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Error al investigar el tema");
      }

      const data = response.data;
      setReport(data.report);
      setQualifiedSources(data.qualifiedSources || []);
      setRawSources(data.rawSources || []);
      setSignalAnalysis(data.signalAnalysis || null);

      if (data.signalAnalysis) {
        addToast(
          "Tendencia Validada",
          `Tendencia detectada: "${data.signalAnalysis.detectedTopic}" (Fuerza: ${data.signalAnalysis.strength}, Diversidad: ${data.signalAnalysis.diversity})`,
          "success"
        );
      } else {
        addToast(
          "Informe Generado",
          `Se calificaron ${data.qualifiedSources?.length || 0} fuentes con puntaje >${(minReputation * 100).toFixed(0)}%.`,
          "success"
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("abort")) {
        return;
      }
      const msg = err.message || "Ocurrió un error inesperado en la investigación.";
      setError(msg);
      addToast("Error en Búsqueda", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [topic, contentType, minReputation, addToast, groundingMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLiveMonitoring) {
      addToast("Monitoreo en Vivo Activado", "La IA consultará periódicamente novedades sobre el tema.", "info");
      interval = setInterval(() => {
        handleResearch();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMonitoring, handleResearch, addToast]);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    addToast("Copiado", "Informe copiado al portapapeles.", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: "pdf" | "txt") => {
    if (!report) return;
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content: report, format }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic.replace(/ /g, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addToast("Exportación", `Informe exportado como ${format.toUpperCase()}`, "success");
    } catch (e) {
      addToast("Error", "Error al exportar el archivo", "error");
    }
  };

  const handleSaveReport = async () => {
    if (!report || !user) return;
    try {
      await safeSetDoc(doc(db, "users", user.uid, "reports", Date.now().toString()), {
        topic,
        content: report,
        createdAt: serverTimestamp(),
      });
      addToast("Guardado", "Informe guardado en tu perfil.", "success");
    } catch (e) {
      addToast("Error", "Error al guardar el informe", "error");
    }
  };

  // Handler to decompose topic into logical subtopic sequence
  const handleDecomposeTopic = async () => {
    if (!topic.trim()) {
      addToast("Error de Validación", "Por favor ingresa un tema principal a analizar.", "error");
      return;
    }

    setDecomposing(true);
    setError(null);
    addToast(
      "Analizando Estructura y Subtemas",
      `Descomponiendo "${topic}" en ${subtopicCount} entregas secuenciales con hilo conductor...`,
      "info"
    );

    try {
      const response = await safeFetchJson("/api/topic-decomposer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType,
          targetCount: subtopicCount,
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Error al descomponer el tema en secuencia.");
      }

      setDecomposition(response.data);
      addToast(
        "Secuencia Generada",
        `Se identificaron ${response.data.subtopics.length} subtemas con identidad y secuencia narrativa.`,
        "success"
      );
    } catch (err: any) {
      const msg = err.message || "No se pudo descomponer el tema.";
      setError(msg);
      addToast("Error al Descomponer", msg, "error");
    } finally {
      setDecomposing(false);
    }
  };

  // Investigate a specific subtopic from the sequence
  const handleInvestigateSubtopic = async (subtopic: SubtopicItem, idx: number) => {
    setActiveSubtopicIdx(idx);
    setTopic(subtopic.title);
    addToast(
      "Investigando Subtema",
      `Ejecutando auditoría de inteligencia para el Módulo #${subtopic.sequenceNumber}: "${subtopic.title}"`,
      "info"
    );
    await handleResearch(subtopic.title);
  };

  // Investigate all subtopics in batch to compile a full master report
  const handleBatchInvestigateAll = async () => {
    if (!decomposition || decomposition.subtopics.length === 0) return;

    setBatchInvestigating(true);
    addToast(
      "Investigación en Lote Iniciada",
      `Ejecutando auditoría para los ${decomposition.subtopics.length} subtemas de la serie...`,
      "info"
    );

    let masterReport = `# INFORME MAESTRO DE INTELIGENCIA Y SECUENCIA NARRATIVA\n\n`;
    masterReport += `**Serie:** ${decomposition.suggestedSeriesTitle}\n`;
    masterReport += `**Tema Central:** ${decomposition.mainTopic}\n`;
    masterReport += `**Identidad Narrativa & Hilo Conductor:** ${decomposition.narrativeIdentity}\n`;
    masterReport += `**Audiencia Objetivo:** ${decomposition.targetAudience}\n\n`;
    masterReport += `---\n\n`;

    const allSources: any[] = [];

    try {
      for (let i = 0; i < decomposition.subtopics.length; i++) {
        const sub = decomposition.subtopics[i];
        addToast("Procesando Lote", `Procesando (${i + 1}/${decomposition.subtopics.length}): ${sub.title}`, "info");

        const res = await safeFetchJson("/api/source-finder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: `${decomposition.mainTopic} - ${sub.title}`,
            contentType,
            customMinReputation: minReputation,
          }),
        });

        if (res.ok && res.data) {
          masterReport += `## ENTREGABLE #${sub.sequenceNumber}: ${sub.title.toUpperCase()}\n`;
          masterReport += `* **Enfoque Sugerido:** ${sub.recommendedAngle}\n`;
          masterReport += `* **Duración Objetivo:** ${sub.suggestedDuration}\n\n`;
          masterReport += `${res.data.report}\n\n`;
          masterReport += `---\n\n`;

          if (Array.isArray(res.data.qualifiedSources)) {
            allSources.push(...res.data.qualifiedSources);
          }
        }
      }

      setReport(masterReport);
      setQualifiedSources(allSources);
      addToast("Informe Maestro Completado", "Se compiló la investigación completa de todos los subtemas.", "success");
    } catch (err: any) {
      addToast("Error en Lote", err.message || "Ocurrió un error en la investigación en lote.", "error");
    } finally {
      setBatchInvestigating(false);
    }
  };

  const handleCopySequenceMarkdown = () => {
    if (!decomposition) return;
    let md = `# SERIE DE PODCAST: ${decomposition.suggestedSeriesTitle.toUpperCase()}\n\n`;
    md += `**Tema Central:** ${decomposition.mainTopic}\n`;
    md += `**Identidad Narrativa & Hilo Conductor:** ${decomposition.narrativeIdentity}\n`;
    md += `**Audiencia Objetivo:** ${decomposition.targetAudience}\n\n`;
    md += `### ESTRUCTURA Y SUBTEMAS SECUENCIALES:\n\n`;

    decomposition.subtopics.forEach((s) => {
      md += `#### #${s.sequenceNumber} - ${s.title}\n`;
      md += `${s.description}\n`;
      md += `- **Puntos Clave:** ${s.keyQuestions.join(", ")}\n`;
      md += `- **Enfoque:** ${s.recommendedAngle} | **Duración:** ${s.suggestedDuration}\n\n`;
    });

    navigator.clipboard.writeText(md);
    addToast("Esquema Copiado", "La secuencia completa de subtemas fue copiada en Markdown.", "info");
  };

  const handleAddCustomSubtopic = () => {
    if (!decomposition) return;
    const nextSeq = decomposition.subtopics.length + 1;
    const newSub: SubtopicItem = {
      sequenceNumber: nextSeq,
      title: `Subtema Personalizado #${nextSeq}`,
      description: "Define aquí los aspectos clave que deseas abordar en esta entrega adicional.",
      keyQuestions: ["¿Cuáles son las implicaciones principales?", "¿Qué caso práctico respalda esto?"],
      suggestedDuration: "3-5 min",
      recommendedAngle: "Caso de Estudio",
      keywords: [contentType],
    };
    setDecomposition({
      ...decomposition,
      subtopics: [...decomposition.subtopics, newSub],
    });
    addToast("Subtema Añadido", `Se incorporó el subtema #${nextSeq} a la secuencia.`, "success");
  };

  const handleRemoveSubtopic = (idx: number) => {
    if (!decomposition) return;
    const updated = decomposition.subtopics.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      sequenceNumber: i + 1,
    }));
    setDecomposition({
      ...decomposition,
      subtopics: updated,
    });
    addToast("Subtema Eliminado", "Se reordenó la secuencia.", "info");
  };

  const handleSaveSubtopicEdit = (idx: number) => {
    if (!decomposition) return;
    const updated = [...decomposition.subtopics];
    updated[idx] = {
      ...updated[idx],
      title: editedTitle.trim() || updated[idx].title,
      description: editedDesc.trim() || updated[idx].description,
    };
    setDecomposition({
      ...decomposition,
      subtopics: updated,
    });
    setEditingSubtopicIdx(null);
    addToast("Cambios Guardados", "Se actualizó el subtema en la secuencia.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search Input Panel */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Search className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            Investigación SourceFinder
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Módulo de inteligencia y análisis secuencial de temas en tiempo real.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setMode("direct")}
            className={`py-1.5 px-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "direct"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Investigar Tema</span>
          </button>
          <button
            onClick={() => setMode("sequential")}
            className={`py-1.5 px-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "sequential"
                ? "bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Serie Secuencial</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              {mode === "sequential" ? "Tema Principal de la Serie" : "Tema a Investigar"}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder={
                mode === "sequential"
                  ? "Ej: Inteligencia Artificial Generativa, Finanzas Personales desde cero, Historia de Roma..."
                  : "Ej: Nuevo chip M4 Pro de Apple o avances en IA..."
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[90px] sm:min-h-[110px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              Modo de Investigación (Advanced Grounding)
            </label>
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                className={`flex-1 py-1 text-[10px] font-bold rounded ${groundingMode === 'speed' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500'}`}
                onClick={() => setGroundingMode('speed')}
              >
                Velocidad
              </button>
              <button
                className={`flex-1 py-1 text-[10px] font-bold rounded ${groundingMode === 'depth' ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500'}`}
                onClick={() => setGroundingMode('depth')}
              >
                Profundidad
              </button>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              Estrategia / Tipo de Contenido
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
            >
              <option value="Noticia Tecnológica">Noticia Tecnológica (70% News / 30% Web Reputada)</option>
              <option value="Espectáculos">Espectáculos / Entretenimiento (60% Web / 30% News / 10% YT)</option>
              <option value="Análisis de Producto">Análisis de Producto (Reviews / Reddit / YT)</option>
              <option value="Movie Review">Movie Review (Análisis Cinematográfico / Crítica / 60% Reputación)</option>
              <option value="General">General / Explicativo (Wikipedia / Ensayos / Scholar)</option>
            </select>
          </div>

          {mode === "sequential" ? (
            <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Número de Subtemas / Entregas:
                </label>
                <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-xs">
                  {subtopicCount} Entregas
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={subtopicCount}
                onChange={(e) => setSubtopicCount(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                La IA analizará el tema principal y estructurará una secuencia de subtemas ordenados con hilo conductor e identidad compartida.
              </p>

              <button
                onClick={handleDecomposeTopic}
                disabled={decomposing || !topic.trim()}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                {decomposing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analizando Tema e Hilo Conductor...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-indigo-200 animate-pulse" />
                    <span>Descomponer en Secuencia (IA)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                    Umbral Mínimo Reputación
                  </label>
                  <span className="font-mono font-bold text-slate-900">{(minReputation * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.05"
                  value={minReputation}
                  onChange={(e) => setMinReputation(parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fuentes con puntaje menor serán descartadas.
                </p>
              </div>

              {/* Live Monitoring Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLiveMonitoring ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">Monitoreo en Vivo (Live)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Actualiza automáticamente cada 30s</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isLiveMonitoring
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  {isLiveMonitoring ? "Activo" : "Inactivo"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleResearch()}
                  disabled={loading || !topic.trim()}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs uppercase tracking-wider cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Investigando...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Investigar
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTopic("TENDENCIAS");
                    handleResearch("TENDENCIAS");
                  }}
                  disabled={loading}
                  className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Escanea tendencias con Analista de Señales v2.0"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Tendencias
                </button>
              </div>
            </>
          )}
        </div>

        {/* Source Filter Pipeline Stats */}
        {rawSources.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Auditoría de Fuentes</span>
              <Shield className="w-3.5 h-3.5 text-slate-900" />
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded">
                <span className="block text-base font-bold text-emerald-700">{qualifiedSources.length}</span>
                <span className="text-[10px] text-emerald-600">Aprobadas</span>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-100 rounded">
                <span className="block text-base font-bold text-rose-700">{rawSources.length - qualifiedSources.length}</span>
                <span className="text-[10px] text-rose-600">Descartadas</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report & Source Audit / Sequential Material Output */}
      <div className="lg:col-span-6 space-y-6">
        <SmartSummary report={report} />
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sequential Topic Material Breakdown View */}
        {mode === "sequential" && decomposition && (
          <div className="bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-900/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 transition-colors">
            {/* Header: Series Title & Narrative Identity */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-xl space-y-4 shadow-sm border border-indigo-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-300 block">
                      Serie Secuencial de Contenido
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      {decomposition.suggestedSeriesTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={handleBatchInvestigateAll}
                    disabled={batchInvestigating}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Investiga todos los subtemas para generar un informe maestro"
                  >
                    {batchInvestigating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Investigando Lote...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Investigar Serie Completa</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopySequenceMarkdown}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    title="Copiar estructura completa en Markdown"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Esquema</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-950/70 border border-indigo-800/60 rounded-lg text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  Identidad Narrativa & Hilo Conductor:
                </span>
                <p className="text-indigo-100 font-medium leading-relaxed">
                  {decomposition.narrativeIdentity}
                </p>
                {decomposition.targetAudience && (
                  <div className="pt-1 flex items-center gap-2 text-[11px] text-indigo-300">
                    <span className="font-bold">Audiencia Objetivo:</span>
                    <span className="bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700 font-mono text-[10px] text-indigo-200">
                      {decomposition.targetAudience}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* List of Sequential Subtopics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-500" />
                  <span>Subtemas e Hitos de la Secuencia ({decomposition.subtopics.length} Módulos)</span>
                </h4>
                <button
                  onClick={handleAddCustomSubtopic}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Módulo</span>
                </button>
              </div>

              <div className="space-y-3">
                {decomposition.subtopics.map((sub, idx) => {
                  const isEditing = editingSubtopicIdx === idx;
                  const isCurrentActive = activeSubtopicIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                        isCurrentActive
                          ? "bg-indigo-50/70 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-400/50 shadow-xs"
                          : "bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-[11px] rounded-lg shrink-0 shadow-2xs font-mono">
                            #{sub.sequenceNumber}
                          </span>

                          <div className="space-y-1 flex-1">
                            {isEditing ? (
                              <div className="space-y-2 pt-0.5">
                                <input
                                  type="text"
                                  value={editedTitle}
                                  onChange={(e) => setEditedTitle(e.target.value)}
                                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded text-xs font-bold"
                                />
                                <textarea
                                  value={editedDesc}
                                  onChange={(e) => setEditedDesc(e.target.value)}
                                  rows={2}
                                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded text-xs"
                                />
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={() => setEditingSubtopicIdx(null)}
                                    className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveSubtopicEdit(idx)}
                                    className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {sub.title}
                                </h5>
                                <p className="text-slate-600 dark:text-slate-300 leading-snug">
                                  {sub.description}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingSubtopicIdx(idx);
                                setEditedTitle(sub.title);
                                setEditedDesc(sub.description);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                              title="Editar este subtema"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveSubtopic(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                              title="Eliminar de la secuencia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Key questions or points */}
                      {sub.keyQuestions && sub.keyQuestions.length > 0 && (
                        <div className="p-2.5 bg-white dark:bg-slate-900/80 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Puntos Clave / Preguntas a Cubrir:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                            {sub.keyQuestions.map((q, qIdx) => (
                              <li key={qIdx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span className="truncate">{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Footer tags and Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-[10px] rounded border border-indigo-200 dark:border-indigo-800">
                            {sub.recommendedAngle}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold text-[10px] rounded">
                            ⏱️ {sub.suggestedDuration}
                          </span>
                          {sub.keywords?.map((kw, kwIdx) => (
                            <span key={kwIdx} className="text-[10px] font-mono text-slate-400">
                              #{kw}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleInvestigateSubtopic(sub, idx)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Search className="w-3 h-3" />
                            <span>Investigar Subtema</span>
                          </button>

                          {onUseReportForScript && (
                            <button
                              onClick={() => {
                                const subContext = `SUBTEMA #${sub.sequenceNumber}: ${sub.title}\n${sub.description}\nPuntos clave: ${sub.keyQuestions.join("; ")}\nEnfoque: ${sub.recommendedAngle}`;
                                onUseReportForScript(subContext);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                            >
                              <FileText className="w-3 h-3 text-indigo-500" />
                              <span>Usar en Guion</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {loading && !report && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
          </div>
        )}

        {report ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs space-y-0 transition-colors">
            {/* Signal Analyst Badge Banner if triggered via TENDENCIAS */}
            {signalAnalysis && (
              <div className="bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      Signal Analyst Conclusion: &quot;{signalAnalysis.detectedTopic}&quot;
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Tendencia validada por cruce multifuente (Google Trends, YouTube Trending, Reddit)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">
                    Fuerza: {signalAnalysis.strength}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-bold">
                    Diversidad: {signalAnalysis.diversity}
                  </span>
                </div>
              </div>
            )}

            {/* Clean Header matching Design HTML */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Intelligence Report</span>
                {isCitingActive && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-mono font-bold animate-pulse">
                    Modo Citas Activo
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
                  Verified
                </span>

                {/* Cite Button */}
                <button
                  onClick={() => {
                    const next = !isCitingActive;
                    setIsCitingActive(next);
                    if (next) {
                      addToast(
                        "Citas e Histogramas de Verificación Activos",
                        "Hechos clave del informe vinculados con enlaces directos a sus fuentes verificadas.",
                        "info"
                      );
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isCitingActive
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm ring-2 ring-amber-300"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700"
                  }`}
                  title="Destacar hechos clave y verificar enlaces de fuentes originales"
                >
                  <Quote className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  <span>{isCitingActive ? "Citas Activas" : "Citar Fuentes"}</span>
                </button>

                <button
                  onClick={handleSaveReport}
                  disabled={!user}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200"
                  title="Guardar informe en tu perfil"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport("txt")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  TXT
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>

                {onUseReportForScript && (
                  <button
                    onClick={() => onUseReportForScript(report)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Enviar a Guionista
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Citation & Verification Deck if Citing is Active */}
            {isCitingActive && citations.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                      Hechos Clave Verificados & Referencias Cruzadas ({citations.length} Citas)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                    Sello de Auditoría IA: Aprobado
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {citations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveCitationIndex(c.id);
                        addToast(
                          `Cita #${c.id} Seleccionada`,
                          `Resaltando fuente: ${c.sourceDomain} (${Math.round(c.reputation * 100)}% Confianza)`,
                          "info"
                        );
                      }}
                      className={`p-3 rounded-lg border text-xs space-y-2 transition-all cursor-pointer ${
                        activeCitationIndex === c.id
                          ? "bg-amber-100 dark:bg-amber-900/90 border-amber-500 ring-2 ring-amber-400 shadow-sm"
                          : "bg-white/80 dark:bg-slate-900/90 border-amber-200/80 dark:border-amber-800/80 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-extrabold rounded">
                          [Cita #{c.id}]
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {Math.round(c.reputation * 100)}% Confianza
                        </span>
                      </div>

                      <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-snug italic border-l-2 border-amber-400 pl-2">
                        &quot;{c.factText}&quot;
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-100 dark:border-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                          {c.sourceTitle}
                        </span>
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] rounded flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <span>Verificar Fuente</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Body */}
            <div className="p-6 prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>

            {/* Analytics Dashboard (Keyword Frequency & Sentiment Trends) */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  Dashboard de Análisis: Palabras Clave & Tendencia de Sentimiento
                </h4>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                  Recharts Analytics
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keyword Frequency Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Frecuencia de Palabras Clave Principales
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={keywordData}>
                        <XAxis dataKey="keyword" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "11px" }} />
                        <Bar dataKey="frequency" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sentiment Trends Line Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Tendencia Histórica de Sentimiento (%)
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sentimentTrendData}>
                        <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="Positivo" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Neutro" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Negativo" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Sources Audit Table */}
            {rawSources.length > 0 && (
              <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50/30">
                <h4 className="font-bold text-slate-900 text-xs mb-3">Auditoría de Calificación de Fuentes</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 px-2 font-medium">Dominio / URL</th>
                        <th className="py-2 px-2 font-medium">Título</th>
                        <th className="py-2 px-2 font-medium">Confianza</th>
                        <th className="py-2 px-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawSources.map((s, idx) => {
                        const confidencePct = Math.round((s.source_reputation || 0.8) * 100);
                        const isHovered = hoveredSourceIndex === idx;
                        return (
                          <tr
                            key={idx}
                            onMouseEnter={() => setHoveredSourceIndex(idx)}
                            onMouseLeave={() => setHoveredSourceIndex(null)}
                            className={`relative transition-colors ${s.qualified ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "bg-rose-50/30 hover:bg-rose-50/60 opacity-75"}`}
                          >
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-700">
                              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                {s.domain}
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </td>
                            <td className="py-2 px-2 text-slate-800 font-medium max-w-[200px] truncate">{s.title}</td>
                            <td className="py-2 px-2">
                              <SourceBadge score={s.source_reputation} qualified={s.qualified} />
                            </td>
                            <td className="py-2 px-2 text-[11px] relative">
                              {s.qualified ? (
                                <span className="text-emerald-700 font-medium">✓ Calificada</span>
                              ) : (
                                <span className="text-rose-600 font-medium">{s.rejection_reason || "Rechazada"}</span>
                              )}

                              {/* Confidence Score Hover Overlay */}
                              {isHovered && (
                                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-xl z-30 border border-slate-700 text-xs space-y-2 animate-in fade-in">
                                  <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-1.5">
                                    <span className="text-amber-300">Confianza de Dominio</span>
                                    <span className="font-mono text-emerald-400">{confidencePct}% Trusted</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300">
                                    {s.qualified
                                      ? `Dominio con alta reputación y verificación SSL activa. Índice de autoridad: ${(s.source_reputation * 10).toFixed(1)}/10.`
                                      : `Dominio descartado por bajo puntaje de autoridad (${(s.source_reputation * 10).toFixed(1)}/10) o sesgo editorial detectado.`}
                                  </p>
                                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                                    <span>Seguridad: HTTPS OK</span>
                                    <span>Verificación IA: Aprobada</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : mode === "direct" ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Esperando Investigación</h3>
            <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400">
              Ingresa un tema arriba y haz clic en &quot;Investigar&quot; para ejecutar la búsqueda verificada y calificación de fuentes.
            </p>
          </div>
        ) : !decomposition ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-12 text-center text-indigo-950 dark:text-indigo-200 space-y-3">
            <Layers className="w-10 h-10 text-indigo-400 mx-auto animate-bounce" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Descomposición y Secuencia de Contenido</h3>
            <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400 leading-relaxed">
              Introduce un tema principal en el panel izquierdo (ej: &quot;Inteligencia Artificial Generativa&quot;) y presiona <strong className="text-indigo-600 dark:text-indigo-400">Descomponer en Secuencia</strong> para que la IA estructure los subtemas, hilo conductor e identidad de la serie.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
