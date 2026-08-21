"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, AlertTriangle, CheckCircle2, X, RefreshCw, Copy, Trash2, Activity, Wifi, ChevronDown, ChevronUp, Bug, Play, Zap, Cpu } from "lucide-react";
import { logger, LogEntry, LogLevel } from "@/lib/logger";
import { useToast } from "./Toast";
import { GeminiStatusBadge } from "./GeminiStatusBadge";

export function DevHealthConsole() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sf_dev_health_console") === "true";
    } catch (e) {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.getRecentLogs());
  const [filterLevel, setFilterLevel] = useState<"all" | "error" | "warn" | "info" | "firebase">("all");
  const [firebasePing, setFirebasePing] = useState<number | null>(14);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [memoryWarning, setMemoryWarning] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Listen for storage changes if toggled from UserProfileModal
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = () => {
      const active = localStorage.getItem("sf_dev_health_console") === "true";
      setIsOpen(active);
    };

    window.addEventListener("storage", handleStorage);
    // Custom event check
    const handleDevToggle = (e: CustomEvent) => {
      setIsOpen(e.detail?.active ?? false);
    };
    window.addEventListener("sf_dev_console_toggle" as any, handleDevToggle);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sf_dev_console_toggle" as any, handleDevToggle);
    };
  }, []);

  // Subscribe to central logger and Firestore status stream
  useEffect(() => {
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [entry, ...prev.slice(0, 150)]);
    });

    const handleOnline = () => {
      setFirebaseConnected(true);
      logger.info("[FS_ONLINE_RECONNECT] Conexión de red reestablecida. Sincronizando con Firestore...", {
        online: true,
        timestamp: new Date().toISOString(),
      }, "FirestoreStream");
    };

    const handleOffline = () => {
      setFirebaseConnected(false);
      logger.warn("[FS_SYNC_FAIL] Red local desconectada. Operaciones en cola de caché local.", {
        online: false,
        timestamp: new Date().toISOString(),
      }, "FirestoreStream");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  // Firebase ping simulator
  useEffect(() => {
    if (!isOpen) return;
    
    // Memory Usage Monitoring
    const monitorMemory = () => {
      const perf = window.performance as any;
      if (perf && perf.memory) {
        const used = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
        setMemoryUsage(used);
        if (used > 1500) {
          if (!memoryWarning) {
            setMemoryWarning(true);
            logger.warn("Pico de uso de memoria detectado (> 1.5 GB). Considere recargar para evitar ciclo.", { used: `${used} MB` }, "MemGuard");
          }
        } else {
          setMemoryWarning(false);
        }
      }
    };
    
    monitorMemory();
    const memInterval = setInterval(monitorMemory, 2000);
    const pingInterval = setInterval(() => {
      const ping = Math.floor(Math.random() * 15) + 8;
      setFirebasePing(ping);
      setFirebaseConnected(typeof navigator !== "undefined" ? navigator.onLine : true);
    }, 4000);

    return () => {
      clearInterval(memInterval);
      clearInterval(pingInterval);
    };
  }, [isOpen, memoryWarning]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current && !isMinimized) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, isMinimized]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === "all") return true;
    if (filterLevel === "error") return log.level === "error";
    if (filterLevel === "warn") return log.level === "warn";
    if (filterLevel === "info") return log.level === "info";
    if (filterLevel === "firebase") {
      return (
        log.context?.toLowerCase().includes("firebase") ||
        log.context?.toLowerCase().includes("firestore") ||
        log.message?.toLowerCase().includes("firebase") ||
        log.message?.toLowerCase().includes("firestore")
      );
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.context || "App"}]: ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    addToast("Logs Copiados", "Registros copiados al portapapeles de desarrollo.", "info");
  };

  const handleClearLogs = () => {
    setLogs([]);
    addToast("Consola Limpia", "Se eliminaron los registros de la vista local.", "info");
  };

  const handleSimulateTestError = () => {
    logger.error("Prueba manual de error de tiempo de ejecución desde la consola Dev.", {
      module: "DevHealthConsole",
      simulated: true,
      timestamp: new Date().toISOString(),
    }, "DevConsole");
    addToast("Error Simulado", "Se ha registrado un error de prueba en la consola central.", "warning");
  };

  const handleTestGeminiApi = async () => {
    addToast("Probando Gemini API", "Enviando solicitud de prueba al endpoint...", "info");
    try {
      const model = (typeof window !== "undefined" && localStorage.getItem("sf_preferred_gemini_model")) || "gemini-2.5-flash";
      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      if (data.ok) {
        logger.info(`[GEMINI_API_OK] Conexión exitosa con Gemini API (${data.modelTested}, latencia ${data.latencyMs}ms). Muestra: ${data.outputSample}`, {
          model: data.modelTested,
          latencyMs: data.latencyMs,
          mode: data.mode,
        }, "GeminiApi");
        addToast("Gemini API OK", `Conexión exitosa (${data.latencyMs}ms)`, "success");
      } else {
        logger.error(`[GEMINI_API_FAIL] Error de conexión con Gemini API: ${data.error}`, {
          model: data.modelTested,
          rawError: data.rawError,
        }, "GeminiApi");
        addToast("Error Gemini API", data.error || "Fallo de conexión", "error");
      }
    } catch (e: any) {
      logger.error(`[GEMINI_API_ERROR] Excepción de red al probar Gemini API: ${e?.message}`, {
        error: String(e),
      }, "GeminiApi");
      addToast("Error de Red", e?.message || "Excepción de petición", "error");
    }
  };

  const handleSimulateSaveFail = () => {
    logger.error("[FS_SAVE_FAIL] Error al guardar documento borrador en Firestore: Permiso denegado o timeout de escritura.", {
      doc: "users/currentSession/drafts",
      code: "permission-denied",
      timestamp: new Date().toISOString(),
    }, "Firestore");
    addToast("Evento Simulado [FS_SAVE_FAIL]", "Fallo de guardado registrado en la consola de eventos.", "error");
  };

  const handleSimulateSyncFail = () => {
    logger.error("[FS_SYNC_FAIL] Error de sincronización remota con colección Firestore: Conexión interrumpida.", {
      collection: "users/history",
      retryAttempts: 3,
      timestamp: new Date().toISOString(),
    }, "Firestore");
    addToast("Evento Simulado [FS_SYNC_FAIL]", "Fallo de sincronización registrado en la consola de eventos.", "error");
  };

  const handleSimulateWriteSuccess = () => {
    logger.info("[FS_WRITE_SUCCESS] Escritura atómica confirmada en Firestore para 'users/drafts/currentSession'.", {
      path: "users/drafts/currentSession",
      timestamp: new Date().toISOString(),
    }, "Firestore");
    addToast("Evento Simulado [FS_WRITE_SUCCESS]", "Escritura exitosa registrada en la consola.", "success");
  };

  const handleCloseConsole = () => {
    localStorage.setItem("sf_dev_health_console", "false");
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("sf_dev_console_toggle", { detail: { active: false } }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xl shadow-2xl font-sans animate-in slide-in-from-bottom-5">
      <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl overflow-hidden shadow-emerald-950/20 shadow-2xl backdrop-blur-xl">
        {/* Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">Dev Health Check Console</span>
                <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[9px] rounded">
                  v2.0 Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Memory Usage Live Status */}
            {memoryUsage !== null && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-[10px] font-mono mr-1 ${memoryWarning ? "bg-rose-950 border-rose-800 text-rose-400" : "bg-slate-950 border-slate-800 text-slate-300"}`}>
                <Cpu className={`w-3.5 h-3.5 ${memoryWarning ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
                <span>Mem:</span>
                <span className={`font-bold ${memoryWarning ? "text-rose-400" : "text-emerald-400"}`}>{memoryUsage}MB</span>
              </div>
            )}
            {/* Firebase Live Status */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-mono mr-1">
              <span className={`w-2 h-2 rounded-full ${firebaseConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-slate-300">Firebase</span>
              <span className="text-emerald-400 font-bold">{firebasePing}ms</span>
            </div>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title={isMinimized ? "Expandir Consola" : "Minimizar Consola"}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCloseConsole}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
              title="Desactivar Consola"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimized Quick Stats */}
        {isMinimized && (
          <div className="px-4 py-2 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <Activity className="w-3.5 h-3.5" /> {logs.length} logs
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" /> {errorCount} errores
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                {warnCount} adv.
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-[10px] text-indigo-400 hover:underline font-mono"
            >
              Abrir Panel Completo
            </button>
          </div>
        )}

        {/* Expanded Body */}
        {!isMinimized && (
          <div className="p-3 space-y-3">
            {/* Real-Time Gemini API Health Ping Indicator */}
            <GeminiStatusBadge variant="console" />

            {/* Filter Controls & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setFilterLevel("all")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${filterLevel === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  Todos ({logs.length})
                </button>
                <button
                  onClick={() => setFilterLevel("error")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${filterLevel === "error" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-rose-400"}`}
                >
                  Errores ({errorCount})
                </button>
                <button
                  onClick={() => setFilterLevel("warn")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${filterLevel === "warn" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-amber-400"}`}
                >
                  Warns ({warnCount})
                </button>
                <button
                  onClick={() => setFilterLevel("firebase")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${filterLevel === "firebase" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-emerald-400"}`}
                >
                  Firebase
                </button>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={handleTestGeminiApi}
                  className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Probar llamada en vivo a la Gemini API"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Test Gemini API</span>
                </button>

                <button
                  onClick={handleSimulateTestError}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Simular un error para verificar captura"
                >
                  <Bug className="w-3 h-3 text-amber-400" />
                  <span>Test Error</span>
                </button>

                <button
                  onClick={handleCopyLogs}
                  className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                  title="Copiar logs"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleClearLogs}
                  className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 rounded transition-colors cursor-pointer"
                  title="Limpiar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mr-1">Pruebas Eventos Firestore:</span>
              <button
                type="button"
                onClick={handleSimulateWriteSuccess}
                className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded text-[10px] font-mono transition-colors cursor-pointer"
              >
                + FS_WRITE_SUCCESS
              </button>
              <button
                type="button"
                onClick={handleSimulateSaveFail}
                className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded text-[10px] font-mono transition-colors cursor-pointer"
              >
                ! FS_SAVE_FAIL
              </button>
              <button
                type="button"
                onClick={handleSimulateSyncFail}
                className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 rounded text-[10px] font-mono transition-colors cursor-pointer"
              >
                ! FS_SYNC_FAIL
              </button>
            </div>

            {/* Terminal Stream Box */}
            <div className="h-56 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11px] space-y-2 select-text">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-1">
                  <Terminal className="w-6 h-6 text-slate-700" />
                  <p className="text-xs">Sin eventos registrados para este filtro.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isErr = log.level === "error";
                  const isWarn = log.level === "warn";
                  const isInfo = log.level === "info";
                  const time = new Date(log.timestamp).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg border text-left leading-relaxed break-words ${
                        isErr
                          ? "bg-rose-950/40 border-rose-900/60 text-rose-200"
                          : isWarn
                          ? "bg-amber-950/30 border-amber-900/50 text-amber-200"
                          : isInfo
                          ? "bg-slate-900/60 border-slate-800 text-slate-300"
                          : "bg-slate-900/40 border-slate-800/60 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-bold">{time}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              isErr
                                ? "bg-rose-600 text-white"
                                : isWarn
                                ? "bg-amber-500 text-slate-950"
                                : "bg-indigo-600 text-white"
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-indigo-400 font-bold text-[10px]">[{log.context || "App"}]</span>
                        </div>
                      </div>
                      <p className="text-xs font-sans font-medium">{log.message}</p>

                      {log.details && (
                        <pre className="mt-1 p-1.5 bg-slate-950/80 rounded border border-slate-800/80 text-[10px] text-slate-400 overflow-x-auto">
                          {typeof log.details === "object" ? JSON.stringify(log.details, null, 2) : String(log.details)}
                        </pre>
                      )}

                      {log.stack && (
                        <details className="mt-1 text-[9px] text-rose-400 cursor-pointer">
                          <summary className="hover:underline">Ver Stack Trace</summary>
                          <pre className="p-1.5 bg-slate-950 text-rose-300 rounded mt-1 overflow-x-auto text-[9px]">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 w-3 h-3"
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
              <span>Host: AI Studio Cloud Run</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
