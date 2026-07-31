"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, Radio, SkipForward, SkipBack, X, Sparkles } from "lucide-react";

interface MiniPlayerBarProps {
  currentTopic?: string;
  onOpenStudio?: () => void;
}

export function MiniPlayerBar({ currentTopic = "Último Podcast Generado: Lanzamiento NVIDIA Blackwell RTX 5090", onOpenStudio }: MiniPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((p) => (p >= 100 ? 0 : p + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    try {
      if (!isPlaying && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Reproduciendo muestra rápida del episodio: ${currentTopic}`);
        window.speechSynthesis.speak(utterance);
      } else if (isPlaying && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-40 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold hover:scale-105 transition-all"
        title="Mostrar Mini Reproductor"
      >
        <Radio className="w-4 h-4 animate-pulse text-amber-400" />
        <span>Mini Player</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl px-4 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-inner text-white font-bold">
            <Radio className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                Persistent Audio
              </span>
              <span className="text-[10px] text-slate-400">30s Sample</span>
            </div>
            <h4 className="text-xs font-bold truncate text-slate-100">{currentTopic}</h4>
          </div>
        </div>

        {/* Controls & Progress */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Retroceder 10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Adelantar 10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 w-48">
            <span className="text-[10px] font-mono text-slate-400">0:{Math.floor((progress * 30) / 100).toString().padStart(2, '0')}</span>
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">0:30</span>
          </div>
        </div>

        {/* Actions & Minimizer */}
        <div className="flex items-center gap-2">
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              Abrir Studio Completo
            </button>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Minimizar reproductor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
