"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * GlobalErrorHandler suppresses unhandled browser rejections caused by IndexedDB full disk errors,
 * AbortErrors, or QuotaExceeded errors in sandboxed / iframe environments, and logs critical unexpected errors
 * to the central logging system.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

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


