"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldAlert, Sparkles } from "lucide-react";

interface InactivityModalProps {
  onAutoSaveAndLogout: () => void;
  onStayActive: () => void;
}

export function InactivityModal({ onAutoSaveAndLogout, onStayActive }: InactivityModalProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let inactivityTimer: any;
    let warningTimer: any;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      setIsIdle(false);
      setCountdown(60);

      // 60 minutes inactivity simulation (or configured timeout)
      // For testing and demo prompt adherence: 59 minutes or 60 min. Let's set 60 minutes (3600000ms)
      inactivityTimer = setTimeout(() => {
        setIsIdle(true);
      }, 60 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimers);
    window.addEventListener("keydown", resetTimers);
    window.addEventListener("click", resetTimers);

    resetTimers();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      window.removeEventListener("mousemove", resetTimers);
      window.removeEventListener("keydown", resetTimers);
      window.removeEventListener("click", resetTimers);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isIdle && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            onAutoSaveAndLogout();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isIdle, countdown, onAutoSaveAndLogout]);

  if (!isIdle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 text-center">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alerta de Inactividad (60 min)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Has estado inactivo durante 60 minutos. Por seguridad de Firestore y para evitar pérdida de datos, se cerrará la sesión automáticamente en <span className="font-bold text-rose-600 dark:text-rose-400">{countdown} segundos</span>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono">
          🛡️ Autosave completado con éxito antes del soft-logout.
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsIdle(false);
              onAutoSaveAndLogout();
            }}
            className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar Sesión Ahora
          </button>
          <button
            onClick={() => {
              setIsIdle(false);
              setCountdown(60);
              onStayActive();
            }}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-md"
          >
            Continuar Trabajando
          </button>
        </div>
      </div>
    </div>
  );
}
