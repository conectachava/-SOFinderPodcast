"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * GlobalErrorHandler suppresses unhandled browser rejections caused by IndexedDB full disk errors,
 * AbortErrors, or QuotaExceeded errors in sandboxed / iframe environments, and logs critical unexpected errors
 * to the central logging system AND Firestore system_errors collection for proactive dev team monitoring.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const logToFirestore = async (errorType: string, message: string, detailObj: any) => {
      try {
        const { auth, db } = await import("@/lib/firebase");
        const { doc, setDoc } = await import("firebase/firestore");
        if (!db || !auth?.currentUser?.uid) return;

        const docId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const errorDocRef = doc(db, "system_errors", docId);
        const payload = {
          errorId: docId,
          type: errorType,
          message: String(message || "Error sin mensaje").slice(0, 1000),
          stack: String(detailObj?.stack || (detailObj instanceof Error ? detailObj.stack : "") || "").slice(0, 2000),
          url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
          timestamp: new Date().toISOString(),
          status: "unresolved",
          severity: "critical",
          details: (typeof detailObj === "object" ? JSON.stringify(detailObj) : String(detailObj || "")).slice(0, 2000),
        };
        await setDoc(errorDocRef, payload, { merge: true });
        logger.info(`[GLOBAL_ERR_FIRESTORE] Error crítico registrado en Firestore 'system_errors': ${docId}`, { docId }, "GlobalErrorHandler");
      } catch {
        // Do not emit secondary console errors if error telemetry write is rejected
      }
    };

    const isAbortOrStorageError = (err: any, msgStr: string) => {
      const name = String(err?.name || "").toLowerCase();
      const msg = String(msgStr || err?.message || err || "").toLowerCase();
      const code = err?.code;

      const isAbort =
        name === "aborterror" ||
        code === 20 ||
        msg.includes("aborterror") ||
        msg.includes("abort") ||
        msg.includes("aborted") ||
        msg.includes("canceled") ||
        msg.includes("cancelled") ||
        msg.includes("user aborted") ||
        msg.includes("signal is aborted");

      const isStorage =
        name === "quotaexceedederror" ||
        msg.includes("indexeddb") ||
        msg.includes("full disk") ||
        msg.includes("backing store") ||
        msg.includes("quotaexceeded") ||
        msg.includes("ns_error_dom_quota_reached");

      const isUnexpectedHtmlToken =
        msg.includes("unexpected token '<'") ||
        msg.includes("is not valid json") ||
        (msg.includes("unexpected token") && msg.includes("<"));

      return isAbort || isStorage || isUnexpectedHtmlToken;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason?.message ||
        reason?.name ||
        (typeof reason === "string" ? reason : String(reason || ""));

      if (isAbortOrStorageError(reason, message)) {
        try {
          event.preventDefault();
          event.stopPropagation();
        } catch (e) {}
        logger.debug("Sancionada cancelación o cuota inofensiva de fondo", { message }, "GlobalErrorHandler");
      } else {
        logger.error(`Promesa rechazada no capturada: ${message}`, reason, "GlobalErrorHandler");
        logToFirestore("unhandled_rejection", message, reason);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const err = event.error;
      const message = event.message || "";

      if (isAbortOrStorageError(err, message)) {
        try {
          event.preventDefault();
          event.stopPropagation();
        } catch (e) {}
        logger.debug("Sancionado error global inofensivo de fondo", { message }, "GlobalErrorHandler");
      } else {
        logger.error(`Error de ejecución cliente: ${message}`, err || { filename: event.filename, lineno: event.lineno }, "GlobalErrorHandler");
        logToFirestore("runtime_error", message, err || { filename: event.filename, lineno: event.lineno });
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  return null;
}


