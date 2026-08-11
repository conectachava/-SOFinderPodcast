import { GoogleGenAI } from "@google/genai";

export interface VertexConfig {
  projectId: string;
  location: string;
}

/**
 * Gets Vertex AI configuration from environment variables.
 */
export function getVertexConfig(): VertexConfig {
  const projectId =
    process.env.VERTEX_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "vsnry-labs-b4d4f";

  const location = process.env.VERTEX_LOCATION || process.env.GCP_LOCATION || "us-central1";

  return { projectId, location };
}

/**
 * Creates and returns an instance of GoogleGenAI initialized specifically for Vertex AI mode.
 */
export function createVertexAiClient(customConfig?: Partial<VertexConfig>): GoogleGenAI {
  const config = getVertexConfig();
  const projectId = customConfig?.projectId || config.projectId;
  const location = customConfig?.location || config.location;

  return new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
        "x-goog-api-client": "aistudio-build/vertex-ai",
      },
    },
  });
}

/**
 * Creates a GoogleGenAI client automatically deciding between Vertex AI and standard Gemini API Key.
 */
export function getGenAiClientFactory(): GoogleGenAI {
  const rawApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  const hasValidApiKey = rawApiKey.length > 10 && !rawApiKey.includes("YOUR_");
  const useVertex =
    process.env.USE_VERTEX_AI === "true" ||
    process.env.VERTEX_AI === "true" ||
    !hasValidApiKey;

  if (useVertex) {
    return createVertexAiClient();
  }

  return new GoogleGenAI({
    apiKey: rawApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}
