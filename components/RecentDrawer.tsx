"use client";

import React, { useState } from "react";
import { History, Play, Trash2, X, Sparkles, Clock, CheckSquare, Square, Volume2, Square as StopIcon } from "lucide-react";
import { useToast } from "./Toast";

export interface PodcastHistoryItem {
  id: string;
  topic: string;
  contentType: string;
  format: "Debate" | "Análisis" | "Opinión";
  date: string;
  scriptLinesCount?: number;
  reportSnippet?: string;
}

interface RecentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PodcastHistoryItem[];
  onSelectTopic: (item: PodcastHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItems?: (ids: string[]) => void;
}

export function RecentDrawer({
  isOpen,
  onClose,
  history,
  onSelectTopic,
  onClearHistory,
  onDeleteItems,
}: RecentDrawerProps) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(h => h.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteItems) {
      onDeleteItems(selectedIds);
    }
    setSelectedIds([]);
    addToast("Elementos Eliminados", "Se eliminaron los elementos seleccionados del historial.", "success");
  };

  const handleQuickPlay = (item: PodcastHistoryItem) => {
    if (playingId === item.id) {
      setPlayingId(null);
      addToast("Reproductor", "Muestra de 30s detenida.", "info");
      return;
    }

    setPlayingId(item.id);
    addToast("Quick Play (30s)", `Reproduciendo muestra sintetizada para: "${item.topic}"`, "success");

    // Simulate 30s sample playback with Web Audio or Speech
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Muestra de treinta segundos para el episodio: ${item.topic}. Formato ${item.format}.`);
        utterance.rate = 1.0;
        utterance.onend = () => setPlayingId(null);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setPlayingId((current) => (current === item.id ? null : current));
    }, 30000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right transition-colors">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Historial de Podcasts & Investigaciones</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Re-ejecuta temas anteriores con 1-clic</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Actions Header if history > 0 */}
        {history.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium hover:underline"
            >
              {selectedIds.length === history.length ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              {selectedIds.length === history.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar ({selectedIds.length})
              </button>
            )}
          </div>
        )}

        {/* List of Recent Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium">No hay investigaciones recientes guardadas.</p>
              <p className="text-[11px] text-slate-500">
                Cada episodio generado mediante el Orquestador o SourceFinder se guardará automáticamente aquí.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 ${isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleSelect(item.id)} className="text-indigo-600">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        {item.contentType}
                      </span>
                    </div>
                    <span>{item.date}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug">{item.topic}</h4>

                  {item.reportSnippet && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">{item.reportSnippet}</p>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      Formato: {item.format}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickPlay(item)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${isPlaying ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
                        title="Quick Play: Escucha una muestra de 30s de este episodio"
                      >
                        {isPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        {isPlaying ? "Reproduciendo..." : "Quick Play"}
                      </button>

                      <button
                        onClick={() => {
                          onSelectTopic(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        Re-ejecutar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{history.length} temas guardados</span>
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar Historial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
