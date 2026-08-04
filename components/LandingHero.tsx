"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, Zap, Search, Mic, FileText, ArrowRight, Calculator, DollarSign, Clock, Layers, Star, Check, HelpCircle, Flame, Activity } from "lucide-react";
import { useAuth } from "../app/AuthProvider";

interface LandingHeroProps {
  onStartNow: () => void;
  onOpenLogin?: () => void;
}

export function LandingHero({ onStartNow, onOpenLogin }: LandingHeroProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pain" | "calculator" | "comparison" | "pricing">("pain");

  // Calculator State
  const [episodesPerMonth, setEpisodesPerMonth] = useState<number>(4);
  const [episodeLengthMins, setEpisodeLengthMins] = useState<number>(15);

  // Token & ROI Calculations
  const charsPerEpisode = episodeLengthMins * 900;
  const ttsTokensPerEpisode = Math.round(charsPerEpisode / 10);
  const auditTokens = 50;
  const scriptTokens = 150;
  const masterFxTokens = 100;
  const storyboardTokens = 40;

  const tokensPerEpisode = auditTokens + scriptTokens + ttsTokensPerEpisode + masterFxTokens + storyboardTokens;
  const totalMonthlyTokens = tokensPerEpisode * episodesPerMonth;

  const traditionalCostPerEpisode = Math.round(episodeLengthMins * 18);
  const totalTraditionalMonthly = traditionalCostPerEpisode * episodesPerMonth;

  const sourceFinderMonthlyCost = totalMonthlyTokens <= 500 ? 0 : totalMonthlyTokens <= 5000 ? 29 : 79;
  const monthlyMoneySaved = totalTraditionalMonthly - sourceFinderMonthlyCost;

  const hoursSavedPerEpisode = 11.75;
  const totalHoursSavedMonthly = Math.round(hoursSavedPerEpisode * episodesPerMonth);

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-10 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden mb-8 transition-colors">
      {/* Google Cloud Style Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Top Header & Tagline (Google Cloud Light Style) */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#1a73e8] dark:text-blue-300 rounded-full text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>ARQUITECTURA DE IA • GEMINI 2.0 & GOOGLE SEARCH GROUNDING</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            De <span className="text-[#ea4335] underline decoration-[#ea4335]/40 underline-offset-8">18 Horas de Investigación</span> a 3 Minutos de Podcast Verificado.
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto font-normal">
            SourceFinder Pod resuelve de raíz la investigación caótica, alucinaciones de IA, guiones monótonos y altos costos de producción combinando Google Search Grounding y síntesis multivoz en la nube.
          </p>
        </div>

        {/* Section Navigation Tabs (Google Cloud Console Style) */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab("pain")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "pain"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeTab === "pain" ? "text-white" : "text-[#ea4335]"}`} />
            <span>Dolor vs Solución</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "calculator"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Calculator className={`w-4 h-4 ${activeTab === "calculator" ? "text-white" : "text-[#fbbc04]"}`} />
            <span>Calculadora ROI & Tokens</span>
          </button>

          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "comparison"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === "comparison" ? "text-white" : "text-[#34a853]"}`} />
            <span>Matriz Comparativa</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "pricing"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <DollarSign className={`w-4 h-4 ${activeTab === "pricing" ? "text-white" : "text-[#1a73e8]"}`} />
            <span>Planes & Suscripción</span>
          </button>
        </div>

        {/* TAB 1: PAIN vs SOLUTION GRID */}
        {activeTab === "pain" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pain 1 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ea4335]"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-[#ea4335] dark:text-red-300 rounded text-[11px] font-semibold uppercase font-mono">
                    Dolor #1: Alucinaciones & Fake News
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: 8+ horas</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Miedo a publicar datos erróneos o citar fuentes inventadas</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Las IAs convencionales inventan estadísticas y hechos. El creador pierde días verificando datos manualmente en múltiples pestañas del navegador.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Google Search Grounding realiza búsquedas en tiempo real, verifica enlaces activos, calcula el Score de Credibilidad de la fuente y extrae citas textuales.
                  </div>
                </div>
              </div>

              {/* Pain 2 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#fbbc04]"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded text-[11px] font-semibold uppercase font-mono">
                    Dolor #2: Guiones Monótonos
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: Retención & Audiencia</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Monólogos aburridos sin estructura dramática ni dinamismo</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Los textos redactados con prompts básicos carecen de ganchos iniciales, cambios de ritmo o la interacción natural entre moderador y analista.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Orchestrator AI genera diálogos multivoz con roles definidos (Moderador, Analista, Invitado) bajo formatos de Debate, Análisis Técnico u Opinión.
                  </div>
                </div>
              </div>

              {/* Pain 3 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1a73e8]"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#1a73e8] dark:text-blue-300 rounded text-[11px] font-semibold uppercase font-mono">
                    Dolor #3: Caos de Herramientas
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: Fricción & Errores</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Saltar entre 5 aplicaciones distintas para completar un episodio</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Investigar en Notion, convertir texto en ElevenLabs, editar en Descript, masterizar en Auphonic y hacer gráficos en Canva consume todo tu tiempo creativo.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Ecosistema Unificado 1-Click: Investigación &rarr; Guion &rarr; Síntesis Voz Multivoz &rarr; Consola Audio Master &rarr; Visual Storyboard.
                  </div>
                </div>
              </div>

              {/* Pain 4 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#34a853]"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-semibold uppercase font-mono">
                    Dolor #4: Costos Inasumibles
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pérdida: $1,200+/mes</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Presupuestos elevados para contratar editores y redactores</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Un estudio de grabación tradicional cobra $250 a $500 dólares por episodio entre investigación, edición y masterización.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Automatización completa en la nube impulsada por Gemini 2.0 que reduce los costos de producción hasta en un 92%.
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Banner Inside Pain Tab */}
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">¿Listo para transformar tu flujo de producción?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">Genera tu primer informe verificado con audio multivoz en menos de 3 minutos.</p>
              </div>
              <button
                onClick={onStartNow}
                className="px-5 py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs tracking-wide shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-98 transition-all"
              >
                <span>Probar Orquestador Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CALCULATOR & ROI */}
        {activeTab === "calculator" && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#1a73e8]" />
                  Calculadora Interactiva de Tokens & ROI Mensual
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ajusta los parámetros de tu podcast y calcula el ahorro estimado de tiempo y dinero.</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-[#1a73e8] border border-blue-200 rounded text-xs font-mono font-bold">
                Transparencia Algorítmica
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <label className="text-slate-700 dark:text-slate-300">Episodios creados al mes:</label>
                    <span className="font-bold font-mono text-[#1a73e8]">{episodesPerMonth} episodios</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={episodesPerMonth}
                    onChange={(e) => setEpisodesPerMonth(parseInt(e.target.value))}
                    className="w-full accent-[#1a73e8] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <label className="text-slate-700 dark:text-slate-300">Duración promedio por episodio:</label>
                    <span className="font-bold font-mono text-[#1a73e8]">{episodeLengthMins} minutos</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={episodeLengthMins}
                    onChange={(e) => setEpisodeLengthMins(parseInt(e.target.value))}
                    className="w-full accent-[#1a73e8] cursor-pointer"
                  />
                </div>

                {/* Token breakdown table */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Desglose de consumo por episodio:</div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>• Búsqueda & Verificación (Grounding):</span>
                    <span className="font-mono">{auditTokens} tokens</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>• Redacción Guion Multivoz (Gemini 2.0):</span>
                    <span className="font-mono">{scriptTokens} tokens</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>• Síntesis Voz TTS ({episodeLengthMins}m):</span>
                    <span className="font-mono">{ttsTokensPerEpisode} tokens</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>• Procesamiento Audio Master FX:</span>
                    <span className="font-mono">{masterFxTokens} tokens</span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total por episodio:</span>
                    <span className="font-mono text-[#1a73e8]">{tokensPerEpisode} tokens</span>
                  </div>
                </div>
              </div>

              {/* ROI Results Display */}
              <div className="bg-blue-50/50 dark:bg-slate-900 rounded-xl p-6 border border-blue-100 dark:border-slate-700 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Resultados Estimados Mensuales</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
                        Tiempo Ahorrado
                      </div>
                      <div className="text-2xl font-black text-[#1a73e8] mt-1 font-mono">{totalHoursSavedMonthly} hrs</div>
                      <div className="text-[10px] text-slate-400 mt-1">~{hoursSavedPerEpisode}h menos por episodio</div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-[#34a853]" />
                        Ahorro Monetario
                      </div>
                      <div className="text-2xl font-black text-[#34a853] mt-1 font-mono">${monthlyMoneySaved} USD</div>
                      <div className="text-[10px] text-slate-400 mt-1">Comparado con estudio tradicional</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Consumo Total de Tokens:</span>
                      <span className="font-bold font-mono text-[#1a73e8]">{totalMonthlyTokens} tokens/mes</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Plan Recomendado:</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1a73e8] rounded text-[11px] font-bold uppercase border border-blue-200">
                        {totalMonthlyTokens <= 500 ? "Plan Gratuito ($0)" : totalMonthlyTokens <= 5000 ? "Plan Creador Pro ($29/mes)" : "Plan Studio Enterprise ($79/mes)"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onStartNow}
                  className="w-full py-3 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs tracking-wide shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Comenzar Ahora con este Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPARISON MATRIX */}
        {activeTab === "comparison" && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6 shadow-xs animate-in fade-in duration-300 overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#34a853]" />
              Matriz Comparativa de Soluciones en el Mercado
            </h3>

            <table className="w-full text-xs text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Característica / Función</th>
                  <th className="py-3 px-4 font-semibold text-[#1a73e8]">SourceFinder Pod</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">IAs Genéricas (ChatGPT)</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Estudio Tradicional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-medium">Búsqueda en Tiempo Real & Fact-Checking</td>
                  <td className="py-3.5 px-4 font-bold text-[#34a853] flex items-center gap-1">
                    <Check className="w-4 h-4 text-[#34a853]" /> Google Grounding
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Sin enlaces/Fechas pasadas</td>
                  <td className="py-3.5 px-4 text-slate-400">Manual (Horas)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Generación de Guion Multivoz</td>
                  <td className="py-3.5 px-4 font-bold text-[#34a853] flex items-center gap-1">
                    <Check className="w-4 h-4 text-[#34a853]" /> Roles Nativos (Moderador/Analista)
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Texto plano monótono</td>
                  <td className="py-3.5 px-4 text-slate-400">Redactor ($150+)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Síntesis TTS Audio HD</td>
                  <td className="py-3.5 px-4 font-bold text-[#34a853] flex items-center gap-1">
                    <Check className="w-4 h-4 text-[#34a853]" /> Integrado 1-Click
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Requiere API externa</td>
                  <td className="py-3.5 px-4 text-slate-400">Locutores ($200+)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Consola de Masterización FX</td>
                  <td className="py-3.5 px-4 font-bold text-[#34a853] flex items-center gap-1">
                    <Check className="w-4 h-4 text-[#34a853]" /> Normalización -16 LUFS + Ruido Rosa
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">No disponible</td>
                  <td className="py-3.5 px-4 text-slate-400">Ingeniero de Audio</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Tiempo Promedio por Episodio</td>
                  <td className="py-3.5 px-4 font-bold text-[#1a73e8] font-mono">3 Minutos</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">3-5 Horas</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">18+ Horas</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PRICING PLANS */}
        {activeTab === "pricing" && (
          <div className="space-y-6 animate-in fade-in duration-300" id="pricing">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Planes Flexibles Adaptados a tu Escala</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comienza gratis hoy y actualiza según tus necesidades de publicación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan 1 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Gratuito</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">$0</span>
                    <span className="text-xs text-slate-500">/mes</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Para creadores independientes que están comenzando.</p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> 500 Tokens Mensuales</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Grounding Búsqueda Limitado</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Síntesis 2 Voces Estándar</li>
                  </ul>
                </div>
                <button
                  onClick={onStartNow}
                  className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  Usar Plan Gratuito
                </button>
              </div>

              {/* Plan 2 Pro */}
              <div className="bg-white dark:bg-slate-800 border-2 border-[#1a73e8] rounded-xl p-6 space-y-4 relative flex flex-col justify-between shadow-md">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#1a73e8] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Más Popular
                </div>
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#1a73e8] uppercase tracking-wider">Creador Pro</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">$29</span>
                    <span className="text-xs text-slate-500">/mes</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Para podcasters recurrentes que publican de 2 a 4 veces por semana.</p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> 5,000 Tokens Mensuales</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Full Google Search Grounding</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Voces HD Multilingües</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Consola Master FX Completa</li>
                  </ul>
                </div>
                <button
                  onClick={onStartNow}
                  className="w-full py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Comenzar Prueba Gratis (7 Días)
                </button>
              </div>

              {/* Plan 3 Enterprise */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Studio Enterprise</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">$79</span>
                    <span className="text-xs text-slate-500">/mes</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Para agencias de medios y equipos de producción masiva.</p>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Tokens Ilimitados</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Exportación de Proyecto en Lote</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34a853]" /> Soporte Prioritario 24/7</li>
                  </ul>
                </div>
                <button
                  onClick={onStartNow}
                  className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  Contactar Ventas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
