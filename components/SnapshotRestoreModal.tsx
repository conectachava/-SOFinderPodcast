"use client";

import React from "react";
import { History, X, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import { useToast } from "./Toast";

export interface ProjectSnapshot {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  author: string;
}

interface SnapshotRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (snapshot: ProjectSnapshot) => void;
}

export function SnapshotRestoreModal({ isOpen, onClose, onRestore }: SnapshotRestoreModalProps) {
  const { addToast } = useToast();

  if (!isOpen) return null;

  const snapshots: ProjectSnapshot[] = [
    {
      id: "snap-1",
      timestamp: "Hace 5 minutos (Auto-save)",
      title: "Procesador Quantum Gemini & Computación Cuántica",
      summary: "Versión con 4 intervenciones de locutores y storyboard de 4 escenas.",
      author: "Sistema (Auto-guardado)"
    },
    {
      id: "snap-2",
      timestamp: "Hace 2 horas",
      title: "Lanzamiento Vehículos Autónomos 2026",
      summary: "Borrador de debate con análisis de fuentes tecnológicas de alta reputación.",
      author: "Usuario (vsnrylabs@gmail.com)"
    },
    {
      id: "snap-3",
      timestamp: "Ayer, 18:45",
      title: "Economía Global y Criptoactivos",
      summary: "Versión inicial del pipeline con 3 fuentes verificadas.",
      author: "Sistema (Auto-guardado)"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Restauración de Instantáneas (Snapshot Restore)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revierte a versiones anteriores guardadas automáticamente en Firestore</p>
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
          {snapshots.map((snap) => (
            <div key={snap.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-3 h-3" />
                  <span>{snap.timestamp}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{snap.author}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{snap.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{snap.summary}</p>
              </div>

              <button
                onClick={() => {
                  onRestore(snap);
                  addToast("Instantánea Restaurada", `Se ha revertido al estado: "${snap.title}"`, "success");
                  onClose();
                }}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Sincronización en la nube activa
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
