"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  checkFcmSupport,
  requestFcmToken,
  subscribeToForegroundFcm,
  saveFcmTokenToUser,
  dispatchRenderingPushAlert,
  type PushNotificationPayload,
} from "@/lib/fcm";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/app/AuthProvider";

export interface LoggedNotification extends PushNotificationPayload {
  id: string;
  receivedAt: string;
}

export function useFcmNotifications() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [notificationsLog, setNotificationsLog] = useState<LoggedNotification[]>([
    {
      id: "init-1",
      title: "🎙️ Monitor de Renderizado Activo",
      body: "El sistema alertará mediante notificaciones push cuando tus audios terminen de sintetizarse.",
      status: "completed",
      receivedAt: new Date().toLocaleTimeString(),
    },
  ]);

  // Initial detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    checkFcmSupport().then((supp) => {
      setIsSupported(supp);
      if (supp && Notification.permission === "granted") {
        try {
          const stored = localStorage.getItem("sf_fcm_token");
          if (stored) setToken(stored);
        } catch {}
      }
    });
  }, []);

  // Listen to foreground FCM messages
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    subscribeToForegroundFcm((payload) => {
      const newEntry: LoggedNotification = {
        ...payload,
        id: `fcm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        receivedAt: new Date().toLocaleTimeString(),
      };

      setNotificationsLog((prev) => [newEntry, ...prev.slice(0, 19)]);

      addToast(
        payload.title,
        payload.body,
        payload.status === "failed" ? "error" : "success"
      );
    }).then((unsub) => {
      if (unsub) cleanup = unsub;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [addToast]);

  const enableNotifications = useCallback(async () => {
    setIsEnabling(true);
    try {
      const acquiredToken = await requestFcmToken();
      if (acquiredToken) {
        setToken(acquiredToken);
        setPermission("granted");

        if (user?.uid) {
          await saveFcmTokenToUser(user.uid, acquiredToken);
        }

        addToast(
          "Notificaciones Push Activadas",
          "Recibirás alertas en tiempo real al finalizar la producción de tus podcasts.",
          "success"
        );
        return true;
      } else {
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermission(Notification.permission);
        }
        if (Notification.permission === "denied") {
          addToast(
            "Permiso Denegado",
            "Has bloqueado las notificaciones en tu navegador. Puedes habilitarlas en la configuración del sitio.",
            "warning"
          );
        }
        return false;
      }
    } catch (err: any) {
      console.error("[useFcmNotifications] Error enabling notifications:", err);
      addToast("Error de Notificaciones", "No se pudo activar el servicio de push.", "error");
      return false;
    } finally {
      setIsEnabling(false);
    }
  }, [user, addToast]);

  const sendTestNotification = useCallback(async () => {
    const payload: PushNotificationPayload = {
      title: "🎉 ¡Renderizado Maestro Completado!",
      body: "Tu episodio de podcast ha sido compilado a -16 LUFS con Audio Bed ambiental listo para publicación.",
      status: "completed",
      podcastId: "test-render",
    };

    const res = await dispatchRenderingPushAlert(payload);
    const newEntry: LoggedNotification = {
      ...payload,
      id: `test-${Date.now()}`,
      receivedAt: new Date().toLocaleTimeString(),
    };
    setNotificationsLog((prev) => [newEntry, ...prev]);

    addToast(
      "Alerta de Prueba Despachada",
      res.simulated
        ? "Notificación despachada al monitor de renderizado en vivo."
        : "Notificación push enviada con éxito.",
      "info"
    );
  }, [addToast]);

  return {
    permission,
    isSupported,
    token,
    isEnabling,
    notificationsLog,
    enableNotifications,
    sendTestNotification,
    dispatchAlert: dispatchRenderingPushAlert,
  };
}
