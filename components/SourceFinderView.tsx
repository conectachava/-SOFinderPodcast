"use client";

import React, { useState } from "react";
import { Search, Shield, Filter, RefreshCw, Copy, Check, ExternalLink, AlertTriangle, FileText, Sparkles, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceBadge } from "./SourceBadge";
import { useToast } from "./Toast";
import { SignalAnalysisResult } from "@/app/api/source-finder/route";

export function SourceFinderView({ onUseReportForScript }: { onUseReportForScript?: (report: string) => void }) {
  const { addToast } = useToast();

  const [topic, setTopic] = useState("Lanzamiento de iPhone 15 Pro y Reporte de Ganancias Apple");
  const [contentType, setContentType] = useState("Noticia Tecnológica");
  const [minReputation, setMinReputation] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [qualifiedSources, setQualifiedSources] = useState<any[]>([]);
  const [rawSources, setRawSources] = useState<any[]>([]);
  const [signalAnalysis, setSignalAnalysis] = useState<SignalAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async (forcedTopic?: string) => {
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
      const res = await fetch("/api/source-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          contentType,
          customMinReputation: minReputation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al investigar el tema");
      }

      const data = await res.json();
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
      const msg = err.message || "Ocurrió un error inesperado en la investigación.";
      setError(msg);
      addToast("Error en Búsqueda", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    addToast("Copiado", "Informe copiado al portapapeles.", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search Input Panel */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Search className="w-4 h-4 text-slate-900" />
            Investigación SourceFinder
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Módulo de inteligencia y filtro de reputación en tiempo real.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-500 uppercase text-[10px] tracking-wider mb-1.5">
              Tema a Investigar
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="Ej: Nuevo chip M4 Pro de Apple o avances en IA..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 uppercase text-[10px] tracking-wider mb-1.5">
              Estrategia / Tipo de Contenido
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Noticia Tecnológica">Noticia Tecnológica (70% News / 30% Web Reputada)</option>
              <option value="Espectáculos">Espectáculos / Entretenimiento (60% Web / 30% News / 10% YT)</option>
              <option value="Análisis de Producto">Análisis de Producto (Reviews / Reddit / YT)</option>
              <option value="General">General / Explicativo (Wikipedia / Ensayos / Scholar)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Umbral Mínimo
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
              Fuentes con puntaje menor serán automáticamente descartadas del informe.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleResearch()}
              disabled={loading || !topic.trim()}
              className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs uppercase tracking-wider"
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
              className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              title="Escanea tendencias con Analista de Señales v2.0"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Tendencias
            </button>
          </div>
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

      {/* Report & Source Audit Output */}
      <div className="lg:col-span-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {report ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
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
              <h3 className="text-sm font-bold text-slate-800">Intelligence Report</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
                  Verified
                </span>

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

            {/* Markdown Body */}
            <div className="p-6 prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
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
                      {rawSources.map((s, idx) => (
                        <tr key={idx} className={s.qualified ? "bg-emerald-50/30" : "bg-rose-50/30 opacity-75"}>
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
                          <td className="py-2 px-2 text-[11px]">
                            {s.qualified ? (
                              <span className="text-emerald-700 font-medium">✓ Calificada</span>
                            ) : (
                              <span className="text-rose-600 font-medium">{s.rejection_reason || "Rechazada"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 text-sm">Esperando Investigación</h3>
            <p className="text-xs max-w-md mx-auto text-slate-500">
              Ingresa un tema arriba y haz clic en &quot;Generar Informe de Inteligencia&quot; para ejecutar la búsqueda verificada y calificación de fuentes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
