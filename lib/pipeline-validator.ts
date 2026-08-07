import type { ScriptLine } from "@/app/api/script-writer/route";

/**
 * Biblioteca de Validación del Pipeline y Estado del Guion.
 * Garantiza integridad de datos, desinfección de entrada/salida y prevención de regresiones.
 */

export interface ScriptValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedLines: ScriptLine[];
}

export interface TopicValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedTopic: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida un tema de investigación o prompt ingresado por el usuario.
 */
export function validateTopicInput(topic: string): TopicValidationResult {
  if (!topic || typeof topic !== "string") {
    return {
      isValid: false,
      reason: "El tema no puede estar vacío.",
      sanitizedTopic: "",
    };
  }

  const trimmed = topic.trim();
  if (trimmed.length < 3) {
    return {
      isValid: false,
      reason: "El tema debe tener al menos 3 caracteres.",
      sanitizedTopic: trimmed,
    };
  }

  if (trimmed.length > 500) {
    return {
      isValid: false,
      reason: "El tema excede el límite máximo de 500 caracteres.",
      sanitizedTopic: trimmed.slice(0, 500),
    };
  }

  // Sanitize control characters
  const sanitized = trimmed.replace(/[\r\n\t]+/g, " ");

  return {
    isValid: true,
    sanitizedTopic: sanitized,
  };
}

/**
 * Valida una sola línea de diálogo del guion.
 */
export function validateScriptLine(line: any): { isValid: boolean; reason?: string; sanitized?: ScriptLine } {
  if (!line || typeof line !== "object") {
    return { isValid: false, reason: "La línea debe ser un objeto válido." };
  }

  const speaker = String(line.speaker || "").trim();
  const text = String(line.text || "").trim();

  if (!speaker) {
    return { isValid: false, reason: "El locutor/interlocutor es obligatorio." };
  }

  if (!text) {
    return { isValid: false, reason: "El texto del diálogo no puede estar vacío." };
  }

  // Allowed sentiments
  const validSentiments: NonNullable<ScriptLine["sentiment"]>[] = [
    "enthusiastic",
    "concerned",
    "neutral",
  ];

  let sentiment: ScriptLine["sentiment"] = "neutral";
  if (line.sentiment && validSentiments.includes(line.sentiment)) {
    sentiment = line.sentiment;
  }

  const speakerRole: "host" | "caller" = line.speakerRole === "caller" ? "caller" : "host";

  return {
    isValid: true,
    sanitized: {
      id: line.id || `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      speaker,
      speakerRole,
      gender: line.gender === "Female" ? "Female" : line.gender === "Male" ? "Male" : undefined,
      accent: line.accent ? String(line.accent).trim() : undefined,
      emotion: line.emotion ? String(line.emotion).trim() : undefined,
      sentiment,
      text,
      timestamp: line.timestamp || "0:00",
    },
  };
}

/**
 * Valida y sanitiza una lista completa de líneas del guion.
 */
export function validateScriptLines(lines: any): ScriptValidationResult {
  const errors: string[] = [];
  const sanitizedLines: ScriptLine[] = [];

  if (!Array.isArray(lines)) {
    return {
      isValid: false,
      errors: ["Las líneas del guion deben ser una lista/array."],
      sanitizedLines: [],
    };
  }

  if (lines.length === 0) {
    return {
      isValid: false,
      errors: ["El guion no contiene ninguna línea de diálogo."],
      sanitizedLines: [],
    };
  }

  lines.forEach((l, index) => {
    const res = validateScriptLine(l);
    if (!res.isValid) {
      errors.push(`Línea ${index + 1}: ${res.reason}`);
    } else if (res.sanitized) {
      sanitizedLines.push(res.sanitized);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedLines,
  };
}

/**
 * Parsea y valida respuestas JSON o de texto del Guionista (ScriptWriter API).
 * Soporta fallbacks seguros contra respuestas inesperadas de HTML o JSON incompleto.
 */
export function parseScriptWriterResponse(responseText: string): {
  rawScript: string;
  lines: ScriptLine[];
  formatValid: boolean;
  error?: string;
} {
  if (!responseText || typeof responseText !== "string") {
    return {
      rawScript: "",
      lines: [],
      formatValid: false,
      error: "Respuesta vacía del servidor.",
    };
  }

  const trimmed = responseText.trim();
  if (trimmed.startsWith("<")) {
    return {
      rawScript: "",
      lines: [],
      formatValid: false,
      error: "Respuesta en formato HTML inesperado del servidor (Posible error 500 o proxy).",
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const rawScript = String(parsed.rawScript || parsed.text || "");
    const linesValidation = validateScriptLines(parsed.lines || []);

    return {
      rawScript,
      lines: linesValidation.sanitizedLines,
      formatValid: linesValidation.isValid && Boolean(rawScript),
      error: linesValidation.errors.length > 0 ? linesValidation.errors.join("; ") : undefined,
    };
  } catch (err) {
    return {
      rawScript: trimmed,
      lines: [],
      formatValid: false,
      error: "Error al parsear el formato JSON del guion.",
    };
  }
}

/**
 * Valida transiciones de estado dentro del orquestador del pipeline.
 * Pasos: 1 = SourceFinder, 2 = ScriptWriter, 3 = Audio/TTS, 4 = Storyboard / Finalizado.
 */
export function validatePipelineStageTransition(
  currentStage: number,
  nextStage: number,
  contextData: { reportText?: string; scriptLines?: ScriptLine[] }
): TransitionValidationResult {
  if (nextStage < 1 || nextStage > 4) {
    return { allowed: false, reason: "Paso de pipeline no válido." };
  }

  // Avanzar a paso 2 (ScriptWriter) requiere informe de fuentes
  if (nextStage === 2 && !contextData.reportText?.trim()) {
    return { allowed: false, reason: "Se requiere un informe de fuentes válido para avanzar a la redacción del guion." };
  }

  // Avanzar a paso 3 (Audio Studio) o 4 (Storyboard) requiere guion redactado
  if ((nextStage === 3 || nextStage === 4) && (!contextData.scriptLines || contextData.scriptLines.length === 0)) {
    return { allowed: false, reason: "Se requiere un guion con líneas de diálogo para avanzar al estudio de audio o storyboard." };
  }

  return { allowed: true };
}
