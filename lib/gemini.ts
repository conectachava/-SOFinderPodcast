import { GoogleGenAI } from "@google/genai";
import { getGenAiClientFactory, createVertexAiClient } from "./vertex-ai";

export interface GeminiClientOptions {
  forceVertex?: boolean;
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
      console.warn("[Gemini Client Warning]: Standard API key rejected. Retrying with Vertex AI (Vertex AI credits)...");
      try {
        const vertexClient = getGeminiClient({ forceVertex: true });
        return await vertexClient.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (vertexErr: any) {
        console.warn("[Vertex AI Fallback Notice]:", vertexErr?.message || vertexErr);
        throw vertexErr;
      }
    }

    throw err;
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



