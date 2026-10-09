"use client";

import React, { useState } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Send,
  Radio,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";
import { useFcmNotifications, LoggedNotification } from "@/hooks/useFcmNotifications";

interface PushNotificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PushNotificationManager({ isOpen, onClose }: PushNotificationManagerProps) {
  const {
    permission,
    isSupported,
    token,
    isEnabling,
    notificationsLog,
    enableNotifications,
    sendTestNotification,
  } = useFcmNotifications();

  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (token && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Centro de Notificaciones Push"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Notificaciones Push FCM</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Firebase Cloud Messaging
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Alertas instantáneas al finalizar podcasts o durante el renderizado maestro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Permission Status Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Estado de Notificaciones en el Navegador
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  permission === "granted"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : permission === "denied"
                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                    : "bg-amber-950 text-amber-300 border border-amber-800"
                }`}
              >
                {permission === "granted" ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Activas (Concedido)</span>
                  </>
                ) : permission === "denied" ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>Bloqueadas</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Pendiente de Permiso</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Recibe notificaciones automáticas incluso si cambias de pestaña, minimizas la ventana o tu dispositivo está bloqueado cuando la síntesis de audio HD de Gemini y el Audio Bed completan su masterización.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {permission !== "granted" ? (
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={isEnabling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>{isEnabling ? "Solicitando Permiso..." : "Activar Notificaciones Push"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={sendTestNotification}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Alerta de Prueba</span>
                </button>
              )}

              {token && (
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                  title="Copiar token de registro FCM"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Token Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Token FCM</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* FCM Architecture Indicators */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">Service Worker</span>
              <span className="text-slate-200 font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>/firebase-messaging-sw.js</span>
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">Proveedor de Notificaciones</span>
              <span className="text-slate-200 font-mono font-bold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>FCM WebPush Protocol v1</span>
              </span>
            </div>
          </div>

          {/* Recent Notifications Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Historial de Alertas de Renderizado
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {notificationsLog.length} eventos
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notificationsLog.map((item: LoggedNotification) => (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-start gap-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      item.status === "completed"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                        : item.status === "rendering"
                        ? "bg-indigo-950/80 text-indigo-400 border border-indigo-800/80"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{item.receivedAt}</span>
                    </div>
                    <p className="text-slate-400 leading-snug">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <span>Integrado con Firebase Cloud Messaging v1</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
