"use client";

import React, { useState } from "react";
import { Layers, Play, CheckCircle2, Clock, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { ScriptLine } from "@/app/api/script-writer/route";
import { PodcastStudioView } from "./PodcastStudioView";
import { useToast } from "./Toast";
import { PodcastHistoryItem } from "./RecentDrawer";

interface OrchestratorViewProps {
  onSaveToHistory?: (item: PodcastHistoryItem) => void;
  presetTopic?: string;
  presetContentType?: string;
  presetFormat?: "Debate" | "Análisis" | "Opinión";
}

export function OrchestratorView({
  onSaveToHistory,
  presetTopic,
  presetContentType,
  presetFormat,
}: OrchestratorViewProps) {
  const { addToast } = useToast();

  const [topic, setTopic] = useState(presetTopic || "Procesador Quantum Gemini y Computación Cuántica 2026");
  const [contentType, setContentType] = useState(presetContentType || "Noticia Tecnológica");
  const [showFormat, setShowFormat] = useState<"Debate" | "Análisis" | "Opinión">(presetFormat || "Análisis");
  const [durationMinutes, setDurationMinutes] = useState(3);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Idle, 1: SourceFinder, 2: ScriptWriter, 3: Audio Synthesis, 4: Complete
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunPipeline = async () => {
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

      addToast("Pipeline Completado", `Episodio generado con ${data.scriptLines?.length || 0} intervenciones.`, "success");

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
    <div className="space-y-6">
      {/* Pipeline Config Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Layers className="w-5 h-5 text-slate-900" />
              Orquestador de Podcast Automatizado
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
              >
                🔥 Cargar &quot;TENDENCIAS&quot; (Signal Analyst)
              </button>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: TENDENCIAS o NVIDIA RTX 5090 Blackwell..."
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
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Debate">Debate (Conflicto)</option>
              <option value="Análisis">Análisis (Mesa Redonda)</option>
              <option value="Opinión">Opinión (Entrevista)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunPipeline}
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all"
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
      </div>

      {/* Pipeline Output / Results */}
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
