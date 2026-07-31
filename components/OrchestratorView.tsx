"use client";

import React, { useState, useRef } from "react";
import { Layers, Play, CheckCircle2, Clock, Sparkles, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { PodcastStudioView } from "./PodcastStudioView";
import { useToast } from "./Toast";
import { PodcastHistoryItem } from "./RecentDrawer";
import { useAuth } from "../app/AuthProvider";
import { LandingHero } from "./LandingHero";

interface OrchestratorViewProps {
  onSaveToHistory?: (item: PodcastHistoryItem) => void;
  onUpdatePipelineData?: (data: {
    reportText?: string;
    rawScript?: string;
    scriptLines?: ScriptLine[];
    storyboardData?: any;
  }) => void;
  presetTopic?: string;
  presetContentType?: string;
  presetFormat?: "Debate" | "Análisis" | "Opinión";
}

export function OrchestratorView({
  onSaveToHistory,
  onUpdatePipelineData,
  presetTopic,
  presetContentType,
  presetFormat,
}: OrchestratorViewProps) {
  const { addToast } = useToast();
  const { user, profile, isAdmin } = useAuth();
  const orchestratorRef = useRef<HTMLDivElement>(null);

  const [topic, setTopic] = useState(presetTopic || "Procesador Quantum Gemini y Computación Cuántica 2026");
  const [contentType, setContentType] = useState(presetContentType || "Noticia Tecnológica");
  const [showFormat, setShowFormat] = useState<"Debate" | "Análisis" | "Opinión">(presetFormat || "Análisis");
  const [durationMinutes, setDurationMinutes] = useState(3);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Batch Processing Queue state
  const [batchTopics, setBatchTopics] = useState<string[]>([
    "Avances en Computación Cuántica",
    "Lanzamiento de Vehículos Autónomos 2026",
    "Economía Global y Criptoactivos"
  ]);
  const [newBatchTopic, setNewBatchTopic] = useState("");
  const [batchQueueStatus, setBatchQueueStatus] = useState<Record<string, "pending" | "processing" | "completed" | "error">>({});
  const [batchProcessing, setBatchProcessing] = useState(false);

  const handleAddBatchTopic = () => {
    if (!newBatchTopic.trim()) return;
    setBatchTopics([...batchTopics, newBatchTopic.trim()]);
    setNewBatchTopic("");
    addToast("Tema Añadido", "Tema agregado a la cola por lotes.", "info");
  };

  const handleRunBatchQueue = async () => {
    if (batchTopics.length === 0) {
      addToast("Cola Vacía", "Agrega al menos un tema a la cola.", "error");
      return;
    }
    setBatchProcessing(true);
    addToast("Cola Iniciada", `Procesando ${batchTopics.length} temas en segundo plano...`, "info");
    const statusMap: Record<string, "pending" | "processing" | "completed" | "error"> = {};
    batchTopics.forEach((t) => { statusMap[t] = "pending"; });
    setBatchQueueStatus(statusMap);

    for (const t of batchTopics) {
      setBatchQueueStatus((prev) => ({ ...prev, [t]: "processing" }));
      try {
        const res = await fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: t,
            contentType,
            showFormat,
            durationMinutes,
          }),
        });
        if (!res.ok) throw new Error("Error");
        setBatchQueueStatus((prev) => ({ ...prev, [t]: "completed" }));
      } catch (err) {
        setBatchQueueStatus((prev) => ({ ...prev, [t]: "error" }));
      }
    }
    setBatchProcessing(false);
    addToast("Cola de Lotes Finalizada", "Todos los temas de la cola han sido generados en segundo plano.", "success");
  };

  const isApproved = isAdmin || profile?.status === "approved";
  const authMessage = !user 
    ? "Inicia sesión para generar podcasts." 
    : profile?.status === "pending" 
      ? "Tu solicitud está pendiente de aprobación." 
      : profile?.status === "rejected"
        ? "Tu acceso ha sido denegado."
        : null;

  const handleScrollToOrchestrator = () => {
    orchestratorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunPipeline = async () => {
    if (!isApproved) {
      addToast("Acceso Denegado", authMessage || "No tienes permisos.", "error");
      return;
    }

    if (!topic.trim()) {
      addToast("Error de Validación", "Por favor ingresa un tema válido para investigar.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(1);
    addToast("Iniciando Pipeline", `Iniciando investigación sobre "${topic}"...`, "info");

    try {
      // Step 1: Trigger pipeline orchestrator API
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          contentType,
          showFormat,
          durationMinutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "El pipeline falló en la ejecución.");
      }

      setCurrentStep(3);
      const data = await res.json();

      setResult(data);
      setCurrentStep(4);

      if (onUpdatePipelineData) {
        onUpdatePipelineData({
          reportText: data.intelligenceReport,
          rawScript: data.scriptText,
          scriptLines: data.scriptLines,
          storyboardData: data.storyboard,
        });
      }

      addToast("Pipeline Completado", `Episodio generado con ${data.scriptLines?.length || 0} intervenciones y Storyboard de Video.`, "success");

      if (onSaveToHistory) {
        onSaveToHistory({
          id: Math.random().toString(36).substring(2, 9),
          topic,
          contentType,
          format: showFormat,
          date: new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          scriptLinesCount: data.scriptLines?.length || 0,
          reportSnippet: data.reportText?.substring(0, 120) + "...",
        });
      }
    } catch (err: any) {
      const msg = err.message || "Ocurrió un error en la orquestación.";
      setError(msg);
      setCurrentStep(0);
      addToast("Error en Pipeline", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* High-Converting Landing Hero highlighting user pain points & solution */}
      <LandingHero onStartNow={handleScrollToOrchestrator} />

      {/* Pipeline Config Banner */}
      <div ref={orchestratorRef} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Layers className="w-5 h-5 text-slate-900 dark:text-slate-100" />
              Orquestador de Podcast Automatizado
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ejecuta el pipeline completo v2.0: Búsqueda → Calificación de Fuentes → Guionista → Doblaje Audio Studio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Pipeline Status: Listo
            </span>
          </div>
        </div>

        {/* Setup Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Tema Principal del Podcast
              </label>
              <button
                type="button"
                onClick={() => setTopic("TENDENCIAS")}
                className="text-[10px] text-amber-600 font-bold hover:underline flex items-center gap-1"
                title="Carga automáticamente temas trending analizados por IA"
              >
                🔥 Cargar &quot;TENDENCIAS&quot; (Signal Analyst)
              </button>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: TENDENCIAS o NVIDIA RTX 5090 Blackwell..."
              title="Tema sobre el cual la IA investigará fuentes verificadas y redactará el episodio"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Estrategia de Búsqueda
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              title="Selecciona la categoría de búsqueda web para filtrar y calificar fuentes de alta reputación"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Noticia Tecnológica">Noticia Tecnológica</option>
              <option value="Espectáculos">Espectáculos</option>
              <option value="Análisis de Producto">Análisis de Producto</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Formato de Show
            </label>
            <select
              value={showFormat}
              onChange={(e) => setShowFormat(e.target.value as any)}
              title="Define el tono editorial y la interacción entre locutores (Debate, Análisis o Opinión)"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Debate">Debate (Conflicto)</option>
              <option value="Análisis">Análisis (Mesa Redonda)</option>
              <option value="Opinión">Opinión (Entrevista)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        {!isApproved && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{authMessage} Abre tu perfil para más detalles.</span>
          </div>
        )}
        <button
          onClick={handleRunPipeline}
          disabled={loading || !topic.trim() || !isApproved}
          className={`w-full py-3 px-6 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all ${
            loading || !isApproved ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Ejecutando Pipeline Paso {currentStep}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generar Episodio de Podcast Completo
            </>
          )}
        </button>

        {/* Real-time Pipeline Step Progress Tracker */}
        {loading && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800">Progreso de Orquestación en Vivo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
              <div
                className={`p-2 rounded border ${
                  currentStep >= 1 ? "bg-slate-900 text-white font-bold border-slate-900" : "bg-white text-slate-400"
                }`}
              >
                1. SourceFinder
              </div>
              <div
                className={`p-2 rounded border ${
                  currentStep >= 2 ? "bg-slate-900 text-white font-bold border-slate-900" : "bg-white text-slate-400"
                }`}
              >
                2. Filtro Reputación
              </div>
              <div
                className={`p-2 rounded border ${
                  currentStep >= 3 ? "bg-slate-900 text-white font-bold border-slate-900" : "bg-white text-slate-400"
                }`}
              >
                3. Guionista v2.0
              </div>
              <div
                className={`p-2 rounded border ${
                  currentStep >= 4 ? "bg-slate-900 text-white font-bold border-slate-900" : "bg-white text-slate-400"
                }`}
              >
                4. Audio Studio Deck
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BATCH PROCESSING QUEUE SECTION */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Cola de Procesamiento por Lotes (Batch Queue)
            </h3>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
              {batchTopics.length} temas en cola
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Añade múltiples temas de investigación para generar borradores de guion en segundo plano de forma automatizada.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newBatchTopic}
              onChange={(e) => setNewBatchTopic(e.target.value)}
              placeholder="Añadir nuevo tema a la cola..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
              onKeyDown={(e) => { if (e.key === "Enter") handleAddBatchTopic(); }}
            />
            <button
              onClick={handleAddBatchTopic}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg text-xs transition-colors shrink-0"
            >
              Añadir a Cola
            </button>
            <button
              onClick={handleRunBatchQueue}
              disabled={batchProcessing || batchTopics.length === 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              {batchProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Procesar Cola
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {batchTopics.map((t, idx) => {
              const status = batchQueueStatus[t] || "pending";
              return (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "pending" && <span className="text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">Pendiente</span>}
                    {status === "processing" && <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded animate-pulse">Procesando...</span>}
                    {status === "completed" && <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Completado ✓</span>}
                    {status === "error" && <span className="text-[10px] font-mono text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">Error ✕</span>}

                    <button
                      onClick={() => setBatchTopics(batchTopics.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 text-xs font-mono ml-2"
                      title="Eliminar de cola"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline Output / Results */}
      {loading && !result && (
        <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">⏳</div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ¡Episodio de Podcast Creado Exitosamente por el Orquestador!
            </span>
            <span className="text-[11px] text-emerald-700 font-mono">
              Fuentes Verificadas: {result.qualifiedSources?.length || 0} | Palabras: {result.wordCount || 0}
            </span>
          </div>

          {/* Render Full Audio Studio Deck with generated script */}
          <PodcastStudioView
            scriptLines={result.scriptLines || []}
            rawScript={result.scriptText}
            topic={`Podcast: ${result.topic}`}
          />
        </div>
      )}
    </div>
  );
}
