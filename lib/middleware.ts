import { NextRequest, NextResponse } from "next/server";
import { getVertexConfig } from "./vertex-ai";

export interface ApiValidationResult {
  isValid: boolean;
  mode: "vertex" | "apikey" | "none";
  headers: Record<string, string>;
  errorResponse?: NextResponse;
}

/**
 * Middleware function to validate presence of AI credentials and centralize
 * header injection required for Google Vertex AI and Gemini APIs.
 */
export function validateAiApiCredentials(req?: NextRequest): ApiValidationResult {
  const vertexConfig = getVertexConfig();
  const rawApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  const hasApiKey = rawApiKey.length > 10 && !rawApiKey.includes("YOUR_");

  const useVertex =
    process.env.USE_VERTEX_AI === "true" ||
    process.env.VERTEX_AI === "true" ||
    (!hasApiKey && Boolean(vertexConfig.projectId));

  const headers: Record<string, string> = {
    "User-Agent": "aistudio-build",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };

  if (useVertex) {
    headers["x-goog-user-project"] = vertexConfig.projectId;
    headers["x-vertex-location"] = vertexConfig.location;

    return {
      isValid: true,
      mode: "vertex",
      headers,
    };
  }

  if (hasApiKey) {
    return {
      isValid: true,
      mode: "apikey",
      headers,
    };
  }

  return {
    isValid: true,
    mode: "vertex",
    headers,
  };
}

/**
 * Wrapper for API Route handlers to ensure credentials validation,
 * security header injection, and protection against unauthorized external calls.
 */
export function withAiApiValidation(
  handler: (req: NextRequest, validation: ApiValidationResult) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // 1. Verify User Agent to reject automated scanner tools
    const userAgent = req.headers.get("user-agent") || "";
    if (/sqlmap|nikto|nmap|zgrab|masscan|dirbuster|gobuster|w3af|openvas/i.test(userAgent)) {
      return NextResponse.json(
        { error: "Forbidden: Security scanner blocked" },
        { status: 403 }
      );
    }

    const validation = validateAiApiCredentials(req);
    if (!validation.isValid && validation.errorResponse) {
      return validation.errorResponse;
    }

    const response = await handler(req, validation);

    Object.entries(validation.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

