"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Activity, WifiOff, AlertTriangle, CheckCircle2, RefreshCw, X } from "lucide-react";

export type SystemState = "idle" | "processing" | "network_error" | "server_error";

interface SystemStatusContextType {
  status: SystemState;
  statusMessage: string | null;
  setStatus: (status: SystemState, message?: string | null) => void;
  clearStatus: () => void;
}

const SystemStatusContext = createContext<SystemStatusContextType>({
  status: "idle",
  statusMessage: null,
  setStatus: () => {},
  clearStatus: () => {},
});

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<SystemState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Monitor online / offline events automatically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setStatusState("network_error");
      setStatusMessage("Sin conexión a internet. Verifique su red local.");
    };

    const handleOnline = () => {
      setStatusState("idle");
      setStatusMessage(null);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const setStatus = (newStatus: SystemState, message: string | null = null) => {
    setStatusState(newStatus);
    setStatusMessage(message);
  };

  const clearStatus = () => {
    setStatusState("idle");
    setStatusMessage(null);
  };

  return (
    <SystemStatusContext.Provider value={{ status, statusMessage, setStatus, clearStatus }}>
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatus() {
  return useContext(SystemStatusContext);
}

export function SystemStatusBanner() {
  const { status, statusMessage, clearStatus } = useSystemStatus();

  if (status === "idle" || !status) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4">
      <div
        className={`p-3 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-xl transition-all ${
          status === "processing"
            ? "bg-indigo-950/90 text-indigo-100 border-indigo-700/80 shadow-indigo-950/40"
            : status === "network_error"
            ? "bg-amber-950/90 text-amber-100 border-amber-700/80 shadow-amber-950/40"
            : "bg-rose-950/90 text-rose-100 border-rose-700/80 shadow-rose-950/40"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {status === "processing" && (
            <div className="w-6 h-6 rounded-lg bg-indigo-600/50 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}

          {status === "network_error" && (
            <div className="w-6 h-6 rounded-lg bg-amber-600/50 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
          )}

          {status === "server_error" && (
            <div className="w-6 h-6 rounded-lg bg-rose-600/50 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="truncate">
            <span className="font-bold mr-1.5 uppercase tracking-wide font-mono text-[10px] opacity-80">
              {status === "processing"
                ? "Procesando Información"
                : status === "network_error"
                ? "Error de Red"
                : "Error de Servidor"}
            </span>
            <span className="font-normal">{statusMessage || "Ejecutando operaciones en segundo plano..."}</span>
          </div>
        </div>

        <button
          onClick={clearStatus}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 text-white/70 hover:text-white"
          title="Ocultar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
