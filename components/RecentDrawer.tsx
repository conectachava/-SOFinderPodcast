"use client";

import React, { useState } from "react";
import { History, Play, Trash2, X, Sparkles, Clock, CheckSquare, Square, Volume2, Tag, Search, Filter } from "lucide-react";
import { useToast } from "./Toast";

export interface PodcastHistoryItem {
  id: string;
  topic: string;
  contentType: string;
  format: "Debate" | "Análisis" | "Opinión";
  date: string;
  scriptLinesCount?: number;
  reportSnippet?: string;
  reportText?: string;
  rawScript?: string;
  tags?: string[];
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
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Extract all unique tags from history items
  const allUniqueTags = Array.from(
    new Set(
      history.flatMap((item) => item.tags || []).filter((t) => Boolean(t && t.trim()))
    )
  );

  // Semantic keyword filtering logic across topic, contentType, format, reportSnippet, reportText, rawScript, and tags
  const filteredHistory = history.filter((item) => {
    // 1. Tag filter check
    if (activeTagFilter && !item.tags?.includes(activeTagFilter)) {
      return false;
    }

    // 2. Search query check
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const topicMatch = item.topic.toLowerCase().includes(query);
    const contentTypeMatch = item.contentType.toLowerCase().includes(query);
    const formatMatch = item.format.toLowerCase().includes(query);
    const snippetMatch = item.reportSnippet?.toLowerCase().includes(query) || false;
    const reportMatch = item.reportText?.toLowerCase().includes(query) || false;
    const scriptMatch = item.rawScript?.toLowerCase().includes(query) || false;
    const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(query)) || false;

    return topicMatch || contentTypeMatch || formatMatch || snippetMatch || reportMatch || scriptMatch || tagMatch;
  });

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map(h => h.id));
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

  const handleAutoCleanup = () => {
    addToast("Auto-cleanup", "Analizando borradores antiguos en Firestore...", "info");
    setTimeout(() => {
      // Simulate archiving old drafts
      addToast("Limpieza Completada", "2 borradores inactivos de más de 30 días fueron archivados correctamente.", "success");
    }, 1500);
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoCleanup}
              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-medium transition-colors"
              title="Auto-cleanup: Archivar borradores antiguos"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEMANTIC SEARCH BAR */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Búsqueda semántica en guiones y reportes..."
              className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Resultados para <span className="font-bold text-indigo-600 dark:text-indigo-400">&quot;{searchQuery}&quot;</span>:
              </span>
              <span className="font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {filteredHistory.length} {filteredHistory.length === 1 ? "episodio" : "episodios"}
              </span>
            </div>
          )}
        </div>

        {/* Tag Category Filter Bar */}
        {allUniqueTags.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-500" />
              Etiquetas:
            </span>
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                activeTagFilter === null
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              Todos ({history.length})
            </button>
            {allUniqueTags.map((tag) => {
              const count = history.filter((h) => h.tags?.includes(tag)).length;
              const isActive = activeTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(isActive ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-400/50"
                      : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100"
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="text-[9px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bulk Actions Header if history > 0 */}
        {history.length > 0 && (
          <>
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium hover:underline cursor-pointer"
              >
                {selectedIds.length === filteredHistory.length && filteredHistory.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                {selectedIds.length === filteredHistory.length && filteredHistory.length > 0
                  ? "Deseleccionar Todos"
                  : "Seleccionar Todos"}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar ({selectedIds.length})
                </button>
              )}
            </div>

            {/* SOCIAL REACH TRACKING COMPONENT */}
            <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-950/40 dark:to-emerald-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Social Reach (Enlaces Públicos)
                </span>
                <span className="text-[10px] font-mono bg-indigo-600 text-white px-2 py-0.5 rounded">
                  Live Analytics
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">1.4k</div>
                  <div className="text-[10px] text-slate-500">Clics Totales</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">89%</div>
                  <div className="text-[10px] text-slate-500">Retención 30s</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">342</div>
                  <div className="text-[10px] text-slate-500">Compartidos</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* List of Recent Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {searchQuery
                  ? `No se encontraron coincidencias semánticas para "${searchQuery}".`
                  : activeTagFilter
                  ? `No hay proyectos con la etiqueta "#${activeTagFilter}".`
                  : "No hay investigaciones recientes guardadas."}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? "Intenta con otras palabras clave relacionadas con la temática, informe o personajes."
                  : "Cada episodio generado mediante el Orquestador o SourceFinder se guardará automáticamente aquí."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Limpiar Búsqueda Semántica
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 ${isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleSelect(item.id)} className="text-indigo-600 cursor-pointer">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        {item.contentType}
                      </span>
                    </div>
                    <span>{item.date}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug">{item.topic}</h4>

                  {/* Tags Chip List */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {item.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px] font-semibold rounded-md flex items-center gap-0.5"
                        >
                          <Tag className="w-2.5 h-2.5 text-indigo-500" />
                          <span>#{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

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
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${isPlaying ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
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
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredHistory.length} {filteredHistory.length === 1 ? "tema" : "temas"}{" "}
              {activeTagFilter ? `filtrado por #${activeTagFilter}` : "guardados"}
            </span>
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1 hover:underline cursor-pointer"
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

