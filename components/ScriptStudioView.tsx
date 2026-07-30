"use client";

import React, { useState } from "react";
import { FileText, Radio, Sliders, RefreshCw, Copy, Check, Play, Mic, User } from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { useToast } from "./Toast";
import { SentimentBadge } from "./SentimentBadge";

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
            <label className="block font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
              Informe de Inteligencia (Markdown Input)
            </label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:outline-none font-mono text-[11px] text-slate-800 dark:text-slate-100"
            />
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

      {/* Script Output Card - Clean Minimalism Dark Slate Card matching Design HTML */}
      <div className="lg:col-span-7 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {rawScript ? (
          <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
            {/* Dark Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Podcast Script <span className="text-slate-500 font-normal">(Draft v2)</span>
              </h3>

              <div className="flex items-center gap-2">
                {stats && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {stats.wordCount} palabras | {stats.estimatedDuration}
                  </span>
                )}

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
              {parsedLines.map((line) => (
                <div key={line.id} className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
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
      </div>
    </div>
  );
}
