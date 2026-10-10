"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { db, safeSetDoc } from "@/lib/firebase";
import { doc } from "firebase/firestore";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
  reportSuccess: boolean;
  issueId: string | null;
  reportError: string | null;
  userNotes: string;
  showLogsPreview: boolean;
  recentLogs: any[];
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReporting: false,
    reportSuccess: false,
    issueId: null,
    reportError: null,
    userNotes: "",
    showLogsPreview: false,
    recentLogs: [],
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error(`ErrorBoundary capturó una excepción: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, "ErrorBoundary");
  }

  public handleToggleLogsPreview = () => {
    const logs = logger.getRecentLogs();
    this.setState((prev) => ({
      showLogsPreview: !prev.showLogsPreview,
      recentLogs: logs,
    }));
  };

  /**
   * Captura el estado seguro de la aplicación (excluyendo credenciales o secretos)
   * y guarda un reporte de incidencia estructurado en Firestore.
   */
  public handleReportIssue = async () => {
    this.setState({ isReporting: true, reportError: null });

    try {
      const generatedId = `ISSUE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const logs = logger.getRecentLogs().slice(0, 30);
      
      // Capturar contexto de aplicación sin datos sensibles
      const safeAppState = {
        url: typeof window !== "undefined" ? window.location.href : "N/A",
        pathname: typeof window !== "undefined" ? window.location.pathname : "N/A",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
        language: typeof navigator !== "undefined" ? navigator.language : "es",
        viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A",
        screenResolution: typeof window !== "undefined" ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : "N/A",
        timestamp: new Date().toISOString(),
        theme: typeof localStorage !== "undefined" ? localStorage.getItem("sf_theme") || "light" : "unknown",
      };

      const issuePayload = {
        issueId: generatedId,
        errorMessage: this.state.error?.message || "Error desconocido",
        errorName: this.state.error?.name || "Error",
        errorStack: this.state.error?.stack || null,
        componentStack: this.state.errorInfo?.componentStack || null,
        appState: safeAppState,
        userNotes: this.state.userNotes || "Incertidumbre en tiempo de ejecución.",
        attachedLogs: logs,
        status: "open",
        createdAt: new Date().toISOString(),
      };

      // Guardar reporte en Firestore collection 'issue_reports'
      const issueDocRef = doc(db, "issue_reports", generatedId);
      await safeSetDoc(issueDocRef, issuePayload, { merge: true });

      logger.info(`Incidencia ${generatedId} enviada a Firestore con éxito`, issuePayload, "ErrorBoundary");

      this.setState({
        isReporting: false,
        reportSuccess: true,
        issueId: generatedId,
      });
    } catch (err: any) {
      console.error("Error al enviar reporte de incidencia:", err);
      const errorMsg = err?.message || "No se pudo conectar con Firestore.";
      this.setState({
        isReporting: false,
        reportError: errorMsg,
      });
      logger.warn(`Fallback local para reporte de incidencia por fallo de red: ${errorMsg}`, null, "ErrorBoundary");
    }
  };

  public handleGranularReload = () => {
    // Reset local error state
    this.setState({ hasError: false, error: null });
    // Execute reset prop if provided to trigger internal state reset of children
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[420px] flex flex-col items-center justify-center p-6 md:p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl my-6 mx-auto max-w-2xl shadow-xl transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-xl mb-4 shadow-sm">
            ⚠️
          </div>
          
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {this.props.fallbackTitle || (this.props.moduleName ? `Algo salió mal en el módulo ${this.props.moduleName}` : "Algo salió mal en este módulo")}
          </h2>
          
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-4 font-mono bg-slate-200/60 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-300/60 dark:border-slate-700/60 break-words">
            {this.state.error?.message || "Ocurrió un error inesperado al renderizar la interfaz."}
          </p>

          {/* Formulario / Confirmación de Reporte de Incidencia */}
          {this.state.reportSuccess ? (
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 rounded-xl mb-6 text-left space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Incidencia Enviada con Éxito
                </span>
                <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-mono font-bold text-[10px] rounded">
                  ID: {this.state.issueId}
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Hemos registrado el estado actual de la aplicación en Firestore para que el equipo técnico analice el problema.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl mb-6 text-left space-y-2.5 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Notas opcionales sobre lo que hacías:
              </label>
              <input
                type="text"
                value={this.state.userNotes}
                onChange={(e) => this.setState({ userNotes: e.target.value })}
                placeholder="Ej. Estaba editando la línea 3 del guion..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={this.handleToggleLogsPreview}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📋 {this.state.showLogsPreview ? "Ocultar Logs" : "Ver / Adjuntar Logs Recientes"}</span>
                </button>

                <button
                  onClick={this.handleReportIssue}
                  disabled={this.state.isReporting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {this.state.isReporting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Capturando &amp; Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>📢 Reportar Incidencia</span>
                    </>
                  )}
                </button>
              </div>

              {/* Logs Preview Panel */}
              {this.state.showLogsPreview && (
                <div className="mt-2 p-2.5 bg-slate-950 text-slate-200 rounded-lg border border-slate-800 text-[10px] font-mono max-h-40 overflow-y-auto space-y-1">
                  <div className="text-[9px] text-amber-400 font-bold border-b border-slate-800 pb-1 mb-1">
                    Breadcrumbs de consola ({this.state.recentLogs.length} eventos adjuntos al reporte):
                  </div>
                  {this.state.recentLogs.length === 0 ? (
                    <div className="text-slate-500 italic">No hay logs recientes registrados.</div>
                  ) : (
                    this.state.recentLogs.map((l: any, idx: number) => (
                      <div key={idx} className="truncate text-slate-300">
                        <span className="text-slate-500">[{l.timestamp?.substring(11, 19)}]</span>{" "}
                        <span className={l.level === "error" ? "text-rose-400 font-bold" : l.level === "warn" ? "text-amber-400" : "text-indigo-400"}>
                          [{l.level?.toUpperCase()}]
                        </span>{" "}
                        <span className="text-slate-400">[{l.context}]</span> {l.message}
                      </div>
                    ))
                  )}
                </div>
              )}

              {this.state.reportError && (
                <p className="text-[10px] text-rose-500 font-mono text-center">
                  Error de envío: {this.state.reportError}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              onClick={this.handleGranularReload}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              🔄 Recargar Módulo
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (e) {}
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/";
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              ⚡ System Reset (Reiniciar todo)
            </button>
          </div>
        </div>
      );
    }


    return this.props.children;
  }
}
