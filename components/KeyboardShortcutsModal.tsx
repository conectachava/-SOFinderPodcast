"use client";

import React from "react";
import { Command, X, Sparkles, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + S / Cmd + S", desc: "Sincronizar y guardar borrador actual en Firestore" },
    { key: "Alt + 1", desc: "Ir a Orquestador IA" },
    { key: "Alt + 2", desc: "Ir a SourceFinder (Auditoría de Fuentes)" },
    { key: "Alt + 3", desc: "Ir a Script Studio (Editor Multivoz)" },
    { key: "Alt + 4", desc: "Ir a Podcast Studio (Consola de Audio)" },
    { key: "Alt + 5", desc: "Ir a Storyboard Visual" },
    { key: "Space", desc: "Reproducir / Pausar audio del Mini Player" },
    { key: "Esc", desc: "Cerrar modales y paneles laterales activos" },
    { key: "?", desc: "Abrir este atajo de teclado de ayuda" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Atajos de Teclado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Navegación rápida y comandos de estudio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-700 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
