"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  Radio,
  Award,
  TrendingUp,
  ArrowRight,
  Mic,
  Globe,
} from "lucide-react";

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  organization: string;
  category: string;
  impactMetric: string;
  episodesProduced: string;
  presetTopic: string;
  presetFormat: "Debate" | "Análisis" | "Opinión";
}

interface LandingSocialProofProps {
  onSelectPreset?: (preset: {
    topic: string;
    contentType: string;
    format: "Debate" | "Análisis" | "Opinión";
  }) => void;
  onStartNow: () => void;
}

const TRUSTED_ORGANIZATIONS = [
  {
    name: "Pulso Financiero LatAm",
    sector: "Medios & Finanzas",
    metric: "Daily Briefing",
  },
  {
    name: "BioTech Insights Journal",
    sector: "Divulgación Científica",
    metric: "Peer-Grounded",
  },
  {
    name: "VSNRY Media Lab",
    sector: "Red de Podcasts",
    metric: "-16 LUFS Master",
  },
  {
    name: "Observatorio IA Global",
    sector: "Investigación Tech",
    metric: "99.4% Citas",
  },
  {
    name: "Cátedra Abierta STEM",
    sector: "Educación Superior",
    metric: "Multivoz HD",
  },
  {
    name: "Estrategia B2B Studio",
    sector: "Comunicación Ejecutiva",
    metric: "LinkedIn & X Ready",
  },
];

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "pulso-financiero",
    quote:
      "Pasamos de invertir 14 horas semanales investigando y editando audio a publicar un debate financiero diario antes de la apertura de mercados. El fact-checking con Google Search Grounding cita cada indicador con precisión quirúrgica.",
    author: "Elena Valdés",
    role: "Directora Editorial",
    organization: "Pulso Financiero LatAm",
    category: "Medios & Newsletters",
    impactMetric: "-88% tiempo de producción",
    episodesProduced: "180+ episodios publicados",
    presetTopic: "Impacto de Tasas de Interés y Mercados Emergentes 2026",
    presetFormat: "Debate",
  },
  {
    id: "biotech-insights",
    quote:
      "Otros generadores de voz inventaban referencias científicas o sonaban robóticos. SourceFinder Pod valida cada paper en tiempo real y genera una conversación entre moderador y especialista con nivel de estudio profesional.",
    author: "Dr. Marcos Arancibia",
    role: "Investigador Principal & Host",
    organization: "BioTech Insights Journal",
    category: "Divulgación Científica",
    impactMetric: "99.6% veracidad en citas",
    episodesProduced: "95+ episodios técnicos",
    presetTopic: "Edición Genética CRISPR y Terapias de Longevidad Celular",
    presetFormat: "Análisis",
  },
  {
    id: "vsnry-media",
    quote:
      "La combinación de podcasts ilimitados con el visualizador de onda en tiempo real, masterización automática a -16 LUFS y tarjetas listas para LinkedIn y X reemplazó cuatro suscripciones distintas en nuestra agencia.",
    author: "Javier Montesinos",
    role: "Productor Ejecutivo",
    organization: "VSNRY Media Lab",
    category: "Agencias de Contenido",
    impactMetric: "$4,200 USD/mes ahorrados",
    episodesProduced: "340+ episodios para clientes",
    presetTopic: "Arquitectura de Agentes Autónomos en Empresas Enterprise",
    presetFormat: "Opinión",
  },
  {
    id: "catedra-stem",
    quote:
      "Transformamos nuestros artículos académicos y boletines universitarios en episodios dinámicos en menos de 3 minutos. Los estudiantes retienen el doble de información gracias al formato de diálogo multivoz.",
    author: "Dra. Sofía Mendizábal",
    role: "Coordinadora de Innovación Docente",
    organization: "Cátedra Abierta STEM",
    category: "Educación & Academia",
    impactMetric: "2.4x retención de audiencia",
    episodesProduced: "120+ cápsulas educativas",
    presetTopic: "Computación Cuántica Aplicada a Nuevos Materiales",
    presetFormat: "Análisis",
  },
];

export function LandingSocialProof({ onSelectPreset, onStartNow }: LandingSocialProofProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const activeTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section
      aria-label="Respaldo editorial y testimonios verificados"
      className="space-y-8 py-4"
    >
      {/* ========================================================= */}
      {/* 1. "TRUSTED BY" CREDIBILITY BAR & SOCIAL PROOF BADGES     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Top Row: Trust Verification Badges */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/70 pb-5">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <ShieldCheck className="w-5 h-5 text-[#34a853] shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Confiado por Equipos Editoriales, Investigadores y Creadores
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Producción verificada con estándares de radiodifusión digital y auditoría de fuentes en tiempo real
              </p>
            </div>
          </div>

          {/* Clean Structured Social Proof Credentials */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-500" aria-label="Calificación 4.9 de 5 estrellas">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white font-mono">4.9/5</span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-500 dark:text-slate-400">+2,400 episodios auditados</span>
            </div>

            <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34a853]" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Google Grounding Verificado</span>
            </div>

            <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Radio className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Norma -16 LUFS EBU R128</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Trusted By Organizations Grid */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
            Utilizado diariamente en redacciones, laboratorios de medios y estudios de podcasting
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TRUSTED_ORGANIZATIONS.map((org) => (
              <div
                key={org.name}
                className="px-3.5 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between hover:border-[#1a73e8]/50 transition-colors"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
                  {org.name}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="truncate">{org.sector}</span>
                  <span className="text-[#1a73e8] dark:text-blue-400 font-semibold shrink-0 ml-1">
                    {org.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. INTERACTIVE TESTIMONIAL CAROUSEL                       */}
      {/* ========================================================= */}
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header Bar with Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/80 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#1a73e8] dark:text-blue-400 font-bold">
              <Award className="w-4 h-4" />
              <span>Historias de Éxito en Producción Real</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              Por qué creadores y medios migran a SourceFinder Pod
            </h3>
          </div>

          {/* Selector Tabs + Prev/Next Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {TESTIMONIALS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    idx === currentIndex
                      ? "bg-white dark:bg-slate-800 text-[#1a73e8] dark:text-blue-300 shadow-2xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {item.category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Testimonio anterior"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Siguiente testimonio"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Carousel Slide Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Quote & Author Column */}
          <div className="lg:col-span-8 space-y-5">
            <div className="relative">
              <Quote className="w-8 h-8 text-[#1a73e8]/15 dark:text-blue-400/15 absolute -top-2 -left-1 pointer-events-none" />
              <blockquote className="pl-6 text-sm sm:text-base lg:text-lg text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                &ldquo;{activeTestimonial.quote}&rdquo;
              </blockquote>
            </div>

            <div className="pl-6 flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a73e8]/10 dark:bg-blue-500/20 border border-[#1a73e8]/30 flex items-center justify-center text-[#1a73e8] dark:text-blue-300 font-bold text-sm font-mono">
                  {activeTestimonial.author
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{activeTestimonial.author}</span>
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="text-xs font-normal text-[#1a73e8] dark:text-blue-300 font-mono">
                      {activeTestimonial.organization}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTestimonial.role} · {activeTestimonial.category}
                  </div>
                </div>
              </div>

              {/* Clean unboxed impact metadata */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                <TrendingUp className="w-3.5 h-3.5 text-[#34a853]" />
                <span className="font-bold text-[#34a853]">{activeTestimonial.impactMetric}</span>
                <span aria-hidden="true">·</span>
                <span>{activeTestimonial.episodesProduced}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Production Card & 1-Click Preset Trigger */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
              <span>PLANTILLA DE ESTE EQUIPO</span>
              <span className="font-bold text-[#1a73e8] dark:text-blue-400">
                Formato {activeTestimonial.presetFormat}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono uppercase">Tema de ejemplo verificado:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                &ldquo;{activeTestimonial.presetTopic}&rdquo;
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
              <Mic className="w-3.5 h-3.5 text-[#34a853]" />
              <span>Grounding en vivo · 2 Locutores HD · -16 LUFS</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSelectPreset) {
                  onSelectPreset({
                    topic: activeTestimonial.presetTopic,
                    contentType: activeTestimonial.category,
                    format: activeTestimonial.presetFormat,
                  });
                } else {
                  onStartNow();
                }
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Probar esta Plantilla en el Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Progress Dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {TESTIMONIALS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir al testimonio ${idx + 1}: ${item.organization}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? "w-8 bg-[#1a73e8]"
                  : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
