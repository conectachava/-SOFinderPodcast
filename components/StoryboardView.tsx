"use client";

import React, { useState } from "react";
import { Film, User, Sparkles, Copy, Check, Video, ArrowRight, Play, Eye } from "lucide-react";
import type { StoryboardData } from "@/app/api/storyboard/route";
import { useToast } from "./Toast";

interface StoryboardViewProps {
  storyboardData?: StoryboardData | null;
  scriptText?: string;
  onGenerateStoryboard?: () => void;
  isLoading?: boolean;
}

export function StoryboardView({
  storyboardData,
  scriptText,
  onGenerateStoryboard,
  isLoading = false,
}: StoryboardViewProps) {
  const { addToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast("Copiado", "Prompt copiado al portapapeles para Flow Video.", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-300 dark:border-pink-800 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Generando Storyboard de Video para Flow...</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Analizando el guion de podcast, definiendo modelos de personajes 3D/fotorrealistas y desglosando escenas dinámicas con movimiento de cámara.
        </p>
      </div>
    );
  }

  if (!storyboardData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Storyboard de Video no generado aún</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Ejecuta el pipeline del Orquestador o haz clic en el botón a continuación para estructurar las tarjetas de personajes y escenas de Flow Video.
        </p>
        {onGenerateStoryboard && (
          <button
            onClick={onGenerateStoryboard}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generar Storyboard Visual (Flow Video)
          </button>
        )}
      </div>
    );
  }

  const { characters, scenes } = storyboardData;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-xl border border-purple-900/50 text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Storyboard Visual para Flow / AI Video</h2>
              <p className="text-xs text-purple-200/80">
                Prompts de consistencia de personajes e indicaciones de movimiento de cámara para producción de video AI.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-pink-500/10 text-pink-300 border border-pink-500/30 rounded text-xs font-mono font-bold">
            Flow Video v1.0
          </span>
        </div>
      </div>

      {/* Characters Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-pink-500" />
            Consistencia de Personajes (Character Models)
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">35mm Lens • Photorealistic</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(characters).map(([name, prompt]) => (
            <div
              key={name}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    {name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                    16:9
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed line-clamp-4 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                  {prompt}
                </p>
              </div>

              <button
                onClick={() => handleCopy(prompt, `char-${name}`)}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              >
                {copiedKey === `char-${name}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Character Prompt
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Video Scenes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-500" />
            Desglose de Escenas y Movimientos de Cámara
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">{scenes.length} Escenas de Video</span>
        </div>

        <div className="space-y-3">
          {scenes.map((scene) => (
            <div
              key={scene.scene_id}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between text-xs gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold font-mono rounded text-[10px]">
                    Escena #{scene.scene_id}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{scene.speaker}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold rounded text-[10px]">
                    {scene.visual_type}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono rounded text-[10px]">
                    Transición: {scene.transition}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Flow Video Prompt:
                  </label>
                  <p className="font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                    {scene.flow_video_prompt}
                  </p>
                </div>

                <div className="space-y-2 flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Audio Cue:
                    </label>
                    <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                      &quot;{scene.audio_cue}&quot;
                    </p>
                    {scene.effects && scene.effects !== "None" && (
                      <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                        Efectos: {scene.effects}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(scene.flow_video_prompt, `scene-${scene.scene_id}`)}
                    className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors border border-purple-200 dark:border-purple-800"
                  >
                    {copiedKey === `scene-${scene.scene_id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Prompt Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Prompt Escena
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
