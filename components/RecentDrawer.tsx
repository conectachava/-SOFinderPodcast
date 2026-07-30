"use client";

import React from "react";
import { History, Play, Trash2, X, Sparkles, Clock } from "lucide-react";

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
}

export function RecentDrawer({
  isOpen,
  onClose,
  history,
  onSelectTopic,
  onClearHistory,
}: RecentDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Historial de Podcasts & Investigaciones</h3>
              <p className="text-[11px] text-slate-500">Re-ejecuta temas anteriores con 1-clic</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-400 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {item.contentType}
                  </span>
                  <span>{item.date}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-xs leading-snug">{item.topic}</h4>

                {item.reportSnippet && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">{item.reportSnippet}</p>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Formato: {item.format}
                  </span>

                  <button
                    onClick={() => {
                      onSelectTopic(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Re-ejecutar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">{history.length} temas guardados</span>
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
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
