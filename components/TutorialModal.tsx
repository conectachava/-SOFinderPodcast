"use client";

import React, { useState } from "react";
import { Sparkles, Search, FileText, Mic, CheckCircle2, ChevronRight, ChevronLeft, X } from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPipeline?: () => void;
}

export function TutorialModal({ isOpen, onClose, onStartPipeline }: TutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const STEPS = [
    {
      title: "Bienvenido a SourceFinder AI Studio v2.0",
      icon: Sparkles,
      description:
        "SourceFinder es una plataforma autónoma de investigación de inteligencia y producción de podcasts multivoz. Transforma un tema complejo en un show de radio con voces sincronizadas.",
      highlights: [
        "Pipeline orquestado en 4 etapas automatizadas",
        "Calificación estricta de reputación de fuentes (>0.6)",
        "Guionista automatizado con voces y acentos regionales",
        "Estudio de audio en vivo con sintetizador Gemini TTS HD",
      ],
    },
    {
      title: "Etapa 1: Agente SourceFinder (Investigación)",
      icon: Search,
      description:
        "El sub-agente SourceFinder realiza búsquedas ponderadas basadas en el tipo de contenido (Noticias Tecnológicas, Espectáculos, Análisis de Productos) y aplica un filtro de reputación.",
      highlights: [
        "Verifica frescura de información (48-72 hrs)",
        "Descarta titulares sensacionalistas y clickbait",
        "Genera un informe con Resumen Ejecutivo y Puntos Clave",
        "Incluye referencias web verificadas",
      ],
    },
    {
      title: "Etapa 2: Guionista Radiofónico v2.0",
      icon: FileText,
      description:
        "Convierte el informe de inteligencia en un guion estructurado para podcast entre un moderador elegante y entrevistados apasionados.",
      highlights: [
        "Asignación de roles: Moderador (Host) y Entrevistados (Callers)",
        "Etiquetado de acentos (Británico, Americano Midwest, etc.)",
        "Citas explícitas e ininterrumpidas de las fuentes",
        "Interrupciones naturales y expresiones radiofónicas",
      ],
    },
    {
      title: "Etapa 3: Podcast Studio Audio Deck",
      icon: Mic,
      description:
        "Transmite el show en vivo con reproducción sincrónica por líneas de diálogo, visualizador de onda en canvas y sintetizador de voz HD con Gemini.",
      highlights: [
        "Sincronización de voces con Web Speech API o Gemini TTS",
        "Mezclador de sonido ambiental y música de fondo",
        "Control de velocidad de reproducción (1x - 1.5x)",
        "Transcripción interactiva con resaltado en vivo",
      ],
    },
  ];

  const current = STEPS[stepIndex];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold border border-slate-700">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Paso {stepIndex + 1} de {STEPS.length}
              </span>
              <h3 className="text-base font-bold text-white leading-tight">{current.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 flex-1">
          <p className="text-xs text-slate-600 leading-relaxed">{current.description}</p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              Características Clave:
            </span>
            <ul className="space-y-2">
              {current.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          <div className="flex gap-1">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === stepIndex ? "bg-slate-900 w-4" : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {stepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1))}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onStartPipeline) onStartPipeline();
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md transition-all"
            >
              Comenzar Ahora <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
