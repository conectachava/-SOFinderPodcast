"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Cpu,
  Activity,
  Copy,
  Check,
  Zap,
  Info,
  Server
} from "lucide-react";
import { safeFetchJson } from "@/lib/utils";
import { useToast } from "./Toast";

export const GEMINI_MODEL_OPTIONS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Recomendado",
    desc: "Modelo predeterminado ultrarrápido y equilibrado para generación de scripts, fuentes y audio.",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    tag: "Razonamiento Avanzado",
    desc: "Capacidad máxima para temas complejos, diálogos extensos e investigación estructurada.",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    tag: "Legado Rápido",
    desc: "Útil para probar compatibilidad con cuotas o claves de la generación anterior.",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    tag: "Legado Pro",
    desc: "Modelo razona de anterior generación para pruebas cruzadas de permisos.",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    tag: "Preview 2.0",
    desc: "Última generación multitarea experimental para verificar acceso de API.",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
];

export function GeminiDiagnosticView() {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return "gemini-2.5-flash";
    try {
      return localStorage.getItem("sf_preferred_gemini_model") || "gemini-2.5-flash";
    } catch {
      return "gemini-2.5-flash";
    }
  });

  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [batchTesting, setBatchTesting] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, any>>({});
  const [formatInfo, setFormatInfo] = useState<any | null>(null);
  const [checkingFormat, setCheckingFormat] = useState<boolean>(true);

  const { addToast } = useToast();

  // Load API Key format check on component mount
  useEffect(() => {
    let isMounted = true;
    async function loadFormatInfo() {
      try {
        setCheckingFormat(true);
        const res = await safeFetchJson("/api/test-gemini", { method: "GET" });
        if (isMounted && res.ok && res.data) {
          setFormatInfo(res.data);
        }
      } catch (err) {
        console.error("Error fetching API key format info:", err);
      } finally {
        if (isMounted) setCheckingFormat(false);
      }
    }
    loadFormatInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveModel = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem("sf_preferred_gemini_model", modelId);
      addToast("Modelo Guardado", `Modelo preferido actualizado a ${modelId}`, "success");
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async (modelToTest = selectedModel) => {
    setIsRunningTest(true);
    setTestResult(null);

    try {
      const res = await safeFetchJson("/api/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelToTest }),
      });

      if (res.ok && res.data) {
        setTestResult(res.data);
        if (res.data.ok) {
          addToast("Conexión Exitosa", `Modelo ${modelToTest} respondió en ${res.data.latencyMs}ms`, "success");
        } else {
          addToast("Error de Gemini API", res.data.error || "Fallo en la prueba", "error");
        }
      } else {
        const errorMsg = res.error || "No se pudo comunicar con el endpoint de prueba";
        setTestResult({
          ok: false,
          error: errorMsg,
          modelTested: modelToTest,
          timestamp: new Date().toISOString(),
        });
        addToast("Error de Conexión", errorMsg, "error");
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err?.message || "Error al realizar la petición de diagnóstico.",
        modelTested: modelToTest,
        timestamp: new Date().toISOString(),
      });
      addToast("Excepción de Red", "No se pudo completar el test.", "error");
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleTestAllModels = async () => {
    setBatchTesting(true);
    setBatchResults({});
    addToast("Diagnóstico Completo", "Probando conectividad en todos los modelos...", "info");

    const results: Record<string, any> = {};
    for (const m of GEMINI_MODEL_OPTIONS) {
      try {
        const res = await safeFetchJson("/api/test-gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: m.id }),
        });
        if (res.ok && res.data) {
          results[m.id] = res.data;
        } else {
          results[m.id] = { ok: false, error: res.error || "Respuesta no válida" };
        }
      } catch (err: any) {
        results[m.id] = { ok: false, error: err?.message || "Error de red" };
      }
      setBatchResults({ ...results });
    }
    setBatchTesting(false);
    addToast("Prueba Finalizada", "Diagnóstico multi-modelo completado.", "success");
  };

  const copyDiagnosticSummary = () => {
    if (!testResult) return;
    const text = JSON.stringify(testResult, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("Copiado", "Resumen de diagnóstico copiado al portapapeles", "info");
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Overview Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Diagnóstico de Estado API & Selector de Modelo
              </h3>
              <p className="text-xs text-slate-300">
                Verifica la validez de GEMINI_API_KEY y descarta fallos específicos por modelo.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Check
          </span>
        </div>
      </div>

      {/* API Key Format Validation Card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Validación de Estructura de Clave API (`GEMINI_API_KEY`)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Inspección preliminar de sintaxis, prefijo estándar y espacios no deseados.
              </p>
            </div>
          </div>

          {formatInfo?.formatCheck ? (
            formatInfo.formatCheck.isValidFormat ? (
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Formato Válido
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3" /> Error de Sintaxis
              </span>
            )
          ) : checkingFormat ? (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
            </span>
          ) : null}
        </div>

        {formatInfo?.formatCheck && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Clave en Entorno:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {formatInfo.apiKeyMasked}
              </span>
            </div>

            <div className="p-2.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Prefijo Estándar (AIzaSy):</span>
              <span className="font-bold flex items-center gap-1">
                {formatInfo.formatCheck.startsWithAIza ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Correcto (AIza...)
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Prefijo inusual
                  </span>
                )}
              </span>
            </div>

            <div className="p-2.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Longitud de Cadena:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatInfo.formatCheck.length} caracteres{" "}
                {formatInfo.formatCheck.length >= 35 && formatInfo.formatCheck.length <= 45 ? "(~39 estándar)" : "(inusual)"}
              </span>
            </div>
          </div>
        )}

        {formatInfo?.formatCheck?.issues?.length > 0 && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Advertencias de formato detectadas:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
              {formatInfo.formatCheck.issues.map((issue: string, idx: number) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Model Selector Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Selección de Modelo Preferido
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prueba un modelo específico si experimentas errores de cuota o permisos restringidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GEMINI_MODEL_OPTIONS.map((m) => {
            const isSelected = selectedModel === m.id;
            const batchRes = batchResults[m.id];

            return (
              <div
                key={m.id}
                onClick={() => handleSaveModel(m.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</span>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full font-mono ${m.badgeColor}`}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{m.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="preferredModel"
                    checked={isSelected}
                    onChange={() => handleSaveModel(m.id)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Batch test status tag if available */}
                {batchRes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Estado de Modelo:</span>
                    {batchRes.ok ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OK ({batchRes.latencyMs}ms)
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Test Action Section */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Prueba de Conexión en Tiempo Real
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Envía una petición liviana al servidor para validar que la clave de API responde correctamente.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleTestConnection(selectedModel)}
              disabled={isRunningTest || batchTesting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {isRunningTest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Probar Conexión</span>
                </>
              )}
            </button>

            <button
              onClick={handleTestAllModels}
              disabled={isRunningTest || batchTesting}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Prueba secuencial de todos los modelos"
            >
              {batchTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Probando Todos...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Probar Todos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Test Results Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 transition-all animate-in fade-in slide-in-from-top-2 ${
              testResult.ok
                ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100"
                : "bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/80 text-rose-950 dark:text-rose-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-current/10 pb-2">
              <div className="flex items-center gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold text-sm block">
                    {testResult.ok ? "¡Prueba de API Exitosa!" : "Fallo en la Autenticación / API"}
                  </span>
                  <span className="text-[10px] font-mono opacity-80">
                    Modelo probado: <strong>{testResult.modelTested}</strong> | Latencia:{" "}
                    <strong>{testResult.latencyMs || 0}ms</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={copyDiagnosticSummary}
                className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                title="Copiar informe JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Success details */}
            {testResult.ok && (
              <div className="space-y-1.5 font-sans">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  {testResult.message || "El servidor logró comunicarse correctamente con la API de Google Gemini."}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                  <div className="p-2 bg-emerald-100/60 dark:bg-emerald-900/30 rounded-lg">
                    <span className="opacity-70 block">Modo Credenciales:</span>
                    <strong className="uppercase">{testResult.mode || "API KEY"}</strong>
                  </div>
                  <div className="p-2 bg-emerald-100/60 dark:bg-emerald-900/30 rounded-lg">
                    <span className="opacity-70 block">Muestra de Respuesta:</span>
                    <strong>{testResult.outputSample || "PONG"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Error details */}
            {!testResult.ok && (
              <div className="space-y-2 font-sans">
                <div className="p-2.5 bg-rose-100/80 dark:bg-rose-900/40 rounded-lg border border-rose-200/80 dark:border-rose-800/60">
                  <span className="font-bold text-xs block text-rose-900 dark:text-rose-200">
                    Mensaje del Diagnóstico:
                  </span>
                  <p className="text-xs mt-0.5 text-rose-800 dark:text-rose-300 font-medium">
                    {testResult.error}
                  </p>
                </div>

                {testResult.rawError && (
                  <details className="text-[10px] font-mono opacity-80 cursor-pointer">
                    <summary className="hover:underline">Ver detalle de error técnico (raw JSON/log)</summary>
                    <pre className="p-2 bg-slate-950 text-rose-300 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap">
                      {typeof testResult.rawError === "object"
                        ? JSON.stringify(testResult.rawError, null, 2)
                        : testResult.rawError}
                    </pre>
                  </details>
                )}

                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pasos sugeridos para solucionar:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    <li>Verifica que la variable <strong>GEMINI_API_KEY</strong> esté configurada en el panel de Settings de la app.</li>
                    <li>Asegúrate de que la API Key no tenga espacios extra ni caracteres inválidos.</li>
                    <li>Prueba cambiar al modelo <strong>gemini-1.5-flash</strong> o <strong>gemini-2.0-flash</strong> arriba para descartar cuotas agotadas en 2.5.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informational Footer */}
      <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Las claves de API para Google Gemini se manejan de forma segura en el servidor de la aplicación.
          Los cambios de modelo se guardan localmente para tus próximas sesiones de generación.
        </p>
      </div>
    </div>
  );
}
