"use client";

import React, { useState } from "react";
import { BookOpen, Terminal, Cpu, FileCode2, Layers, CheckCircle2 } from "lucide-react";

export function DocsView() {
  const [activeTab, setActiveTab] = useState<"manual" | "sourcefinder" | "guionista" | "orchestrator">("manual");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "manual"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Manual de Despliegue v2.0
        </button>

        <button
          onClick={() => setActiveTab("sourcefinder")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "sourcefinder"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Agente SourceFinder
        </button>

        <button
          onClick={() => setActiveTab("guionista")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "guionista"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          Agente Guionista v2.0
        </button>

        <button
          onClick={() => setActiveTab("orchestrator")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "orchestrator"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Orquestador Principal
        </button>
      </div>

      {activeTab === "manual" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Manual de Despliegue y Operación: Plataforma de Podcasts Automatizados v2.0
            </h2>
            <p className="text-sm text-slate-600">
              Versión: 2.0 | Autor: Arquitecto de Ecosistemas de IA | Runtime: Google Gemini AI & Next.js
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                1. Requisitos del Sistema
              </h3>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                <li>Sistema Operativo: Linux (Ubuntu 22.04+) o macOS</li>
                <li>Intérprete: Node.js 18+ / Python 3.10+</li>
                <li>Librerías: ffmpeg, Web Audio Synthesis</li>
                <li>Clave API: GEMINI_API_KEY configurada en runtime</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                2. Módulos Pipeline
              </h3>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                <li><code>source_finder.py</code>: Búsqueda y filtrado de reputación</li>
                <li><code>generate_script_v2.py</code>: Guionista con citación de fuentes</li>
                <li><code>generate_tts.py</code>: Sintetizador multivoz Gemini TTS</li>
                <li><code>mix_audio.py</code>: Mezclador con ducking de música ambiental</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <p className="text-emerald-400"># Comando de Ejecución vía Orquestador CLI:</p>
            <p className="mt-1">
              python3 main_orchestrator.py --topic &quot;NVIDIA RTX 5090 Blackwell&quot; --content_type &quot;Análisis de Producto&quot; --format &quot;Análisis&quot; --workspace &quot;podcast_workspace&quot;
            </p>
          </div>
        </div>
      )}

      {activeTab === "sourcefinder" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Especificación de Agente: SourceFinder v1.0</h2>
          <p className="text-sm text-slate-600">
            Sub-agente experto en investigación y calificación de fuentes. Aplica filtros de reputación (&gt;0.6 trust) y genera dossiers estructurados en Markdown.
          </p>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono space-y-2 text-slate-800">
            <p className="font-semibold text-indigo-600">Estrategias de Búsqueda Disponibles:</p>
            <p>1. Noticia Tecnológica (Query modifier: &quot;noticia tecnología última hora reportes&quot; | Min Rep: 0.7)</p>
            <p>2. Espectáculos (Query modifier: &quot;espectáculos entretenimiento noticias&quot; | Min Rep: 0.6)</p>
            <p>3. Análisis de Producto (Query modifier: &quot;review análisis especificaciones pruebas&quot; | Min Rep: 0.5)</p>
            <p>4. Movie Review (Query modifier: &quot;movie review&quot; | Min Rep: 0.6)</p>
            <p>5. General / Explicativo (Query modifier: &quot;informe noticias contexto&quot; | Min Rep: 0.5)</p>
            <p>2. Filtro de Frescura (24h - 72h para noticias recientes)</p>
            <p>3. Detección Anticlickbait (Filtra mayúsculas excesivas y promesas engañosas)</p>
            <p>4. Generación del Reporte (Resumen Ejecutivo, Puntos Clave, Debate, Fuentes)</p>
          </div>
        </div>
      )}

      {activeTab === "guionista" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Especificación de Agente: Guionista v2.0</h2>
          <p className="text-sm text-slate-600">
            Productor y Guionista de Radio que transforma el dossier de inteligencia en un guion estructurado con el moderador Paul y callers con acentos y expresiones naturales.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <span className="font-bold text-indigo-900 block mb-1">Paul (Host)</span>
              <p className="text-indigo-700">Moderador británico, tono calmado y profesional. Presenta y coordina a cada caller por nombre y ubicación.</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="font-bold text-emerald-900 block mb-1">Callers (Smart Amateurs)</span>
              <p className="text-emerald-700">Etiquetados con género y acento en su primera aparición. Utilizan muletillas naturales (&quot;uhm&quot;, &quot;pues...&quot;, &quot;de hecho&quot;).</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <span className="font-bold text-amber-900 block mb-1">Cita Obligatoria de Fuentes</span>
              <p className="text-amber-700">Cita explícitamente las fuentes verificadas (ej. &quot;Según un reporte de The Verge...&quot;).</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orchestrator" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Orquestador End-to-End</h2>
          <p className="text-sm text-slate-600">
            Coordina de forma secuencial y automatizada todos los pasos desde la solicitud inicial del usuario hasta la publicación final del archivo MP3 del podcast.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-2 text-xs">
            <div className="flex-1 p-3 bg-slate-100 rounded-lg text-center font-medium">1. Intelligence Gathering</div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="flex-1 p-3 bg-slate-100 rounded-lg text-center font-medium">2. Source Qualification</div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="flex-1 p-3 bg-slate-100 rounded-lg text-center font-medium">3. Script v2.0 Writing</div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="flex-1 p-3 bg-slate-100 rounded-lg text-center font-medium">4. Gemini TTS Voice</div>
            <div className="text-slate-400 font-bold">→</div>
            <div className="flex-1 p-3 bg-indigo-600 text-white rounded-lg text-center font-bold">5. Final Audio Episode</div>
          </div>
        </div>
      )}
    </div>
  );
}
