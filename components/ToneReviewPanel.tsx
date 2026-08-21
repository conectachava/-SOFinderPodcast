"use client";

import React, { useState } from "react";
import { Search, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Zap, Shield, HelpCircle } from "lucide-react";
import { safeFetchJson } from "@/lib/utils";
import { useToast } from "./Toast";

export interface ToneHighlight {
  text: string;
  reason: string;
  suggestion: string;
  type: "informal" | "complex" | "awkward";
}

interface ToneReviewPanelProps {
  scriptText: string;
  format: string;
  onApplySuggestion: (originalText: string, suggestedText: string) => void;
}

export function ToneReviewPanel({ scriptText, format, onApplySuggestion }: ToneReviewPanelProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<ToneHighlight[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleReviewTone = async () => {
    if (!scriptText.trim()) {
      addToast("Guion vacío", "No hay texto para revisar.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetchJson("/api/tone-reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptText, format }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Falló la revisión de tono.");
      }

      setHighlights(response.data?.highlights || []);
      setHasRun(true);
      addToast("Revisión Completada", `Se encontraron ${response.data?.highlights?.length || 0} sugerencias de tono.`, "success");
    } catch (error: any) {
      addToast("Error", error.message || "Error al revisar el tono.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "informal": return <Zap className="w-3 h-3 text-amber-500" />;
      case "complex": return <Shield className="w-3 h-3 text-indigo-500" />;
      case "awkward": return <AlertCircle className="w-3 h-3 text-rose-500" />;
      default: return <HelpCircle className="w-3 h-3 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "informal": return "Informal";
      case "complex": return "Complejo";
      case "awkward": return "Ruptura de Fluidez";
      default: return "Otro";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              Revisión de Tono
            </h4>
            <p className="text-[10px] text-slate-500">Detecta jerga compleja o informalidad extrema.</p>
          </div>
        </div>
        <button
          onClick={handleReviewTone}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Analizando..." : "Escanear Guion"}
        </button>
      </div>

      {hasRun && highlights.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
          <p className="text-xs font-medium">¡El guion tiene un tono excelente!</p>
          <p className="text-[10px]">No se encontraron problemas de informalidad o complejidad excesiva.</p>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {highlights.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getTypeIcon(item.type)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
                    <span className="line-through opacity-70 text-rose-500 mr-1">&quot;{item.text}&quot;</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mb-2 italic">
                    {item.reason}
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    Sugerencia: &quot;{item.suggestion}&quot;
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onApplySuggestion(item.text, item.suggestion)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-2.5 py-1.5 rounded transition-colors"
                >
                  Aplicar Sugerencia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
