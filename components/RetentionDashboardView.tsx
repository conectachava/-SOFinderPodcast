"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ReferenceLine,
  BarChart,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  FileText,
  Users,
  Info,
} from "lucide-react";

export interface RetentionDashboardViewProps {
  currentScriptLength?: number;
  currentFormat?: "Debate" | "Análisis" | "Opinión";
  onApplyLengthRecommendation?: (recommendedLength: number) => void;
}

export function RetentionDashboardView({
  currentScriptLength = 850,
  currentFormat = "Análisis",
  onApplyLengthRecommendation,
}: RetentionDashboardViewProps) {
  const [simulatedLength, setSimulatedLength] = useState<number>(
    currentScriptLength > 0 ? currentScriptLength : 850
  );
  const [selectedFormat, setSelectedFormat] = useState<"Debate" | "Análisis" | "Opinión">(
    currentFormat
  );

  // Curve data comparing script length (words / duration) vs audience retention (%) vs AI generation time (seconds)
  const retentionCurveData = [
    { words: 300, duration: "2 min", retention: 96, genTime: 1.2, engagement: 98, dropout: 4 },
    { words: 600, duration: "4 min", retention: 93, genTime: 2.1, engagement: 94, dropout: 7 },
    { words: 900, duration: "6 min", retention: 89, genTime: 3.2, engagement: 88, dropout: 11 },
    { words: 1200, duration: "8 min", retention: 81, genTime: 4.8, engagement: 79, dropout: 19 },
    { words: 1600, duration: "11 min", retention: 72, genTime: 6.9, engagement: 68, dropout: 28 },
    { words: 2100, duration: "14 min", retention: 59, genTime: 9.8, engagement: 54, dropout: 41 },
    { words: 2800, duration: "19 min", retention: 44, genTime: 13.5, engagement: 38, dropout: 56 },
    { words: 3600, duration: "24 min", retention: 31, genTime: 18.2, engagement: 25, dropout: 69 },
  ];

  // Breakdown by section of a podcast
  const sectionRetentionData = [
    { section: "0-1 min (Gancho)", retention: 98, benchmark: 95, label: "Crucial" },
    { section: "1-3 min (Contexto)", retention: 92, benchmark: 88, label: "Estable" },
    { section: "3-6 min (Desarrollo)", retention: 87, benchmark: 82, label: "Óptimo" },
    { section: "6-9 min (Debate)", retention: 78, benchmark: 72, label: "Fricción" },
    { section: "9-12 min (Conclusión)", retention: 64, benchmark: 58, label: "Descenso" },
    { section: ">12 min (Cierre)", retention: 48, benchmark: 42, label: "Abandono" },
  ];

  // Format modifier math
  const formatMultiplier =
    selectedFormat === "Debate" ? 1.05 : selectedFormat === "Análisis" ? 1.0 : 0.95;

  // Calculated simulation metrics
  const estMinutes = (simulatedLength / 150).toFixed(1);
  const rawRetention = Math.max(
    25,
    Math.min(98, 98 - Math.pow(simulatedLength / 350, 1.35) * 1.8 * (2 - formatMultiplier))
  );
  const estRetention = Math.round(rawRetention);
  const estGenTime = (0.8 + (simulatedLength / 1000) * 2.8).toFixed(1);

  // Status indicator for simulated length
  const getEfficiencyStatus = (words: number) => {
    if (words >= 600 && words <= 1100) {
      return {
        label: "Zona Óptima de Retención (Sweet Spot)",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        badgeBg: "bg-emerald-600 text-white",
        icon: CheckCircle2,
      };
    }
    if (words < 600) {
      return {
        label: "Guion Muy Corto (Riesgo de falta de profundidad)",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
        badgeBg: "bg-amber-600 text-white",
        icon: Info,
      };
    }
    return {
      label: "Guion Extenso (Riesgo de abandono alto >12 min)",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
      badgeBg: "bg-rose-600 text-white",
      icon: AlertTriangle,
    };
  };

  const statusInfo = getEfficiencyStatus(simulatedLength);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6 bg-slate-50/60 dark:bg-slate-900/60 transition-colors">
      {/* Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard de Retención &amp; Eficiencia IA
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              Recharts Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simula la longitud óptima del guion versus el tiempo de generación estimado para maximizar la retención de audiencia.
          </p>
        </div>

        {/* Quick Actions / Recommendations */}
        {onApplyLengthRecommendation && (
          <button
            onClick={() => onApplyLengthRecommendation(850)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Aplicar Longitud Óptima (850 pal.)</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Longitud Óptima</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            750 – 950 <span className="text-xs font-semibold text-slate-500">palabras</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Duración ideal: 5 – 6.5 minutos</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Retención Promedio</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {estRetention}%
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Formato actual: <strong className="text-slate-800 dark:text-slate-200">{selectedFormat}</strong>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tiempo Generación IA</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {estGenTime}s
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
            Velocidad Gemini 2.0 Flash
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Punto de Abandono</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            &gt; 12 min
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            Caída acelerada de retención (-45%)
          </div>
        </div>
      </div>

      {/* Main Chart Section: Longitud Óptima vs Tiempo de Generación vs Retención */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Curva de Retención de Audiencia vs. Tiempo de Generación Estimado
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Compara la tasa de retención (%) frente al tiempo de respuesta de la IA (segundos) según el volumen de palabras.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Formato:</span>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
              {(["Análisis", "Debate", "Opinión"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={retentionCurveData}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis
                dataKey="words"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `${val} pal.`}
              />
              <YAxis
                yAxisId="left"
                stroke="#6366f1"
                fontSize={11}
                unit="%"
                domain={[20, 100]}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={11}
                unit="s"
                domain={[0, 20]}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "Retención Estimada (%)") return [`${value}%`, name];
                  if (name === "Tiempo Generación (s)") return [`${value}s`, name];
                  return [value, name];
                }}
                labelFormatter={(label) => `Longitud del Guion: ${label} palabras`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => (
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium px-2">
                    {val}
                  </span>
                )}
              />

              {/* Optimal Sweet Spot Highlight (600 to 1200 words) */}
              <ReferenceArea
                yAxisId="left"
                x1={600}
                x2={1200}
                fill="#10b981"
                fillOpacity={0.12}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: "Zona Óptima",
                  fill: "#10b981",
                  fontSize: 11,
                  fontWeight: "bold",
                  position: "insideTop",
                }}
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="retention"
                name="Retención Estimada (%)"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#retentionGrad)"
              />
              <Bar
                yAxisId="right"
                dataKey="genTime"
                name="Tiempo Generación (s)"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                barSize={18}
                opacity={0.8}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="engagement"
                name="Engagement Relativo"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>
              <strong>Zona Verde (600–1200 palabras):</strong> Maximiza la retención (&gt;80%) con tiempos de generación ultra-rápidos (&lt;5s).
            </span>
          </div>
          <span className="font-mono text-[10px]">Tasa de lectura estimada: 150 palabras / minuto</span>
        </div>
      </div>

      {/* Interactive Simulator Slider & Sectional Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Script Length Simulator */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Simulador de Longitud &amp; Tiempo IA
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.badgeBg}`}>
              {simulatedLength} palabras
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Ajustar Cantidad de Palabras del Guion:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {simulatedLength} palabras (~{estMinutes} min)
              </span>
            </div>

            <input
              type="range"
              min="300"
              max="3500"
              step="50"
              value={simulatedLength}
              onChange={(e) => setSimulatedLength(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>300 pág (2m)</span>
              <span>850 pág (Óptimo)</span>
              <span>2000 pág (13m)</span>
              <span>3500 pág (23m)</span>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${statusInfo.bgColor}`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className={statusInfo.color}>{statusInfo.label}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Retención Esperada</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{estRetention}%</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Tiempo Gen. IA</div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400">{estGenTime}s</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Ritmo Lectura</div>
                <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">150 pág/m</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            💡 <strong className="text-slate-900 dark:text-white">Recomendación IA:</strong> Para mantener una retención superior al 85% en el formato <strong>{selectedFormat}</strong>, se sugiere dividir guiones mayores a 1500 palabras en episodios en formato serie de 2 partes.
          </div>
        </div>

        {/* Sectional Retention Breakdown Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Retención por Tramo del Guion
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Promedio de la Industria</span>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectionRetentionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="section" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    color: "#f8fafc",
                    fontSize: "11px",
                  }}
                  formatter={(val: any, name: any) => [`${val}%`, name === "retention" ? "Retención Real" : "Benchmark"]}
                />
                <Bar
                  dataKey="retention"
                  name="Retención Real"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="benchmark"
                  name="Benchmark"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                  opacity={0.5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Ganchos Iniciales (0-1 min):</strong> Los primeros 60 segundos retienen al 98% de los oyentes. Mantén el titular del tema en los primeros 15 segundos para evitar abandonos prematuros.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
