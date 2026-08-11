"use client";

import React, { useMemo } from "react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { Sparkles, AlertCircle, MessageSquare, TrendingUp, ShieldCheck, Heart, Zap, Award, Info, BarChart2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export interface ScriptSentimentPanelProps {
  scriptLines: ScriptLine[];
  rawScript?: string | null;
  onAdjustToneRequest?: (targetTone: string) => void;
}

export function ScriptSentimentPanel({
  scriptLines,
  rawScript = "",
  onAdjustToneRequest,
}: ScriptSentimentPanelProps) {
  // Analyze lines or rawScript to compute sentiment percentages and tone breakdown
  const sentimentStats = useMemo(() => {
    let optimisticCount = 0;
    let criticalCount = 0;
    let neutralCount = 0;
    let persuasiveCount = 0;

    const keywordsFound = {
      optimistic: new Set<string>(),
      critical: new Set<string>(),
      informative: new Set<string>(),
      persuasive: new Set<string>(),
    };

    const linesToAnalyze =
      scriptLines && scriptLines.length > 0
        ? scriptLines
        : (rawScript || "")
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((t) => ({ text: t, emotion: "neutral" }));

    linesToAnalyze.forEach((line) => {
      const text = (line.text || "").toLowerCase();
      const emotion = (line.emotion || "").toLowerCase();

      // Keyword scanning
      const optMatch = text.match(/excelente|increíble|fascinante|éxito|entusiasta|emocionante|fantástico|revolucionario|oportunidad|positivo|genial|maravilla|prometedor|solución|avance|futuro/g);
      if (optMatch) optMatch.forEach((w) => keywordsFound.optimistic.add(w));

      const critMatch = text.match(/preocupaci|riesgo|alerta|duda|problema|cuestionamiento|amenaza|caída|pérdida|crític|error|falla|grave|difícil|desafío|obstáculo|vulnerabilidad/g);
      if (critMatch) critMatch.forEach((w) => keywordsFound.critical.add(w));

      const infoMatch = text.match(/datos|estudio|reporte|análisis|según|porcentaje|métricas|evidencia|investigación|oficial|sistema|estándar|modelo|cifra/g);
      if (infoMatch) infoMatch.forEach((w) => keywordsFound.informative.add(w));

      const persMatch = text.match(/recomiend|clave|estrategia|transformar|importante|debes|crucial|imprescindible|acción|impacto|líder|futuro/g);
      if (persMatch) persMatch.forEach((w) => keywordsFound.persuasive.add(w));

      // Scoring line tone
      if (
        emotion.includes("enthusiast") ||
        emotion.includes("entusiasta") ||
        emotion.includes("happy") ||
        (optMatch && optMatch.length > 0)
      ) {
        optimisticCount++;
      } else if (
        emotion.includes("concern") ||
        emotion.includes("preocupad") ||
        emotion.includes("serious") ||
        (critMatch && critMatch.length > 0)
      ) {
        criticalCount++;
      } else if (persMatch && persMatch.length > 0) {
        persuasiveCount++;
      } else {
        neutralCount++;
      }
    });

    const total = Math.max(1, optimisticCount + criticalCount + neutralCount + persuasiveCount);
    const optPct = Math.round((optimisticCount / total) * 100);
    const critPct = Math.round((criticalCount / total) * 100);
    const infoPct = Math.round((neutralCount / total) * 100);
    const persPct = Math.round((persuasiveCount / total) * 100);

    // Dominant tone identification
    let dominantTone = "Informativo / Equilibrado";
    let dominantDesc = "Mantiene un tono profesional neutro orientado a la divulgación clara de datos.";
    let badgeColor = "bg-sky-500 text-white";

    if (optPct >= 40 && optPct >= critPct) {
      dominantTone = "Optimista & Entusiasta";
      dominantDesc = "Proyecta energía positiva, inspiración y visión de futuro de alto impacto.";
      badgeColor = "bg-emerald-600 text-white";
    } else if (critPct >= 35) {
      dominantTone = "Crítico & Reflexivo";
      dominantDesc = "Enfatiza advertencias, riesgos y análisis riguroso para generar debate profundo.";
      badgeColor = "bg-rose-600 text-white";
    } else if (persPct >= 30) {
      dominantTone = "Persuasivo & Orientado a Acción";
      dominantDesc = "Transmite llamados a la acción claros y conclusiones estratégicas.";
      badgeColor = "bg-indigo-600 text-white";
    }

    const chartData = [
      { name: "Optimista", value: optPct, color: "#10b981" },
      { name: "Informativo", value: infoPct, color: "#0284c7" },
      { name: "Crítico", value: critPct, color: "#f43f5e" },
      { name: "Persuasivo", value: persPct, color: "#8b5cf6" },
    ].filter((d) => d.value > 0);

    return {
      totalLines: linesToAnalyze.length,
      optPct,
      critPct,
      infoPct,
      persPct,
      dominantTone,
      dominantDesc,
      badgeColor,
      chartData,
      keywordsFound: {
        optimistic: Array.from(keywordsFound.optimistic).slice(0, 5),
        critical: Array.from(keywordsFound.critical).slice(0, 5),
        informative: Array.from(keywordsFound.informative).slice(0, 5),
        persuasive: Array.from(keywordsFound.persuasive).slice(0, 5),
      },
    };
  }, [scriptLines, rawScript]);

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Análisis de Sentimiento &amp; Tono Emocional del Guion
            </h3>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-[10px] font-mono font-bold">
              AI Sentiment Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métrica del impacto psicológico y tono proyectado en los oyentes para ajustar la empatía del contenido.
          </p>
        </div>

        {/* Primary Dominant Badge */}
        <div className="shrink-0">
          <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs ${sentimentStats.badgeColor}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tono Principal: {sentimentStats.dominantTone}</span>
          </span>
        </div>
      </div>

      {/* Grid Content: Chart + Tone Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        {/* Sentiment Pie Chart */}
        <div className="h-44 w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentStats.chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {sentimentStats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                  fontSize: "11px",
                }}
                formatter={(value: any, name: any) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">{sentimentStats.totalLines}</span>
            <span className="text-[9px] font-mono text-slate-400">líneas</span>
          </div>
        </div>

        {/* Metric Progress Bars */}
        <div className="md:col-span-2 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Optimista / Entusiasta
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {sentimentStats.optPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${sentimentStats.optPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-sky-700 dark:text-sky-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> Informativo / Neutral
              </span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                {sentimentStats.infoPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${sentimentStats.infoPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Crítico / Analítico
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {sentimentStats.critPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${sentimentStats.critPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Persuasivo / Estratégico
              </span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {sentimentStats.persPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${sentimentStats.persPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keywords Cloud & Tone Description */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white font-bold">Diagnóstico de Tono: </strong>
            <span className="text-slate-600 dark:text-slate-300">{sentimentStats.dominantDesc}</span>
          </div>
        </div>

        {/* Trigger Keywords Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Palabras Clave Detectadas:</span>
          {sentimentStats.keywordsFound.optimistic.map((kw, i) => (
            <span key={`opt-${i}`} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded font-mono">
              #{kw}
            </span>
          ))}
          {sentimentStats.keywordsFound.critical.map((kw, i) => (
            <span key={`crit-${i}`} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded font-mono">
              #{kw}
            </span>
          ))}
          {sentimentStats.keywordsFound.informative.map((kw, i) => (
            <span key={`info-${i}`} className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded font-mono">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
