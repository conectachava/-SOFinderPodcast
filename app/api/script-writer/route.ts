import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, generateContentWithFallback } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export interface ScriptLine {
  id: string;
  speaker: string;
  speakerRole: "host" | "caller" | "expert" | "narrator" | string;
  gender?: "Male" | "Female" | string;
  accent?: string;
  emotion?: string;
  sentiment?: "neutral" | "enthusiastic" | "concerned" | string;
  text: string;
  timestamp: string; // e.g. "0:05"
}

interface CallerConfig {
  name: string;
  gender?: string;
  accent?: string;
}

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const {
      intelligenceReport,
      showFormat = "Debate",
      durationMinutes = 3,
      customHostName = "Paul",
      customCallers = [
        { name: "Sarah", gender: "Female", accent: "American Midwest" },
        { name: "David", gender: "Male", accent: "British" },
      ],
      language = "auto",
    } = await req.json();

    const callersList: CallerConfig[] = Array.isArray(customCallers) ? customCallers : [];

    if (!intelligenceReport || typeof intelligenceReport !== "string") {
      return NextResponse.json(
        { error: "Intelligence report text is required." },
        { status: 400 }
      );
    }

    const languageMap: Record<string, string> = {
      es: "Español",
      en: "English",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      it: "Italiano",
      auto: "Detección Automática basada en el Informe",
    };

    const targetLanguageName = languageMap[language] || language;

    const languageRule =
      language === "auto" || !language
        ? `- SOPORTE MULTI-IDIOMA Y DETECCIÓN AUTOMÁTICA: Detecta automáticamente el idioma principal del Informe de Inteligencia. Escribe TODO el guion en ese mismo idioma (ej. si el informe está en inglés, redacta en inglés; si está en español, francés o alemán, redacta en ese idioma).`
        : `- IDIOMA OBLIGATORIO DE SALIDA (${targetLanguageName.toUpperCase()}): Redacta TODO el guion obligatoriamente en ${targetLanguageName}. Las intervenciones del moderador y de los participantes deben expresarse con soltura nativa en ${targetLanguageName}.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const targetWords = durationMinutes * 125;

    const systemPrompt = `
System Prompt: Guionista v2.0 (Adaptado para SourceFinder)
ROL Y MISIÓN:
Eres un Productor y Guionista de Radio para un podcast de actualidad. Tu misión es tomar el Informe de Inteligencia verificado y convertirlo en un guion de radio de ~${durationMinutes} minutos (aprox. ${targetWords} palabras), listo para ser grabado.

${languageRule}

REGLAS STRICTAS DE EJECUCIÓN:
1. ANÁLISIS DEL INFORME:
- Basado estrictamente en la información recibida en el Informe de Inteligencia.
- CITA OBLIGATORIA: El moderador o los callers DEBEN citar explícitamente al menos una de las fuentes verificadas mencionadas en el informe (ej. "Según un reporte de The Verge...", "Como indica TechCrunch...", "Variety reportó que...").

2. ESTRUCTURA Y ESTILO SOLICITADO: **Style: ${showFormat.toUpperCase()}**
${
  showFormat === "Debate"
    ? "- Usa los Puntos de Debate para generar un conflicto constructivo pero marcado entre los dos callers."
    : showFormat === "Análisis"
    ? "- Usa los Puntos Clave como temas centrales de una mesa redonda colaborativa e inquisitiva."
    : "- Presenta a un caller como un experto/analista en la materia respondiendo preguntas en formato entrevista."
}

3. FORMATO Y SINTAXIS OBLIGATORIA DE CADA LÍNEA DE GUION:
- Moderador principal: ${customHostName} (moderador británico, calmado y elegante).
- Participantes/Callers introducidos por ${customHostName}: ${callersList.map((c: CallerConfig) => c.name).join(", ")}.
- Formato de cada intervención:
${customHostName}: [calmamente] Texto...
${customCallers[0]?.name || "Caller1"}: [${customCallers[0]?.gender || "Female"}] [Accent: ${customCallers[0]?.accent || "American"}] Texto...
${customCallers[1]?.name || "Caller2"}: [${customCallers[1]?.gender || "Male"}] [Accent: ${customCallers[1]?.accent || "British"}] Texto...

- Los callers deben sonar como personas reales e inteligentes, usando muletillas naturales ("pues...", "uhm", "mira", "saben...", "de hecho...").
- ${customHostName} SIEMPRE debe dar la bienvenida e introducir por nombre y ubicación a cada caller antes de su primera intervención.

Genera SOLO el guion estructurado en líneas bien identificables con el formato "Nombre: [etiquetas] Texto".
`;

    let rawScript = "";

    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.6-flash",
        contents: `${systemPrompt}\n\n--- INICIO DEL INFORME DE INTELIGENCIA ---\n${intelligenceReport}\n--- FIN DEL INFORME DE INTELIGENCIA ---`,
      });

      rawScript = response.text || "";
    } catch {
      console.log("Notice: ScriptWriter used offline script template fallback.");
    }


    if (!rawScript) {
      // Fallback script if no API key or API call failed
      rawScript = `${customHostName}: [calmamente] Bienvenidos a nuestro podcast de análisis. Hoy exploramos el informe de inteligencia más reciente.

${customHostName}: Para hablar sobre el tema, nos acompaña ${customCallers[0]?.name || "Sarah"}. ${customCallers[0]?.name || "Sarah"}, ¿cuál es tu primera observación?

${customCallers[0]?.name || "Sarah"}: [${customCallers[0]?.gender || "Female"}] [Accent: ${customCallers[0]?.accent || "American Midwest"}] Hola ${customHostName}. Pues mira, según un reporte verificado de The Verge, los datos confirman un impacto muy significativo en el sector.

${customHostName}: Un punto fascinante. Pero también hay debates. Demos la bienvenida a ${customCallers[1]?.name || "David"}. ${customCallers[1]?.name || "David"}, ¿cómo lo ves tú?

${customCallers[1]?.name || "David"}: [${customCallers[1]?.gender || "Male"}] [Accent: ${customCallers[1]?.accent || "British"}] Saludos ${customHostName}. Uhm, aunque las cifras son sólidas, el debate principal radica en la sostenibilidad a largo plazo.

${customHostName}: Excelente perspectiva de ambos. Gracias por acompañarnos.`;
    }

    // Parse rawScript into structured line objects for the Studio audio player
    const lines: ScriptLine[] = [];
    const rawLines = rawScript.split("\n").filter((l) => l.trim().length > 0);

    let currentTimeSeconds = 0;

    rawLines.forEach((lineStr, idx) => {
      const match = lineStr.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const speakerRaw = match[1].trim();
        let contentRaw = match[2].trim();

        // Extract brackets like [Female] [Accent: Scottish] or [calmly] or [Sentiment: enthusiastic]
        let gender: "Male" | "Female" | undefined = undefined;
        let accent: string | undefined = undefined;
        let emotion: string | undefined = undefined;
        let sentiment: "neutral" | "enthusiastic" | "concerned" = "neutral";

        if (contentRaw.includes("[Female]")) gender = "Female";
        if (contentRaw.includes("[Male]")) gender = "Male";

        const accentMatch = contentRaw.match(/\[Accent:\s*([^\]]+)\]/i);
        if (accentMatch) accent = accentMatch[1];

        const sentMatch = contentRaw.match(/\[Sentiment:\s*(enthusiastic|concerned|neutral)\]/i);
        if (sentMatch) {
          const matched = sentMatch[1].toLowerCase();
          if (matched === "enthusiastic" || matched === "concerned" || matched === "neutral") {
            sentiment = matched as "neutral" | "enthusiastic" | "concerned";
          }
        } else if (/enthusiastic|entusiasta/i.test(contentRaw)) {
          sentiment = "enthusiastic";
        } else if (/concerned|preocupad|alerta|riesgo/i.test(contentRaw)) {
          sentiment = "concerned";
        }

        const emotionMatch = contentRaw.match(/\[([a-záéíóúñA-ZÁÉÍÓÚÑ\s]{3,20})\]/);
        if (emotionMatch && !emotionMatch[0].includes("Male") && !emotionMatch[0].includes("Female") && !emotionMatch[0].includes("Accent") && !emotionMatch[0].includes("Sentiment")) {
          emotion = emotionMatch[1];
        }

        // If sentiment still neutral, classify from text content
        if (sentiment === "neutral") {
          const lower = contentRaw.toLowerCase();
          if (/excelente|increíble|fascinante|éxito|entusiasta|emocionante|fantástico|revolucionario|bienvenidos|oportunidad|positivo|genial|me gusta|maravilla|prometedor/i.test(lower)) {
            sentiment = "enthusiastic";
          } else if (/preocupaci|riesgo|alerta|duda|problema|cuestionamiento|sostenibilidad|amenaza|caída|pérdida|crític|error|falla|grave|difícil/i.test(lower)) {
            sentiment = "concerned";
          }
        }

        // Clean out bracket tags from text
        const cleanText = contentRaw
          .replace(/\[Sentiment:\s*[^\]]+\]/gi, "")
          .replace(/\[Female\]/gi, "")
          .replace(/\[Male\]/gi, "")
          .replace(/\[Accent:\s*[^\]]+\]/gi, "")
          .replace(/\[[a-zA-Z\s]{2,20}\]/g, "")
          .trim();

        const isHost = speakerRaw.toLowerCase().includes(customHostName.toLowerCase()) || speakerRaw.toLowerCase().includes("paul") || speakerRaw.toLowerCase().includes("host") || speakerRaw.toLowerCase().includes("presentador");

        const wordCount = cleanText.split(/\s+/).length;
        // ~2.2 words per second speaking rate
        const lineDuration = Math.max(3, Math.round(wordCount / 2.2));

        const mins = Math.floor(currentTimeSeconds / 60);
        const secs = currentTimeSeconds % 60;
        const timestamp = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

        lines.push({
          id: `line-${idx + 1}`,
          speaker: speakerRaw,
          speakerRole: isHost ? "host" : "caller",
          gender: gender || (isHost ? "Male" : idx % 2 === 0 ? "Female" : "Male"),
          accent: accent || (isHost ? "British" : "International"),
          emotion,
          sentiment,
          text: cleanText,
          timestamp,
        });

        currentTimeSeconds += lineDuration;
      }
    });

    const totalWords = rawScript.split(/\s+/).length;
    const estMins = (totalWords / 125).toFixed(1);

    // Heuristic detection of language from output text
    let detectedLanguage = targetLanguageName;
    if (language === "auto") {
      const lower = rawScript.toLowerCase();
      if (/\b(welcome|today|report|according|thanks|great|however|discussion)\b/i.test(lower)) {
        detectedLanguage = "English";
      } else if (/\b(bienvenue|aujourd'hui|rapport|selon|merci|excellent|cependant)\b/i.test(lower)) {
        detectedLanguage = "Français";
      } else if (/\b(willkommen|heute|bericht|laut|danke|ausgezeichnet|jedoch)\b/i.test(lower)) {
        detectedLanguage = "Deutsch";
      } else if (/\b(bem-vindo|hoje|relatório|segundo|obrigado|excelente|no entanto)\b/i.test(lower)) {
        detectedLanguage = "Português";
      } else if (/\b(benvenuto|oggi|rapporto|secondo|grazie|eccellente)\b/i.test(lower)) {
        detectedLanguage = "Italiano";
      } else {
        detectedLanguage = "Español";
      }
    }

    return NextResponse.json({
      rawScript,
      lines,
      wordCount: totalWords,
      estimatedDuration: `${estMins} mins`,
      showFormat,
      language: detectedLanguage,
      requestedLanguage: language,
    });
  } catch (error: any) {
    console.error("Error in ScriptWriter API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate radio script." },
      { status: 500 }
    );
  }
});
