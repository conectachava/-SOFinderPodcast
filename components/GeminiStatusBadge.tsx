"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, CheckCircle2, XCircle, RefreshCw, Cpu, AlertTriangle, Zap } from "lucide-react";
import { safeFetchJson } from "@/lib/utils";

export interface GeminiApiStatus {
  status: "checking" | "online" | "error";
  latencyMs: number | null;
  errorMsg: string | null;
  modelTested: string;
  hasApiKeyEnv: boolean;
  apiKeyMasked: string;
  lastCheckedAt: string | null;
}

interface GeminiStatusBadgeProps {
  variant?: "compact" | "detailed" | "console";
  onOpenDiagnostic?: () => void;
  autoRefreshMs?: number; // default 90000 (90s)
  className?: string;
}

export function GeminiStatusBadge({
  variant = "compact",
  onOpenDiagnostic,
  autoRefreshMs = 90000,
  className = "",
}: GeminiStatusBadgeProps) {
  const [apiState, setApiState] = useState<GeminiApiStatus>({
    status: "checking",
    latencyMs: null,
    errorMsg: null,
    modelTested: "gemini-2.5-flash",
    hasApiKeyEnv: false,
    apiKeyMasked: "...",
    lastCheckedAt: null,
  });

  const checkGeminiStatus = useCallback(async () => {
    setApiState((prev) => ({ ...prev, status: "checking" }));
    const startTime = Date.now();
    try {
      const preferredModel =
        (typeof window !== "undefined" && localStorage.getItem("sf_preferred_gemini_model")) ||
        "gemini-2.5-flash";

      const res = await safeFetchJson("/api/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: preferredModel }),
      });

      const latencyMs = Date.now() - startTime;

      if (res.ok && res.data && res.data.ok) {
        setApiState({
          status: "online",
          latencyMs: res.data.latencyMs || latencyMs,
          errorMsg: null,
          modelTested: res.data.modelTested || preferredModel,
          hasApiKeyEnv: res.data.hasApiKeyEnv ?? true,
          apiKeyMasked: res.data.apiKeyMasked || "...",
          lastCheckedAt: new Date().toLocaleTimeString(),
        });
      } else {
        const errorText =
          res.data?.error || res.error || "Fallo al verificar respuesta de Gemini API.";
        setApiState({
          status: "error",
          latencyMs: res.data?.latencyMs || latencyMs,
          errorMsg: errorText,
          modelTested: res.data?.modelTested || preferredModel,
          hasApiKeyEnv: res.data?.hasApiKeyEnv ?? false,
          apiKeyMasked: res.data?.apiKeyMasked || "No configurada",
          lastCheckedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setApiState({
        status: "error",
        latencyMs: Date.now() - startTime,
        errorMsg: err?.message || "Excepción de red al hacer ping.",
        modelTested: "gemini-2.5-flash",
        hasApiKeyEnv: false,
        apiKeyMasked: "Desconocido",
        lastCheckedAt: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkGeminiStatus();
    if (autoRefreshMs > 0) {
      const timer = setInterval(() => {
        checkGeminiStatus();
      }, autoRefreshMs);
      return () => clearInterval(timer);
    }
  }, [checkGeminiStatus, autoRefreshMs]);

  // Handle click on badge
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDiagnostic) {
      onOpenDiagnostic();
    } else {
      checkGeminiStatus();
    }
  };

  // Compact badge for Navbar / Header
  if (variant === "compact") {
    return (
      <div
        onClick={handleClick}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer transition-all duration-200 border shadow-2xs ${
          apiState.status === "checking"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            : apiState.status === "online"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 animate-pulse"
        } ${className}`}
        title={`Estado de Gemini API: ${
          apiState.status === "online"
            ? `Operativo (${apiState.modelTested}, ${apiState.latencyMs}ms)`
            : apiState.status === "error"
            ? `Error: ${apiState.errorMsg}`
            : "Verificando..."
        }. Clic para abrir el panel de diagnóstico.`}
      >
        <div className="relative flex items-center justify-center">
          {apiState.status === "checking" ? (
            <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
          ) : apiState.status === "online" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </>
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          )}
        </div>

        <span className="font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
          {apiState.status === "checking" && <span>Gemini: Ping...</span>}
          {apiState.status === "online" && (
            <span>
              Gemini OK <span className="opacity-70 font-normal">({apiState.latencyMs}ms)</span>
            </span>
          )}
          {apiState.status === "error" && <span>Gemini: Fallo Clave</span>}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            checkGeminiStatus();
          }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
          title="Re-ping ahora"
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  // Console / Health Dashboard badge
  if (variant === "console") {
    return (
      <div
        className={`flex items-center justify-between p-2 rounded-lg border text-[11px] font-mono transition-colors ${
          apiState.status === "checking"
            ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
            : apiState.status === "online"
            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
            : "bg-rose-950/40 border-rose-800/80 text-rose-300"
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {apiState.status === "checking" ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : apiState.status === "online" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}

          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>Google Gemini API:</span>
              <span className="uppercase tracking-wider">
                {apiState.status === "online"
                  ? "ONLINE"
                  : apiState.status === "error"
                  ? "ERROR"
                  : "PING..."}
              </span>
              {apiState.latencyMs && (
                <span className="text-[10px] opacity-75">({apiState.latencyMs}ms)</span>
              )}
            </div>
            <div className="text-[10px] opacity-80">
              Modelo: {apiState.modelTested} | Clave API: {apiState.apiKeyMasked}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={checkGeminiStatus}
            disabled={apiState.status === "checking"}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Volver a probar ping"
          >
            <RefreshCw
              className={`w-3 h-3 ${apiState.status === "checking" ? "animate-spin" : ""}`}
            />
            <span>Ping</span>
          </button>

          {onOpenDiagnostic && (
            <button
              onClick={onOpenDiagnostic}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Cpu className="w-3 h-3" />
              <span>Diagnóstico</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Detailed Card variant
  return (
    <div
      className={`p-3 rounded-xl border space-y-2 text-xs transition-colors ${
        apiState.status === "checking"
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-100"
          : apiState.status === "online"
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-100"
          : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-100"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {apiState.status === "checking" ? (
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
          ) : apiState.status === "online" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500" />
          )}
          <span className="font-bold text-sm">
            Estado Gemini API:{" "}
            {apiState.status === "online"
              ? "Activo & Operativo"
              : apiState.status === "error"
              ? "Fallo de Autenticación / API"
              : "Comprobando..."}
          </span>
        </div>

        <button
          onClick={checkGeminiStatus}
          className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
          title="Actualizar estado de conexión"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${apiState.status === "checking" ? "animate-spin" : ""}`} />
        </button>
      </div>

      {apiState.errorMsg && (
        <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300">
          {apiState.errorMsg}
        </p>
      )}

      <div className="flex items-center justify-between text-[10px] font-mono opacity-80 pt-1 border-t border-current/10">
        <span>Modelo: {apiState.modelTested}</span>
        <span>Última revisión: {apiState.lastCheckedAt || "Ahora"}</span>
      </div>
    </div>
  );
}
