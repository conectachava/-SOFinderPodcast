import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFallback, formatGeminiError } from "@/lib/gemini";
import { withAiApiValidation, validateAiApiCredentials } from "@/lib/middleware";

export const dynamic = "force-dynamic";

function validateApiKeyFormat(keyString: string) {
  const untrimmed = keyString || "";
  const trimmed = untrimmed.trim();
  const hasLeadingTrailingSpace = untrimmed !== trimmed;
  const hasInternalSpaces = /\s/.test(trimmed);
  const hasQuotes = /^['"].*['"]$/.test(trimmed) || trimmed.includes('"') || trimmed.includes("'");
  const startsWithAIza = trimmed.startsWith("AIzaSy") || trimmed.startsWith("AIza");
  const length = trimmed.length;
  const isAlphanumericSafe = /^[A-Za-z0-9_\-]+$/.test(trimmed);

  let isValidFormat = true;
  const issues: string[] = [];

  if (!trimmed) {
    isValidFormat = false;
    issues.push("La variable GEMINI_API_KEY está vacía o no está configurada.");
  } else {
    if (hasLeadingTrailingSpace) {
      isValidFormat = false;
      issues.push("La clave contiene espacios en blanco al inicio o al final.");
    }
    if (hasInternalSpaces) {
      isValidFormat = false;
      issues.push("La clave contiene espacios dentro de la cadena.");
    }
    if (hasQuotes) {
      isValidFormat = false;
      issues.push("La clave contiene comillas superfluas (' o \").");
    }
    if (!isAlphanumericSafe) {
      isValidFormat = false;
      issues.push("La clave contiene caracteres especiales no válidos para Google API Keys.");
    }
    if (length < 30 || length > 60) {
      issues.push(`La longitud de la clave es inusual (${length} caracteres, lo estándar es ~39).`);
    }
    if (!startsWithAIza) {
      issues.push("El prefijo no comienza con el estándar habitual 'AIzaSy'.");
    }
  }

  return {
    isValidFormat,
    startsWithAIza,
    length,
    hasWhitespace: hasLeadingTrailingSpace || hasInternalSpaces,
    hasQuotes,
    isAlphanumericSafe,
    issues,
  };
}

export const GET = withAiApiValidation(async function GET(req: NextRequest) {
  const creds = validateAiApiCredentials(req);
  const untrimmedKey = process.env.GEMINI_API_KEY || "";
  const trimmedKey = untrimmedKey.trim();
  const formatCheck = validateApiKeyFormat(untrimmedKey);

  const hasApiKeyEnv = trimmedKey.length > 5;
  const apiKeyMasked = hasApiKeyEnv
    ? `${trimmedKey.substring(0, 4)}...${trimmedKey.substring(trimmedKey.length - 4)}`
    : "No configurada";

  return NextResponse.json({
    ok: formatCheck.isValidFormat,
    mode: creds.mode,
    hasApiKeyEnv,
    apiKeyMasked,
    formatCheck,
  });
});

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  const startTime = Date.now();
  const body = await req.json().catch(() => ({}));
  const model = body.model || "gemini-2.5-flash";

  const creds = validateAiApiCredentials(req);
  const untrimmedKey = process.env.GEMINI_API_KEY || "";
  const trimmedKey = untrimmedKey.trim();
  const formatCheck = validateApiKeyFormat(untrimmedKey);

  const hasApiKeyEnv = trimmedKey.length > 5;
  const apiKeyMasked = hasApiKeyEnv
    ? `${trimmedKey.substring(0, 4)}...${trimmedKey.substring(trimmedKey.length - 4)}`
    : "No configurada";

  // Check key format strictly before attempting ping if requested or if key is severely invalid
  if (body.strictFormatOnly || !formatCheck.isValidFormat) {
    if (!formatCheck.isValidFormat) {
      return NextResponse.json({
        ok: false,
        status: "format_error",
        error: `Error de formato en GEMINI_API_KEY: ${formatCheck.issues.join(" ")}`,
        modelTested: model,
        hasApiKeyEnv,
        apiKeyMasked,
        formatCheck,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  try {
    // Test request to Gemini API
    const response = await generateContentWithFallback({
      model,
      contents: "Responde únicamente con la palabra 'PONG' para verificar conectividad.",
    });

    const latencyMs = Date.now() - startTime;
    const textOutput = response.text ? response.text.trim() : "OK";

    return NextResponse.json({
      ok: true,
      status: "online",
      message: "¡Conexión exitosa con Gemini API!",
      outputSample: textOutput,
      modelTested: model,
      mode: creds.mode,
      hasApiKeyEnv,
      apiKeyMasked,
      formatCheck,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const formattedMessage = formatGeminiError(error);

    console.error("Diagnostic Test Gemini Error:", error);

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: formattedMessage,
        rawError: typeof error === "string" ? error : error?.message || String(error),
        modelTested: model,
        hasApiKeyEnv,
        apiKeyMasked,
        formatCheck,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 so UI can parse clean JSON diagnostic result
    );
  }
});

