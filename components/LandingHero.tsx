"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  Search,
  Mic,
  FileText,
  ArrowRight,
  Calculator,
  DollarSign,
  Clock,
  Layers,
  Star,
  Check,
  HelpCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Sliders,
  Radio,
  Share2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../app/AuthProvider";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingPricing } from "./LandingPricing";

interface LandingHeroProps {
  onStartNow: () => void;
  onOpenLogin?: () => void;
  onSelectPreset?: (preset: {
    topic: string;
    contentType: string;
    format: "Debate" | "Análisis" | "Opinión";
  }) => void;
}

export function LandingHero({ onStartNow, onOpenLogin, onSelectPreset }: LandingHeroProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pipeline" | "pain" | "calculator" | "comparison" | "pricing">("pipeline");

  // Interactive Sandbox Topic Input State
  const [heroTopic, setHeroTopic] = useState<string>("");
  const [heroFormat, setHeroFormat] = useState<"Debate" | "Análisis" | "Opinión">("Debate");

  // Audio Preview Demo State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioMode, setAudioMode] = useState<"hd" | "monotone">("hd");
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Quick preset suggestions
  const topicPresets = [
    { title: "Fusión Nuclear Comercial 2030", format: "Análisis" as const },
    { title: "IA en Genómica y Medicina de Precisión", format: "Debate" as const },
    { title: "Criptografía Post-Cuántica vs RSA", format: "Análisis" as const },
    { title: "Misiones Artemis y Minería Lunar", format: "Opinión" as const },
  ];

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

  // Audio teaser simulation with Web Speech API or waveform ticker
  useEffect(() => {
    if (isPlayingAudio) {
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2.5;
        });
      }, 500);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlayingAudio]);

  const toggleAudioPlay = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (!isPlayingAudio) {
      if (audioProgress >= 100) {
        setAudioProgress(0);
      }
      setIsPlayingAudio(true);

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const textSample =
          audioMode === "hd"
            ? "Bienvenidos a SourceFinder Pod. Hoy analizamos el nuevo hito de confinamiento magnético en fusión nuclear. Exacto, y las fuentes verificadas de Nature muestran un factor de ganancia récord."
            : "Bienvenidos. Hoy hablamos de fusión nuclear. Los datos muestran avances importantes en energía.";
        const utterance = new SpeechSynthesisUtterance(textSample);
        utterance.lang = "es-ES";
        utterance.rate = audioMode === "hd" ? 1.05 : 0.9;
        utterance.pitch = audioMode === "hd" ? 1.05 : 0.75;
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setAudioProgress(100);
        };
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handleLaunchWithTopic = () => {
    const finalTopic = heroTopic.trim() || "Fusión Nuclear y Matriz Energética Global";
    if (onSelectPreset) {
      onSelectPreset({
        topic: finalTopic,
        contentType: "Investigación Automatizada",
        format: heroFormat,
      });
    } else {
      onStartNow();
    }
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-10 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden mb-8 transition-colors">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-10">
        {/* ========================================================= */}
        {/* TOP HERO HEADLINE & VALUE PROPOSITION */}
        {/* ========================================================= */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-[#1a73e8] dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ESTUDIO EDITORIAL DE IA</span>
            <span className="opacity-30" aria-hidden="true">·</span>
            <span>GOOGLE SEARCH GROUNDING & GEMINI MULTIVOZ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white text-balance">
            De <span className="text-[#ea4335] underline decoration-[#ea4335]/40 underline-offset-8">18 Horas de Investigación</span> a 3 Minutos de Podcast Verificado.
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto font-normal">
            SourceFinder Pod audita noticias en tiempo real con Google Search Grounding, redacta guiones periodísticos con moderadores virtuales y sintetiza audio HD multivoz con masterización a -16 LUFS.
          </p>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE SANDBOX: PRUEBA TU TEMA INMEDIATA */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={heroTopic}
                onChange={(e) => setHeroTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLaunchWithTopic()}
                placeholder="Ingresa un tema o noticia (Ej: Fusión Nuclear en 2030)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(["Debate", "Análisis", "Opinión"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setHeroFormat(fmt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      heroFormat === fmt
                        ? "bg-white dark:bg-slate-800 text-[#1a73e8] dark:text-blue-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLaunchWithTopic}
                className="px-5 py-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs sm:text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-98 transition-all shrink-0"
              >
                <span>Generar Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Clickable Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Temas Sugeridos:
            </span>
            {topicPresets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setHeroTopic(preset.title);
                  setHeroFormat(preset.format);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer text-[11px]"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* AUDIO TEASER DEMO: "ESCUCHA ANTES DE REGISTRARTE" */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-6 max-w-4xl mx-auto shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 dark:border-slate-700/80 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a73e8] dark:text-blue-300 font-mono flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Muestra de Audio Generado en Vivo (Snippet 20s)
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Debate Técnico: &quot;Fusión Nuclear en 2030: ¿Realidad o Promesa?&quot;
              </h2>
            </div>

            {/* A/B Switch: SourceFinder HD vs Generic AI */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setAudioMode("hd")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  audioMode === "hd"
                    ? "bg-[#1a73e8] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                SourceFinder Multivoz HD
              </button>
              <button
                type="button"
                onClick={() => setAudioMode("monotone")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  audioMode === "monotone"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                IA Genérica (Monótona)
              </button>
            </div>
          </div>

          {/* Player Controls & Simulated Dialogue */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Play Button & Time */}
            <div className="md:col-span-4 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAudioPlay}
                className="w-12 h-12 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95 shrink-0"
                aria-label={isPlayingAudio ? "Pausar muestra" : "Reproducir muestra"}
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isPlayingAudio ? "Reproduciendo muestra..." : "Hacer clic para escuchar"}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {Math.round((audioProgress / 100) * 20)}s / 20s · Masterizado a -16 LUFS
                </div>
              </div>
            </div>

            {/* Audio Waveform & Dialogue Snippet */}
            <div className="md:col-span-8 space-y-2">
              {/* Waveform Bar Simulation */}
              <div className="h-6 w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-md overflow-hidden relative flex items-center px-2">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#1a73e8]/25 transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                ></div>
                <div className="relative z-10 w-full flex items-center justify-between gap-1">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const heightFactor = Math.sin(i * 0.4) * 0.5 + 0.5;
                    const isActive = (i / 32) * 100 <= audioProgress;
                    return (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-200 ${
                          isActive
                            ? "bg-[#1a73e8] dark:bg-blue-400"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                        style={{
                          height: isPlayingAudio ? `${Math.max(4, heightFactor * 18)}px` : "6px",
                        }}
                      ></span>
                    );
                  })}
                </div>
              </div>

              {/* Speaker Transcript Indicator */}
              <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                {audioProgress < 50 ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-[#1a73e8]">Alex (Host):</span>
                    <span className="italic truncate">&quot;Bienvenidos. Hoy analizamos el nuevo hito de confinamiento magnético...&quot;</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-[#34a853]">Sam (Analista):</span>
                    <span className="italic truncate">&quot;Exacto, y las fuentes verificadas de Nature muestran un Q-Factor de 1.4...&quot;</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">Google Grounding activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUANTITATIVE RIGOR: PROOF METRICS BAR */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1a73e8] font-mono">18h ➔ 3min</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Tiempo de Producción</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#34a853] font-mono">99.4%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Veracidad en Citas</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">-92%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Coste vs Estudio Físico</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">-16 LUFS</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Mastering Broadcast Spotify</div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION NAVIGATION TABS */}
        {/* ========================================================= */}
        <div id="solucion" className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 scroll-mt-20">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "pipeline"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pipeline de 4 Pasos</span>
          </button>

          <button
            onClick={() => setActiveTab("pain")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "pain"
                ? "bg-[#1a73e8] text-white border-[#1a73e8] shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeTab === "pain" ? "text-white" : "text-[#ea4335]"}`} />
            <span>Desafíos & Soluciones</span>
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
            <span>Calculadora ROI</span>
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

        {/* ========================================================= */}
        {/* TAB 0: BENTO GRID PIPELINE DE 4 PASOS */}
        {/* ========================================================= */}
        {activeTab === "pipeline" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3 relative overflow-hidden shadow-xs hover:border-[#1a73e8] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#1a73e8] font-mono uppercase tracking-wide">
                    01. Auditoría & Fact-Checking
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Google Grounding</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Búsqueda en Vivo & Validación de Reputación
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consulta índices de noticias y páginas especializadas en tiempo real. Extrae citas textuales y asigna un Score de Credibilidad descartando fuentes dudosas o enlaces rotos.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Score de Confianza: 98/100</span>
                  <span aria-hidden="true">·</span>
                  <span>Enlaces verificados</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3 relative overflow-hidden shadow-xs hover:border-[#1a73e8] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wide">
                    02. Guion Dramatizado Multivoz
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Gemini 2.0 AI</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Roles Periodísticos & Dinámicas Reales
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Construye conversaciones fluidas entre Moderador, Analista Técnico y Experto. Integra ganchos de retención (*hooks*), preguntas retóricas y matices emocionales.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Formatos: Debate / Análisis / Opinión</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3 relative overflow-hidden shadow-xs hover:border-[#1a73e8] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wide">
                    03. Síntesis Vocal & Masterización FX
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">-16 LUFS EBU R128</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Audio HD Multivoz con Consola Broadcast
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Convierte el guion en pistas de audio independientes con timbres realistas. Normaliza el nivel de sonoridad para cumplir con las especificaciones de Spotify y Apple Podcasts.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Pitch, Velocidad & Calidez configurables</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3 relative overflow-hidden shadow-xs hover:border-[#1a73e8] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wide">
                    04. Storyboard & Difusión
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Exportación 1-Click</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Diapositivas Visuales & Audiogramas
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Genera la estructura de diapositivas visuales para video podcasts en YouTube o redes sociales. Exporta en ZIP, PDF y formatos compatibles con tu editor favorito.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Exportación ZIP · PDF · JSON</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onStartNow}
                className="px-6 py-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs sm:text-sm tracking-wide shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Abrir Orquestador en Vivo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: PAIN vs SOLUTION GRID */}
        {/* ========================================================= */}
        {activeTab === "pain" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Challenge 1 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ea4335]"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase font-mono text-[#ea4335] dark:text-red-300">
                    <span>Desafío #1</span>
                    <span className="opacity-30" aria-hidden="true">/</span>
                    <span>Alucinaciones & Fake News</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Ahorro: 8+ horas</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Riesgo de publicar datos sin verificar o fuentes no confiables</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Las IAs convencionales pueden generar estadísticas no confirmadas. La verificación manual consume tiempo valioso navegando múltiples sitios.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Google Search Grounding realiza búsquedas en tiempo real, verifica enlaces activos, calcula el Score de Credibilidad de la fuente y extrae citas textuales.
                  </div>
                </div>
              </div>

              {/* Challenge 2 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#fbbc04]"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase font-mono text-amber-700 dark:text-amber-300">
                    <span>Desafío #2</span>
                    <span className="opacity-30" aria-hidden="true">/</span>
                    <span>Guiones Monótonos</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Objetivo: Máxima Retención</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Narrativas lineales sin estructura dramática ni dinamismo</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Los textos redactados de forma simple carecen de ganchos iniciales, matices emocionales o interacción fluida entre locutores.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Orchestrator AI genera diálogos multivoz con roles definidos (Moderador, Analista, Invitado) bajo formatos de Debate, Análisis Técnico u Opinión.
                  </div>
                </div>
              </div>

              {/* Challenge 3 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1a73e8]"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase font-mono text-[#1a73e8] dark:text-blue-300">
                    <span>Desafío #3</span>
                    <span className="opacity-30" aria-hidden="true">/</span>
                    <span>Dispersión de Herramientas</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Beneficio: Flujo Unificado</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Diversas plataformas desconectadas para completar un episodio</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Alternar entre diferentes herramientas para investigar, redactar, sintetizar voz, editar y diseñar genera fricción en el proceso creativo.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Ecosistema Unificado 1-Click: Investigación &rarr; Guion &rarr; Síntesis Voz Multivoz &rarr; Consola Audio Master &rarr; Visual Storyboard.
                  </div>
                </div>
              </div>

              {/* Challenge 4 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#34a853]"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase font-mono text-emerald-700 dark:text-emerald-300">
                    <span>Desafío #4</span>
                    <span className="opacity-30" aria-hidden="true">/</span>
                    <span>Costos Elevados</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Ahorro: Hasta 92%</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Altas inversiones requeridas en producción tradicional</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Los estudios tradicionales involucran costos significativos por hora de edición, masterización y contratación de servicios externos.
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#34a853]" />
                  <div>
                    <strong className="text-[#34a853] font-bold">Solución SourceFinder: </strong>
                    Automatización completa en la nube impulsada por Gemini 2.0 que optimiza los costos de producción con la máxima eficiencia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CALCULATOR & ROI */}
        {/* ========================================================= */}
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
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-[#1a73e8] dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-xs font-mono font-bold">
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
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-[#1a73e8] dark:text-blue-300 rounded text-[11px] font-bold uppercase border border-blue-200 dark:border-blue-800">
                        {totalMonthlyTokens <= 500 ? "Plan Gratuito ($0)" : totalMonthlyTokens <= 5000 ? "Plan Creador Pro ($29/mes)" : "Plan Studio Enterprise ($79/mes)"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
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

        {/* ========================================================= */}
        {/* TAB 3: COMPARISON MATRIX */}
        {/* ========================================================= */}
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

        {/* ========================================================= */}
        {/* TAB 4: PRICING PLANS */}
        {/* ========================================================= */}
        {activeTab === "pricing" && (
          <div className="animate-in fade-in duration-300">
            <LandingPricing onStartNow={onStartNow} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TRUSTED BY & TESTIMONIAL CAROUSEL SECTION                 */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <LandingSocialProof
            onStartNow={onStartNow}
            onSelectPreset={onSelectPreset}
          />
        </div>

        {/* ========================================================= */}
        {/* DEDICATED PRICING SECTION (FREE, PRO, ENTERPRISE)         */}
        {/* ========================================================= */}
        {activeTab !== "pricing" && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <LandingPricing onStartNow={onStartNow} />
          </div>
        )}
      </div>
    </div>
  );
}
