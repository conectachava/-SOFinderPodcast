import { GoogleGenAI } from "@google/genai";
import { getGenAiClientFactory, createVertexAiClient } from "./vertex-ai";

export interface GeminiClientOptions {
  forceVertex?: boolean;
}

/**
 * Utility function to convert raw Gemini/Google API errors into clean, readable messages.
 */
export function formatGeminiError(err: any): string {
  if (!err) return "Error desconocido en el servicio de AI.";

  let rawMsg = typeof err === "string" ? err : err.message || "";

  // Attempt parsing stringified JSON error objects from Google API
  if (typeof rawMsg === "string" && rawMsg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        rawMsg = parsed.error.message;
      }
      if (
        parsed?.error?.status === "INVALID_ARGUMENT" ||
        parsed?.error?.details?.[0]?.reason === "API_KEY_INVALID"
      ) {
        return "Clave de API de Gemini no válida. Por favor, configure una GEMINI_API_KEY válida en la sección de Configuración (Settings) de la aplicación.";
      }
    } catch {
      // Ignore JSON parse failures
    }
  }

  const lower = String(rawMsg).toLowerCase();

  if (
    lower.includes("api key not valid") ||
    lower.includes("api_key_invalid") ||
    lower.includes("please pass a valid api key")
  ) {
    return "Clave de API de Gemini no válida. Por favor, asegúrate de configurar GEMINI_API_KEY en la sección de Configuración (Settings) de la aplicación.";
  }

  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return "Se ha alcanzado la cuota de peticiones de Gemini. Por favor, inténtalo de nuevo en unos momentos.";
  }

  return rawMsg || "Falló la comunicación con los servicios de Gemini AI.";
}

/**
 * Returns an instance of GoogleGenAI configured for either Vertex AI or standard API Key authentication.
 * Leverages the centralized factory function in lib/vertex-ai.ts.
 */
export function getGeminiClient(options?: GeminiClientOptions): GoogleGenAI {
  if (options?.forceVertex) {
    return createVertexAiClient();
  }
  return getGenAiClientFactory();
}

/**
 * Helper to call generateContent with automatic retry on Vertex AI if an API key error occurs.
 */
export async function generateContentWithFallback(
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  options?: GeminiClientOptions
) {
  const model = params.model || "gemini-3.6-flash";

  // First try primary client factory
  try {
    const primaryClient = getGeminiClient(options);
    return await primaryClient.models.generateContent({
      model,
      contents: params.contents,
      config: params.config,
    });
  } catch (err: any) {
    const errString = String(err?.message || JSON.stringify(err) || "").toLowerCase();
    const isApiKeyError =
      errString.includes("api key not valid") ||
      errString.includes("api_key_invalid") ||
      errString.includes("invalid_argument") ||
      err?.status === 400 ||
      err?.code === 400;

    if (isApiKeyError && !options?.forceVertex) {
      console.warn("[Gemini Client Warning]: Standard API key rejected. Retrying with Vertex AI...");
      try {
        const vertexClient = getGeminiClient({ forceVertex: true });
        return await vertexClient.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (vertexErr: any) {
        console.warn("[Vertex AI Fallback Notice]:", vertexErr?.message || vertexErr);
        throw new Error(formatGeminiError(vertexErr));
      }
    }

    throw new Error(formatGeminiError(err));
  }
}

/**
 * Utility function to check if Vertex AI mode is active or configured.
 */
export function isVertexAiActive(): boolean {
  return (
    process.env.USE_VERTEX_AI === "true" ||
    process.env.VERTEX_AI === "true" ||
    Boolean(process.env.VERTEX_PROJECT_ID) ||
    Boolean(process.env.GCP_PROJECT)
  );
}




