"use client";

import React, { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon,
  ArrowRight,
  Radio,
  Layers,
  Sliders,
  Share2,
  Building2,
  HelpCircle,
} from "lucide-react";

interface LandingPricingProps {
  onStartNow: () => void;
  onSelectPlan?: (planId: "free" | "professional" | "enterprise") => void;
}

export function LandingPricing({ onStartNow, onSelectPlan }: LandingPricingProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [simulatedEpisodes, setSimulatedEpisodes] = useState<number>(20);

  const proPrice = billingCycle === "annual" ? 23 : 29;
  const enterprisePrice = billingCycle === "annual" ? 64 : 79;

  // Cost per episode with Unlimited AI Podcasts on Professional vs Traditional Studio ($250/ep)
  const costPerEpisodePro = (proPrice / Math.max(1, simulatedEpisodes)).toFixed(2);
  const traditionalTotal = simulatedEpisodes * 250;
  const savingsTotal = traditionalTotal - proPrice;

  const handlePlanClick = (planId: "free" | "professional" | "enterprise") => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
    onStartNow();
  };

  return (
    <section
      id="pricing"
      aria-label="Planes y precios con podcasts generados por IA ilimitados"
      className="space-y-8 py-4 scroll-mt-20"
    >
      {/* ========================================================= */}
      {/* HEADER & BILLING CYCLE TOGGLE                             */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#1a73e8] dark:text-blue-400 font-bold">
            <InfinityIcon className="w-4 h-4" />
            <span>Producción Escalable · Podcasts con IA Ilimitados</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Planes Transparentes para Creadores, Profesionales y Medios
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Comienza gratis sin tarjeta de crédito o desbloquea la{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">
              generación ilimitada de podcasts con IA
            </strong>{" "}
            para publicar diariamente sin pagar costos adicionales por episodio ni por minuto de audio.
          </p>
        </div>

        {/* Interactive Billing Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-300/80 dark:border-slate-700 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-[#1a73e8] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Anual</span>
            <span className="font-mono text-[10px] opacity-90">(-20% Ahorro)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* UNLIMITED AI PODCASTS VALUE HIGHLIGHT BANNER              */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-emerald-50/60 dark:from-slate-800/95 dark:via-slate-800/80 dark:to-slate-900 border border-blue-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1a73e8] dark:text-blue-300 uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Ventaja Competitiva: Tarifa Plana Ilimitada</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              ¿Por qué los Podcasts con IA Ilimitados transforman tu economía de contenido?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Mientras otras plataformas cobran por minuto sintetizado o bloquean tu cuenta tras pocos episodios, los planes{" "}
              <strong className="text-slate-900 dark:text-white">Profesional</strong> y{" "}
              <strong className="text-slate-900 dark:text-white">Enterprise</strong> incluyen{" "}
              <strong className="text-[#34a853] font-bold">generación ilimitada de podcasts con IA</strong>: investiga, experimenta con distintos ángulos editoriales y publica en múltiples idiomas con coste marginal cero.
            </p>
          </div>

          {/* Interactive Unlimited Cost-Per-Episode Visualizer */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="unlimited-ep-slider" className="font-semibold text-slate-700 dark:text-slate-200">
                Si produces {simulatedEpisodes} episodios/mes:
              </label>
              <span className="font-mono font-bold text-[#1a73e8] dark:text-blue-400">
                ${costPerEpisodePro} USD / episodio
              </span>
            </div>

            <input
              id="unlimited-ep-slider"
              type="range"
              min="5"
              max="60"
              step="5"
              value={simulatedEpisodes}
              onChange={(e) => setSimulatedEpisodes(parseInt(e.target.value, 10))}
              className="w-full accent-[#1a73e8] cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Estudio tradicional: ${traditionalTotal.toLocaleString()} USD</span>
              <span className="text-[#34a853] font-bold">
                Ahorras ${savingsTotal.toLocaleString()} USD/mes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3-TIER PRICING CARDS: FREE, PROFESSIONAL, ENTERPRISE      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ------------------------------------------------------- */}
        {/* TIER 1: FREE (GRATUITO)                                 */}
        {/* ------------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                01. Nivel Inicial · Free
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Plan Gratuito
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Para creadores independientes y periodistas que desean validar el flujo de investigación y audio verificado.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  $0
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  USD / mes · Para siempre
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Incluye 500 tokens mensuales (~3 episodios completos)
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider font-mono">
                Qué incluye el nivel Free:
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Hasta 3 podcasts generados con IA al mes (500 tokens)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Auditoría de fuentes reales con Google Search Grounding</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Guiones multivoz (2 locutores) en Debate, Análisis u Opinión</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Visualizador de onda en tiempo real y exportación WAV</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Tarjetas de vista previa para compartir en LinkedIn y X</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePlanClick("free")}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Comenzar Gratis Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------- */}
        {/* TIER 2: PROFESSIONAL (PROFESIONAL - DESTACADO)          */}
        {/* ------------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-800 border-2 border-[#1a73e8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-md relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a73e8] dark:text-blue-400">
                02. Nivel Recomendado · Pro
              </span>
              <span className="text-[11px] font-mono font-bold text-[#34a853] flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5" />
                Podcasts IA Ilimitados
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Plan Profesional
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Para podcasters recurrentes, newsletters y creadores que requieren producción continua sin límite de episodios.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ${proPrice}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  USD / mes {billingCycle === "annual" ? "· facturado anual" : "· facturado mensual"}
                </span>
              </div>
              <div className="text-[11px] text-[#1a73e8] dark:text-blue-300 mt-1 font-mono font-semibold">
                Generación Ilimitada de Podcasts con IA · $0 por episodio extra
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider font-mono">
                Todo lo de Free, más:
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 font-semibold text-slate-900 dark:text-white">
                  <InfinityIcon className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                  <span>Podcasts generados con IA ilimitados todos los meses</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Full Google Search Grounding y auditoría de reputación sin topes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Voces Neurales HD Multilingües con control de emoción y ritmo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Consola Broadcast Master FX (-16 LUFS EBU R128 + EQ de 3 bandas)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Generador de Storyboard Visual + Kit Social LinkedIn & X</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Sincronización Cloud en Firestore e historial de proyectos</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePlanClick("professional")}
            className="w-full py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Activar Podcasts Ilimitados (7 Días Gratis)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------- */}
        {/* TIER 3: ENTERPRISE (STUDIO ENTERPRISE)                  */}
        {/* ------------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                03. Nivel Corporativo · Enterprise
              </span>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                Multi-Show & API
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Studio Enterprise
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Para medios de comunicación, agencias de contenido y organizaciones con flujos de producción masiva.
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ${enterprisePrice}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  USD / mes {billingCycle === "annual" ? "· facturado anual" : "· facturado mensual"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Podcasts IA Ilimitados + Renderizado Batch Concurrente
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider font-mono">
                Todo lo de Profesional, más:
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 font-semibold text-slate-900 dark:text-white">
                  <InfinityIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>Podcasts con IA ilimitados para múltiples marcas y canales</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Renderizado Maestro en Lote (Batch AudioWAV 24kHz sin colas)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Perfiles de voz personalizados y glosario fonético de marca</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Exportación de paquetes completos (ZIP, PDF ejecutivo, JSON)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  <span>Control de roles (Admin/Editor), auditoría y soporte 24/7 SLA</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePlanClick("enterprise")}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>Desplegar Plan Enterprise</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ENTERPRISE & UNLIMITED GUARANTEE STRIP                    */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 px-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#34a853]" />
          <span>Sin contratos forzosos · Cancela o cambia de nivel en cualquier momento desde tu perfil.</span>
        </div>
        <div className="font-mono text-[11px] flex items-center gap-2">
          <span>Derechos comerciales 100% incluidos en todos los planes</span>
          <span aria-hidden="true">·</span>
          <span>Audio libre de regalías</span>
        </div>
      </div>
    </section>
  );
}
