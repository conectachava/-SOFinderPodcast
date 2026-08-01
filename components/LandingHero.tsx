"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, Zap, Search, Mic, FileText, ArrowRight, Calculator, DollarSign, Clock, Layers, Star, Check, HelpCircle, Flame, Activity } from "lucide-react";
import { useAuth } from "../app/AuthProvider";

interface LandingHeroProps {
  onStartNow: () => void;
}

export function LandingHero({ onStartNow }: LandingHeroProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pain" | "calculator" | "comparison" | "pricing">("pain");

  // Calculator State
  const [episodesPerMonth, setEpisodesPerMonth] = useState<number>(4);
  const [episodeLengthMins, setEpisodeLengthMins] = useState<number>(15);
  const [voicesCount, setVoicesCount] = useState<number>(2);

  // Token & ROI Calculations
  // Estimated chars per min of dialogue: ~900 chars
  const charsPerEpisode = episodeLengthMins * 900;
  const ttsTokensPerEpisode = Math.round(charsPerEpisode / 10); // 1 token per 10 chars
  const auditTokens = 50; // source finder audit
  const scriptTokens = 150; // orchestrator script
  const masterFxTokens = 100; // master audio studio
  const storyboardTokens = 40; // 2 scenes

  const tokensPerEpisode = auditTokens + scriptTokens + ttsTokensPerEpisode + masterFxTokens + storyboardTokens;
  const totalMonthlyTokens = tokensPerEpisode * episodesPerMonth;

  // Traditional studio cost: ~$250 per 15 min episode ($150 script/research + $100 audio engineering)
  const traditionalCostPerEpisode = Math.round(episodeLengthMins * 18);
  const totalTraditionalMonthly = traditionalCostPerEpisode * episodesPerMonth;

  // SourceFinder Pod Cost: $0 (Free plan up to 500) or $29 Pro Plan (5000 tokens)
  const sourceFinderMonthlyCost = totalMonthlyTokens <= 500 ? 0 : totalMonthlyTokens <= 5000 ? 29 : 79;
  const monthlyMoneySaved = totalTraditionalMonthly - sourceFinderMonthlyCost;

  // Hours calculation: Traditional episode = ~12 hours total. SourceFinder = ~15 mins.
  const hoursSavedPerEpisode = 11.75;
  const totalHoursSavedMonthly = Math.round(hoursSavedPerEpisode * episodesPerMonth);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden mb-8 transition-all">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Top Header & Tagline */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-full text-xs font-mono font-bold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>ARQUITECTURA ESTRATÉGICA • GEMINI 2.0 & GOOGLE SEARCH GROUNDING</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            De <span className="text-rose-400 underline decoration-rose-500/50 underline-offset-8">18 Horas de Caos</span> a 3 Minutos de Perfección en tu Podcast.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            SourceFinder Pod resuelve de raíz los 4 dolores críticos de creadores e investigadores: investigación caótica, alucinaciones de IA, guiones planos y altos costos de producción.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab("pain")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "pain"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Dolor vs Solución</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "calculator"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Calculadora ROI & Tokens</span>
          </button>

          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "comparison"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Matriz Comparativa</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "pricing"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span>Planes & Suscripción</span>
          </button>
        </div>

        {/* TAB 1: PAIN vs SOLUTION GRID */}
        {activeTab === "pain" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pain 1 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-md text-[11px] font-bold uppercase font-mono">
                    Dolor #1: Alucinaciones & Fake News
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: 8+ horas</span>
                </div>
                <h3 className="text-base font-bold text-white">Miedo a publicar datos erróneos o citar fuentes inventadas</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Las IAs convencionales inventan estadísticas y hechos. El creador pierde días verificando datos manualmente en múltiples pestañas del navegador.
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="text-white font-semibold">Solución SourceFinder: </strong>
                    Google Search Grounding realiza búsquedas en tiempo real, verifica enlaces activos, calcula el Score de Credibilidad de la fuente y extrae citas textuales.
                  </div>
                </div>
              </div>

              {/* Pain 2 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md text-[11px] font-bold uppercase font-mono">
                    Dolor #2: Guiones Monótonos
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: Retención & Audiencia</span>
                </div>
                <h3 className="text-base font-bold text-white">Monólogos aburridos sin estructura dramática ni dinamismo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Los textos redactados con prompts básicos carecen de ganchos iniciales, cambios de ritmo o la interacción natural entre moderador y analista.
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="text-white font-semibold">Solución SourceFinder: </strong>
                    Orchestrator AI genera diálogos multivoz con roles definidos (Moderador, Analista, Invitado) bajo formatos de Debate, Análisis Técnico u Opinión.
                  </div>
                </div>
              </div>

              {/* Pain 3 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-md text-[11px] font-bold uppercase font-mono">
                    Dolor #3: Caos de Herramientas
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: Fricción & Errores</span>
                </div>
                <h3 className="text-base font-bold text-white">Saltar entre 5 aplicaciones distintas para completar un episodio</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Investigar en Notion, convertir texto en ElevenLabs, editar en Descript, masterizar en Auphonic y hacer gráficos en Canva consume todo tu tiempo creativo.
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="text-white font-semibold">Solución SourceFinder: </strong>
                    Ecosistema Unificado 1-Click: Investigación &rarr; Guion &rarr; Síntesis Voz Multivoz &rarr; Consola Audio Master &rarr; Visual Storyboard en una sola plataforma.
                  </div>
                </div>
              </div>

              {/* Pain 4 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-[11px] font-bold uppercase font-mono">
                    Dolor #4: Costos Inasumibles
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: $1,200+/mes</span>
                </div>
                <h3 className="text-base font-bold text-white">Presupuestos elevados para contratar editores y redactores</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Un estudio de grabación tradicional cobra $250 a $500 dólares por episodio entre investigación, edición y masterización.
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="text-white font-semibold">Solución SourceFinder: </strong>
                    Sistema Transparente de Tokens: Produce episodios completos desde $0.40 en tokens con el mismo estándar de calidad de radiodifusión.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CALCULATOR & TOKEN ECONOMICS */}
        {activeTab === "calculator" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    Calculadora de Ahorro ROI & Consumo de Tokens
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ajusta los parámetros de tu producción para simular consumo exacto en tokens, ahorro en horas y costo vs estudio tradicional.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono font-bold">
                  Sistema Transparente por Tokens
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Slider 1 */}
                <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">Episodios al Mes</span>
                    <span className="text-amber-400 font-mono text-sm">{episodesPerMonth} episodios</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={episodesPerMonth}
                    onChange={(e) => setEpisodesPerMonth(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Frecuencia de publicación semanal o diaria.</p>
                </div>

                {/* Slider 2 */}
                <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">Duración por Episodio</span>
                    <span className="text-amber-400 font-mono text-sm">{episodeLengthMins} minutos</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="5"
                    value={episodeLengthMins}
                    onChange={(e) => setEpisodeLengthMins(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Minutos estimados de audio síntesis multivoz.</p>
                </div>

                {/* Slider 3 */}
                <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">Locutores / Voces</span>
                    <span className="text-amber-400 font-mono text-sm">{voicesCount} locutores</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={voicesCount}
                    onChange={(e) => setVoicesCount(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Moderador, Analista Co-Host e Invitado.</p>
                </div>
              </div>

              {/* Dynamic ROI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 space-y-1">
                  <span className="text-[11px] text-indigo-300 font-mono font-bold uppercase">Tokens Requeridos / Mes</span>
                  <div className="text-2xl font-black text-white font-mono">{totalMonthlyTokens.toLocaleString()} <span className="text-xs text-indigo-400 font-normal">Tokens</span></div>
                  <p className="text-[10px] text-slate-400">~{tokensPerEpisode} tokens por episodio</p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-950/60 border border-amber-800/80 space-y-1">
                  <span className="text-[11px] text-amber-300 font-mono font-bold uppercase">Costo Mensual Estimado</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">${sourceFinderMonthlyCost} <span className="text-xs text-amber-300 font-normal">USD/mes</span></div>
                  <p className="text-[10px] text-slate-400">{sourceFinderMonthlyCost === 0 ? "¡Cubierto por Plan Gratuito!" : "Plan Pro Podcaster"}</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-1">
                  <span className="text-[11px] text-emerald-300 font-mono font-bold uppercase">Horas Ahorradas / Mes</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{totalHoursSavedMonthly} <span className="text-xs text-emerald-300 font-normal">Horas</span></div>
                  <p className="text-[10px] text-slate-400">Equivalente a 2 semanas laborables</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-mono font-bold uppercase">Ahorro Económico Neto</span>
                  <div className="text-2xl font-black text-white font-mono">${monthlyMoneySaved.toLocaleString()} <span className="text-xs text-emerald-400 font-normal">USD/mes</span></div>
                  <p className="text-[10px] text-slate-500">vs ${totalTraditionalMonthly.toLocaleString()} en estudio tradicional</p>
                </div>
              </div>

              {/* Token Rates Table */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Estructura Exacta de Valor de Tokens por Módulo
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3 font-semibold">Módulo del Sistema</th>
                        <th className="py-2.5 px-3 font-semibold">Consumo en Tokens</th>
                        <th className="py-2.5 px-3 font-semibold">Beneficio Clave</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-indigo-400" />
                          Auditoría SourceFinder
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">50 Tokens / consulta</td>
                        <td className="py-2.5 px-3 text-slate-400">Google Search Grounding + Búsqueda de enlaces reales y score de credibilidad.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          Guion Orchestrator AI
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">150 Tokens / guion</td>
                        <td className="py-2.5 px-3 text-slate-400">Redacción multivoz con ganchos de retención, formato Debate, Análisis u Opinión.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                          <Mic className="w-3.5 h-3.5 text-indigo-400" />
                          Síntesis Multivoz HD
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">1 Token / 10 caracteres</td>
                        <td className="py-2.5 px-3 text-slate-400">Generación de voz natural con modulación emocional e inflexión de tono.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          Consola Master Audio FX
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">100 Tokens / track</td>
                        <td className="py-2.5 px-3 text-slate-400">Efectos Glue Compressor, Excitador Armónico y normalización LUFS para plataformas.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Storyboard Scene Visualizer
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">20 Tokens / escena</td>
                        <td className="py-2.5 px-3 text-slate-400">Generación de escenas visuales sincronizadas con prompts de video.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPETITIVE MATRIX */}
        {activeTab === "comparison" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-x-auto">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-xl font-extrabold text-white">SourceFinder Pod vs Soluciones del Mercado</h3>
                <p className="text-xs text-slate-400">
                  Compara por qué los creadores eligen nuestro ecosistema integrado frente a herramientas aisladas o servicios tradicionales.
                </p>
              </div>

              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3 px-4 font-semibold">Funcionalidad</th>
                    <th className="py-3 px-4 font-extrabold text-amber-400 bg-indigo-950/60 rounded-t-xl border-t border-x border-indigo-800">
                      SourceFinder Pod
                    </th>
                    <th className="py-3 px-4 font-semibold">NotebookLM</th>
                    <th className="py-3 px-4 font-semibold">Descript</th>
                    <th className="py-3 px-4 font-semibold">ElevenLabs</th>
                    <th className="py-3 px-4 font-semibold">Estudio Tradicional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Fact-Checking con URLs Reales</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-indigo-800/50 font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Sí (Google Grounding)
                    </td>
                    <td className="py-3 px-4 text-slate-400">Solo archivos subidos</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-slate-300">Manual (Horas)</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Guiones Multivoz con Ganchos</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-indigo-800/50 font-bold text-emerald-400">
                      ✓ Automatizado en 3 estilos
                    </td>
                    <td className="py-3 px-4 text-slate-400">Básico (Fijo)</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-slate-300">Lento / Costoso</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Consola Audio Master & LUFS</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-indigo-800/50 font-bold text-emerald-400">
                      ✓ Integrado (Glue FX)
                    </td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-emerald-400">✓ Sí</td>
                    <td className="py-3 px-4 text-slate-400">Básico</td>
                    <td className="py-3 px-4 text-emerald-400">✓ Manual DAWs</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Visual Storyboard Prompts</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-indigo-800/50 font-bold text-emerald-400">
                      ✓ Generación automática
                    </td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-rose-400">No disponible</td>
                    <td className="py-3 px-4 text-slate-300">Requiere Diseñador</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Tiempo Estimado por Episodio</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-indigo-800/50 font-bold text-amber-300 font-mono">
                      ⚡ 3 Minutos
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">15 Minutos</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">2 Horas</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">1 Hora</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">18 Horas</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Costo Estimado Mensual</td>
                    <td className="py-3 px-4 bg-indigo-950/40 border-x border-b border-indigo-800/50 rounded-b-xl font-bold text-amber-400 font-mono text-sm">
                      $0 - $29 / mes
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">$20 / mes</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">$30 / mes</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">$22 / mes</td>
                    <td className="py-3 px-4 text-rose-400 font-mono">$1,200+ / mes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PRICING PLANS */}
        {activeTab === "pricing" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-extrabold text-white">Planes Diseñados para Creadores & Redes de Podcasts</h3>
              <p className="text-xs text-slate-400">
                Aumenta tu frecuencia de publicación manteniendo el estándar de calidad más alto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PLAN 1: FREE */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between relative shadow-xl hover:border-slate-700 transition-all">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Creador Inicial</span>
                    <h4 className="text-2xl font-black text-white">Free Creator</h4>
                    <p className="text-xs text-slate-400">Ideal para probar la plataforma y crear tus primeros episodios.</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 border-t border-slate-800">
                    <span className="text-3xl font-black text-white">$0</span>
                    <span className="text-xs text-slate-400">USD / mes gratis</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>500 Tokens</strong> mensuales incluidos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Auditoría de Fuentes con Google Search Grounding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Guiones Multivoz (Debate, Análisis, Opinión)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Síntesis de Audio Multivoz en Tiempo Real</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onStartNow}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Usar Plan Gratuito
                </button>
              </div>

              {/* PLAN 2: PRO PODCASTER (FEATURED) */}
              <div className="bg-gradient-to-b from-indigo-950/90 to-slate-950 border-2 border-indigo-500 rounded-3xl p-6 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-indigo-600/20 scale-105 z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-amber-500 text-slate-950 font-black text-[10px] font-mono uppercase tracking-wider rounded-full shadow-md">
                  🔥 MÁS POPULAR • 95% AHORRO
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-indigo-300 uppercase font-bold">Podcaster Pro</span>
                    <h4 className="text-2xl font-black text-white">Pro Podcaster</h4>
                    <p className="text-xs text-indigo-200">Para podcasters activos que publican de 2 a 8 episodios al mes.</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 border-t border-indigo-800/80">
                    <span className="text-3xl font-black text-amber-400">$29</span>
                    <span className="text-xs text-indigo-300">USD / mes</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>5,000 Tokens</strong> mensuales (~10 episodios completos)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Modelos Gemini 2.0 de Alta Veloz</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Consola de Masterización de Audio (Glue FX)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Generación de Storyboard Visual</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Prioridad en Cola de Procesamiento de Audio</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onStartNow}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Comenzar con Plan Pro
                </button>
              </div>

              {/* PLAN 3: STUDIO & NETWORK */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between relative shadow-xl hover:border-slate-700 transition-all">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Agencia & Redes</span>
                    <h4 className="text-2xl font-black text-white">Studio Network</h4>
                    <p className="text-xs text-slate-400">Para productoras, medios digitales y redes de múltiples programas.</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 border-t border-slate-800">
                    <span className="text-3xl font-black text-white">$79</span>
                    <span className="text-xs text-slate-400">USD / mes</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>20,000 Tokens</strong> mensuales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Clonación e Identidad de Voz Personalizada</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Exportación en WAV Lossless HD</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sincronización Cloud Multidispositivo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Soporte Prioritario 24/7</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onStartNow}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Seleccionar Plan Studio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-white">Inicia Inmediatamente en Modo Demo o con Google Auth</p>
              <p className="text-[11px] text-slate-400">Sin compromisos ni tarjetas de crédito requeridas para probar.</p>
            </div>
          </div>

          <button
            onClick={onStartNow}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Lanzar mi Podcast Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
