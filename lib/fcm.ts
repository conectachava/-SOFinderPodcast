/**
 * SourceFinder Pod — Firebase Cloud Messaging (FCM) Integration
 * Client-side push notification management for podcast rendering & completion alerts
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import firebaseConfig from "../firebase-applet-config.json";

export interface PushNotificationPayload {
  title: string;
  body: string;
  podcastId?: string;
  status?: "rendering" | "completed" | "processing" | "failed";
  progress?: number;
  data?: Record<string, string>;
}

export interface FcmTokenState {
  token: string | null;
  permission: NotificationPermission | "unsupported";
  isSupported: boolean;
  registeredAt?: string;
}

let messagingInstance: any = null;

/**
 * Checks if the browser supports Push Notifications and Service Workers
 */
export async function checkFcmSupport(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;

  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch (err) {
    console.warn("[FCM] isSupported check notice:", err);
    return false;
  }
}

/**
 * Gets or initializes the Firebase Messaging instance
 */
async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  if (typeof window === "undefined") return null;

  const supported = await checkFcmSupport();
  if (!supported) return null;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const { getMessaging } = await import("firebase/messaging");
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.warn("[FCM] Failed initializing Firebase Messaging:", err);
    return null;
  }
}

/**
 * Requests Notification permission from the user and retrieves the FCM registration token
 */
export async function requestFcmToken(vapidKey?: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] User notification permission:", permission);
      return null;
    }

    // Register service worker if not already registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn("[FCM] Service worker registration warning:", swErr);
      }
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, {
      serviceWorkerRegistration: swRegistration,
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      try {
        localStorage.setItem("sf_fcm_token", token);
        localStorage.setItem("sf_fcm_timestamp", new Date().toISOString());
      } catch {}
      return token;
    }

    return null;
  } catch (err) {
    console.warn("[FCM] Error acquiring FCM token:", err);
    return null;
  }
}

/**
 * Listens for incoming push notifications while the app is in the foreground
 */
export async function subscribeToForegroundFcm(
  callback: (payload: PushNotificationPayload) => void
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const { onMessage } = await import("firebase/messaging");
    const unsubscribe = onMessage(messaging, (remoteMessage) => {
      console.log("[FCM] Foreground message received:", remoteMessage);
      const payload: PushNotificationPayload = {
        title: remoteMessage.notification?.title || remoteMessage.data?.title || "🎙️ SourceFinder Pod",
        body: remoteMessage.notification?.body || remoteMessage.data?.body || "Nueva actualización de renderizado.",
        podcastId: remoteMessage.data?.podcastId,
        status: (remoteMessage.data?.status as any) || "completed",
        data: remoteMessage.data as Record<string, string>,
      };
      callback(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("[FCM] Foreground listener registration error:", err);
    return null;
  }
}

/**
 * Saves FCM Token to user's profile in Firestore
 */
export async function saveFcmTokenToUser(userId: string, token: string): Promise<boolean> {
  if (!userId || !token || typeof window === "undefined") return false;

  try {
    const { db } = await import("./firebase");
    if (db) {
      const { doc, setDoc } = await import("firebase/firestore");
      // Save in device tokens subcollection
      const tokenId = token.slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, "");
      const tokenRef = doc(db, "users", userId, "fcmTokens", tokenId || "device_token");
      await setDoc(
        tokenRef,
        {
          token,
          userAgent: navigator.userAgent.slice(0, 500),
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Also update main user profile
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          fcmToken: token,
          notificationsEnabled: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    }
  } catch (err) {
    console.warn("[FCM] Error saving token to Firestore:", err);
  }
  return false;
}

/**
 * Dispatches a push notification via backend API to alert the user of rendering events
 */
export async function dispatchRenderingPushAlert(payload: PushNotificationPayload): Promise<{
  success: boolean;
  simulated?: boolean;
}> {
  try {
    let storedToken = "";
    if (typeof window !== "undefined") {
      try {
        storedToken = localStorage.getItem("sf_fcm_token") || "";
      } catch {}
    }

    const res = await fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: storedToken,
        title: payload.title,
        body: payload.body,
        status: payload.status || "completed",
        podcastId: payload.podcastId,
        progress: payload.progress,
        data: payload.data,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, simulated: data.simulated };
    }
  } catch (err) {
    console.warn("[FCM] Dispatch push alert error:", err);
  }

  // Fallback: If user has native Notification permission and page is hidden / background, show native alert
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    document.visibilityState === "hidden"
  ) {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: "/icon.svg",
        badge: "/icon.svg",
      });
    } catch {}
  }

  return { success: false };
}
