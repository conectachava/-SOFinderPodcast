"use client";

import React from "react";
import { HelpCircle, X, Sparkles, BookOpen, CheckCircle, ArrowRight } from "lucide-react";
import { TabType } from "./Header";

interface HelpGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function HelpGuideDrawer({ isOpen, onClose, activeTab, setActiveTab }: HelpGuideDrawerProps) {
  if (!isOpen) return null;

  const getGuideContent = () => {
    switch (activeTab) {
      case "orchestrator":
        return {
          title: "Guía de Orquestador IA",
          badge: "Fase 1: Inteligencia & Investigación",
          description: "El Orquestador centraliza la investigación automatizada en tiempo real mediante Gemini y Google Search Grounding.",
          tips: [
            "Escribe un tema detallado o pulsa el botón 'Cargar TENDENCIAS' para analizar temas virales en tiempo real.",
            "Selecciona el tipo de contenido (Noticia, Análisis, Debate) para calibrar el tono editorial de las fuentes.",
            "Haz clic en 'Ejecutar Pipeline' para extraer URLs verificadas, calcular puntuaciones de fiabilidad y generar un informe maestro."
          ],
          nextTab: "sourcefinder",
          nextTabName: "Ver Fuente & Reporte"
        };
      case "sourcefinder":
        return {
          title: "Guía de Verificador de Fuentes",
          badge: "Fase 2: Auditoría y Hallazgos",
          description: "Evalúa la autenticidad, sesgo y citas exactas de los artículos web encontrados durante la investigación.",
          tips: [
            "Revisa el puntaje de credibilidad (ej. 98/100) para cada fuente auditada por la IA.",
            "Lee los hallazgos clave sintetizados en viñetas directas para el guion.",
            "Pulsa 'Enviar al Script Studio' cuando estés listo para redactar el diálogo."
          ],
          nextTab: "script",
          nextTabName: "Ir a Script Studio"
        };
      case "script":
        return {
          title: "Guía de Script Studio",
          badge: "Fase 3: Guion Multivoz",
          description: "Edita, reorganiza y personaliza las líneas de diálogo entre presentadores y expertos invitados.",
          tips: [
            "Utiliza el botón 'Generar con IA' para reescribir el guion bajo diferentes enfoques narrativos.",
            "Revisa el historial de versiones en la esquina superior para restaurar puntos de guardado anteriores.",
            "Activa el Modo Colaboración para simular comentarios de co-editores en tiempo real."
          ],
          nextTab: "studio",
          nextTabName: "Ir a Podcast Studio"
        };
      case "studio":
        return {
          title: "Guía de Podcast Studio",
          badge: "Fase 4: Consola de Audio & Masterización",
          description: "Reproduce el episodio con síntesis de voz, añade efectos ambientales (lluvia, café, sintes) y ajusta el limitador.",
          tips: [
            "Usa la barra de transporte para reproducir, pausar o saltar entre líneas del guion.",
            "Selecciona una textura o sonido ambiente en el panel lateral para dar inmersión profesional.",
            "Ajusta los parámetros de masterización (Glue, Compresión, Loudness LUFS) para preparar el archivo de exportación."
          ],
          nextTab: "storyboard",
          nextTabName: "Ver Storyboard Visual"
        };
      case "storyboard":
        return {
          title: "Guía de Storyboard Visual",
          badge: "Fase 5: Activos Multimedia",
          description: "Genera imágenes promocionales de portada, pancartas para redes sociales y marcas de capítulos.",
          tips: [
            "Utiliza los prompts sugeridos por IA para generar portadas de episodio llamativas.",
            "Copia los capítulos con marcas de tiempo para YouTube o Spotify."
          ],
          nextTab: "docs",
          nextTabName: "Ver Documentación API"
        };
      case "docs":
      default:
        return {
          title: "Guía de Documentación API & Arquitectura",
          badge: "Referencia Técnica",
          description: "Consulta los detalles de integración con Gemini API, esquemas de Firestore y especificaciones de audio.",
          tips: [
            "Explora los endpoints y los modelos recomendados (Gemini 2.5 Flash / Pro).",
            "Consulta las reglas de seguridad de Firestore para la sincronización multiusuario."
          ],
          nextTab: "orchestrator",
          nextTabName: "Volver al Inicio"
        };
    }
  };

  const guide = getGuideContent();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ayuda Contextual IA</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Detecta automáticamente tu pestaña activa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md text-xs font-mono font-bold">
            {guide.badge}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{guide.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{guide.description}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Mejores Prácticas & Tips
            </h4>
            <ul className="space-y-2.5">
              {guide.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-normal">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">¿Listo para avanzar en el pipeline?</p>
            <button
              onClick={() => {
                setActiveTab(guide.nextTab as TabType);
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{guide.nextTabName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            SourceFinder Pod AI Assistant • Asistencia en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
}
