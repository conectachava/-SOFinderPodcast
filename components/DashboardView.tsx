"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Headphones,
  ArrowUpRight,
  Sliders,
  Radio,
  Filter,
  Calendar,
} from "lucide-react";
import type { PodcastHistoryItem } from "./RecentDrawer";
import { RetentionDashboardView } from "./RetentionDashboardView";

export interface DashboardViewProps {
  history?: PodcastHistoryItem[];
  currentScriptLength?: number;
  currentFormat?: "Debate" | "Análisis" | "Opinión";
  onApplyLengthRecommendation?: (recommendedLength: number) => void;
}

type TimeRange = "7d" | "30d" | "90d";
type FormatFilter = "Todos" | "Debate" | "Análisis" | "Opinión";

interface EpisodeMetricPoint {
  id: string;
  episode: string;
  title: string;
  date: string;
  format: "Debate" | "Análisis" | "Opinión";
  estimatedRetentionRate: number; // % Tasa de retención estimada
  avgListeningTimeMin: number; // Minutos de tiempo promedio de escucha
  episodeDurationMin: number; // Duración total en minutos
  audienceGrowth: number; // % Crecimiento por audiencia
  uniqueListeners: number;
  returningListeners: number;
  newListeners: number;
}

const BASE_EPISODE_METRICS: EpisodeMetricPoint[] = [
  {
    id: "ep-1",
    episode: "Ep. 01",
    title: "Geopolítica de Semiconductores & IA Soberana",
    date: "05 Sep",
    format: "Análisis",
    estimatedRetentionRate: 84.2,
    avgListeningTimeMin: 9.8,
    episodeDurationMin: 11.5,
    audienceGrowth: 14.5,
    uniqueListeners: 1840,
    returningListeners: 1120,
    newListeners: 720,
  },
  {
    id: "ep-2",
    episode: "Ep. 02",
    title: "Agentes Autónomos vs. Ingeniería Tradicional",
    date: "10 Sep",
    format: "Debate",
    estimatedRetentionRate: 89.6,
    avgListeningTimeMin: 11.4,
    episodeDurationMin: 12.6,
    audienceGrowth: 21.8,
    uniqueListeners: 2240,
    returningListeners: 1410,
    newListeners: 830,
  },
  {
    id: "ep-3",
    episode: "Ep. 03",
    title: "Regulación Europea de Modelos Fundacionales",
    date: "15 Sep",
    format: "Opinión",
    estimatedRetentionRate: 81.5,
    avgListeningTimeMin: 8.9,
    episodeDurationMin: 10.8,
    audienceGrowth: 18.2,
    uniqueListeners: 2650,
    returningListeners: 1760,
    newListeners: 890,
  },
  {
    id: "ep-4",
    episode: "Ep. 04",
    title: "Computación Cuántica y Criptografía Post-RSA",
    date: "20 Sep",
    format: "Análisis",
    estimatedRetentionRate: 87.9,
    avgListeningTimeMin: 11.9,
    episodeDurationMin: 13.4,
    audienceGrowth: 26.4,
    uniqueListeners: 3350,
    returningListeners: 2190,
    newListeners: 1160,
  },
  {
    id: "ep-5",
    episode: "Ep. 05",
    title: "Arquitectura Blackwell y Centros de Datos de 1GW",
    date: "25 Sep",
    format: "Debate",
    estimatedRetentionRate: 92.4,
    avgListeningTimeMin: 12.8,
    episodeDurationMin: 13.8,
    audienceGrowth: 33.1,
    uniqueListeners: 4460,
    returningListeners: 2940,
    newListeners: 1520,
  },
  {
    id: "ep-6",
    episode: "Ep. 06",
    title: "Verificación Periodística con Search Grounding",
    date: "01 Oct",
    format: "Análisis",
    estimatedRetentionRate: 90.8,
    avgListeningTimeMin: 12.1,
    episodeDurationMin: 13.2,
    audienceGrowth: 36.7,
    uniqueListeners: 5290,
    returningListeners: 3580,
    newListeners: 1710,
  },
  {
    id: "ep-7",
    episode: "Ep. 07",
    title: "Síntesis Multivoz y Narrativa Sonora en Tiempo Real",
    date: "06 Oct",
    format: "Debate",
    estimatedRetentionRate: 94.1,
    avgListeningTimeMin: 13.5,
    episodeDurationMin: 14.2,
    audienceGrowth: 41.2,
    uniqueListeners: 6480,
    returningListeners: 4390,
    newListeners: 2090,
  },
];

export function DashboardView({
  history = [],
  currentScriptLength = 850,
  currentFormat = "Análisis",
  onApplyLengthRecommendation,
}: DashboardViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("Todos");
  const [activeSubView, setActiveSubView] = useState<"performance" | "simulator">("performance");

  // Merge user-generated podcast history items into the performance dataset
  const combinedDataset = useMemo<EpisodeMetricPoint[]>(() => {
    const customEpisodes: EpisodeMetricPoint[] = history.slice(0, 5).map((item, idx) => {
      const fmt: "Debate" | "Análisis" | "Opinión" =
        item.format === "Debate" || item.format === "Análisis" || item.format === "Opinión"
          ? item.format
          : "Análisis";
      const wordCount = (item.rawScript || item.reportText || "").split(/\s+/).filter(Boolean).length || 850;
      const durationMin = Number(Math.max(4.5, Math.min(18, wordCount / 145)).toFixed(1));
      const baseRetention = fmt === "Debate" ? 91.5 : fmt === "Análisis" ? 88.8 : 85.4;
      const avgListen = Number((durationMin * (baseRetention / 100)).toFixed(1));

      return {
        id: item.id || `custom-${idx}`,
        episode: `Gen. #${history.length - idx}`,
        title: item.topic || "Episodio Generado con IA",
        date: item.date || "Hoy",
        format: fmt,
        estimatedRetentionRate: baseRetention,
        avgListeningTimeMin: avgListen,
        episodeDurationMin: durationMin,
        audienceGrowth: Number((28.5 + idx * 4.2).toFixed(1)),
        uniqueListeners: 4800 + idx * 620,
        returningListeners: 3200 + idx * 410,
        newListeners: 1600 + idx * 210,
      };
    });

    const all = [...BASE_EPISODE_METRICS, ...customEpisodes];
    const filteredByFormat =
      formatFilter === "Todos" ? all : all.filter((ep) => ep.format === formatFilter);

    if (timeRange === "7d") {
      return filteredByFormat.slice(-4);
    }
    if (timeRange === "30d") {
      return filteredByFormat.slice(-7);
    }
    return filteredByFormat;
  }, [history, formatFilter, timeRange]);

  // Aggregate KPI calculations
  const summaryMetrics = useMemo(() => {
    if (combinedDataset.length === 0) {
      return {
        avgRetention: 88.5,
        avgListenMin: 11.4,
        avgDurationMin: 12.8,
        completionRatio: 89.1,
        avgGrowth: 27.4,
        totalAudience: 26310,
      };
    }

    const count = combinedDataset.length;
    const sumRetention = combinedDataset.reduce((acc, item) => acc + item.estimatedRetentionRate, 0);
    const sumListen = combinedDataset.reduce((acc, item) => acc + item.avgListeningTimeMin, 0);
    const sumDuration = combinedDataset.reduce((acc, item) => acc + item.episodeDurationMin, 0);
    const sumGrowth = combinedDataset.reduce((acc, item) => acc + item.audienceGrowth, 0);
    const totalAudience = combinedDataset.reduce((acc, item) => acc + item.uniqueListeners, 0);

    const avgRetention = Number((sumRetention / count).toFixed(1));
    const avgListenMin = Number((sumListen / count).toFixed(1));
    const avgDurationMin = Number((sumDuration / count).toFixed(1));
    const completionRatio = Number(((avgListenMin / (avgDurationMin || 1)) * 100).toFixed(1));
    const avgGrowth = Number((sumGrowth / count).toFixed(1));

    return {
      avgRetention,
      avgListenMin,
      avgDurationMin,
      completionRatio,
      avgGrowth,
      totalAudience,
    };
  }, [combinedDataset]);

  // Format breakdown comparison data
  const formatComparisonData = useMemo(() => {
    const formats: Array<"Debate" | "Análisis" | "Opinión"> = ["Debate", "Análisis", "Opinión"];
    return formats.map((fmt) => {
      const matching = BASE_EPISODE_METRICS.filter((e) => e.format === fmt);
      const count = matching.length || 1;
      const retention = Number(
        (matching.reduce((a, b) => a + b.estimatedRetentionRate, 0) / count).toFixed(1)
      );
      const listenTime = Number(
        (matching.reduce((a, b) => a + b.avgListeningTimeMin, 0) / count).toFixed(1)
      );
      const growth = Number(
        (matching.reduce((a, b) => a + b.audienceGrowth, 0) / count).toFixed(1)
      );
      return {
        format: fmt,
        estimatedRetentionRate: retention,
        avgListeningTimeMin: listenTime,
        audienceGrowth: growth,
      };
    });
  }, []);

  const formatMinutesLabel = (mins: number) => {
    const whole = Math.floor(mins);
    const secs = Math.round((mins - whole) * 60);
    return `${whole}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="p-6 space-y-6 transition-colors">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Dashboard de Rendimiento de Podcasts
                </h2>
                <span className="gcp-badge-blue font-mono uppercase">Recharts Engine</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoreo en tiempo real de tasa de retención estimada, tiempo promedio de escucha y crecimiento por audiencia.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: View Switcher, Format Filter & Time Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-view switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveSubView("performance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubView === "performance"
                  ? "bg-white dark:bg-slate-900 text-[#1a73e8] dark:text-[#8ab4f8] shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Métricas de Audiencia
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView("simulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubView === "simulator"
                  ? "bg-white dark:bg-slate-900 text-[#1a73e8] dark:text-[#8ab4f8] shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Simulador de Guion
            </button>
          </div>

          {activeSubView === "performance" && (
            <>
              {/* Format Filter */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label="Filtrar por formato"
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as FormatFilter)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer text-xs"
                >
                  <option value="Todos">Todos los formatos</option>
                  <option value="Debate">Formato: Debate</option>
                  <option value="Análisis">Formato: Análisis</option>
                  <option value="Opinión">Formato: Opinión</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: "7d", label: "7D" },
                    { id: "30d", label: "30D" },
                    { id: "90d", label: "90D" },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTimeRange(range.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      timeRange === range.id
                        ? "bg-[#1a73e8] text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {activeSubView === "simulator" ? (
        <RetentionDashboardView
          currentScriptLength={currentScriptLength}
          currentFormat={currentFormat}
          onApplyLengthRecommendation={onApplyLengthRecommendation}
        />
      ) : (
        <>
          {/* Core KPI Cards: Tasa de Retención Estimada, Tiempo Promedio de Escucha, Crecimiento por Audiencia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Tasa de Retención Estimada */}
            <div className="p-5 rounded-2xl border theme-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tasa de Retención Estimada
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {summaryMetrics.avgRetention}%
                </div>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 text-xs font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +6.4% vs benchmark
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summaryMetrics.avgRetention)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Umbral óptimo de estudio: 80%</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                   Nivel Superior
                </span>
              </p>
            </div>

            {/* KPI 2: Tiempo Promedio de Escucha */}
            <div className="p-5 rounded-2xl border theme-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tiempo Promedio de Escucha
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                  <Headphones className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatMinutesLabel(summaryMetrics.avgListenMin)}
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 text-xs font-bold">
                  <Clock className="w-3 h-3" />
                  {summaryMetrics.completionRatio}% completado
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summaryMetrics.completionRatio)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Duración media: {formatMinutesLabel(summaryMetrics.avgDurationMin)}</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  Sintetizador Multi-Voz HD
                </span>
              </p>
            </div>

            {/* KPI 3: Crecimiento por Audiencia */}
            <div className="p-5 rounded-2xl border theme-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Crecimiento por Audiencia
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  +{summaryMetrics.avgGrowth}%
                </div>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 text-xs font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {summaryMetrics.totalAudience.toLocaleString()} oyentes
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summaryMetrics.avgGrowth * 2)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Retención de suscriptores: 68.4%</span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  Expansión Orgánica
                </span>
              </p>
            </div>
          </div>

          {/* Primary Chart: Tasa de Retención Estimada & Tiempo Promedio de Escucha por Episodio */}
          <div className="p-5 rounded-2xl border theme-surface-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Evolución de Tasa de Retención Estimada y Tiempo Promedio de Escucha
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Correlación entre la retención de audiencia (%) y los minutos efectivos de escucha por episodio generado.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  Retención (%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Escucha Promedio (min)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={combinedDataset}
                  margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="dashRetentionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.16} />
                  <XAxis
                    dataKey="episode"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="retention"
                    stroke="#6366f1"
                    fontSize={11}
                    domain={[50, 100]}
                    unit="%"
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="time"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={11}
                    domain={[0, 18]}
                    unit="m"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === "Tasa de Retención Estimada") return [`${val}%`, name];
                      if (name === "Tiempo Promedio de Escucha") return [`${val} min`, name];
                      if (name === "Duración del Episodio") return [`${val} min`, name];
                      return [val, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload as EpisodeMetricPoint | undefined;
                      return item ? `${label}: ${item.title} (${item.format})` : String(label);
                    }}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <ReferenceLine
                    yAxisId="retention"
                    y={85}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: "Meta 85%",
                      fill: "#10b981",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <Area
                    yAxisId="retention"
                    type="monotone"
                    dataKey="estimatedRetentionRate"
                    name="Tasa de Retención Estimada"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#dashRetentionFill)"
                  />
                  <Bar
                    yAxisId="time"
                    dataKey="avgListeningTimeMin"
                    name="Tiempo Promedio de Escucha"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                  <Line
                    yAxisId="time"
                    type="monotone"
                    dataKey="episodeDurationMin"
                    name="Duración del Episodio"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Charts Grid: Crecimiento por Audiencia & Comparativa por Formato */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Crecimiento por Audiencia */}
            <div className="p-5 rounded-2xl border theme-surface-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    Crecimiento por Audiencia (Nuevos vs. Recurrentes)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expansión de oyentes únicos y fidelización acumulada por lanzamiento.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-bold">
                  +{summaryMetrics.avgGrowth}% Crecimiento
                </span>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={combinedDataset}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="returningGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="newListenersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} oyentes`,
                        name,
                      ]}
                    />
                    <Legend verticalAlign="top" height={30} />
                    <Area
                      type="monotone"
                      dataKey="returningListeners"
                      stackId="1"
                      name="Audiencia Recurrente"
                      stroke="#1a73e8"
                      strokeWidth={2.5}
                      fill="url(#returningGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="newListeners"
                      stackId="1"
                      name="Nuevos Oyentes"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#newListenersGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Rendimiento Comparativo por Formato */}
            <div className="p-5 rounded-2xl border theme-surface-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    Rendimiento por Formato Editorial
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparativa de retención estimada (%) y crecimiento (%) según dinámica multivoz.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Debate · Análisis · Opinión</span>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatComparisonData}
                    margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="format" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "10px",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    <Legend verticalAlign="top" height={30} />
                    <Bar
                      dataKey="estimatedRetentionRate"
                      name="Tasa de Retención Estimada (%)"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                    <Bar
                      dataKey="audienceGrowth"
                      name="Crecimiento por Audiencia (%)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Episode Performance Table */}
          <div className="rounded-2xl border theme-surface-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Desglose de Episodios Generados ({combinedDataset.length})
                </h3>
              </div>
              {onApplyLengthRecommendation && (
                <button
                  type="button"
                  onClick={() => onApplyLengthRecommendation(850)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Optimizar Próximo Guion (850 pal.)
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Episodio / Tema</th>
                    <th className="py-3 px-3">Formato</th>
                    <th className="py-3 px-3">Tasa de Retención Estimada</th>
                    <th className="py-3 px-3">Tiempo Promedio de Escucha</th>
                    <th className="py-3 px-4 text-right">Crecimiento por Audiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {combinedDataset.map((ep) => (
                    <tr
                      key={ep.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {ep.episode}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {ep.title}
                            </div>
                            <div className="text-[10px] text-slate-400">{ep.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                          {ep.format}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {ep.estimatedRetentionRate}%
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatMinutesLabel(ep.avgListeningTimeMin)}{" "}
                        <span className="text-[10px] text-slate-400">
                          / {formatMinutesLabel(ep.episodeDurationMin)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{ep.audienceGrowth}% ({ep.uniqueListeners.toLocaleString()})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardView;
