import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFallback, formatGeminiError } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export interface SubtopicItem {
  sequenceNumber: number;
  title: string;
  description: string;
  keyQuestions: string[];
  suggestedDuration: string;
  recommendedAngle: string;
  keywords: string[];
}

export interface TopicDecompositionResult {
  mainTopic: string;
  narrativeIdentity: string;
  targetAudience: string;
  suggestedSeriesTitle: string;
  subtopics: SubtopicItem[];
}

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, contentType = "General", targetCount = 4 } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { ok: false, error: "Por favor proporciona un tema válido para analizar y descomponer." },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Number(targetCount) || 4, 3), 8);

    const prompt = `Eres un Estratega Editorial de Podcasts y Productor de Contenido de Alto Impacto.
Tu misión es analizar el tema principal proporcionado por el usuario y descomponerlo en una SECUENCIA LÓGICA, COHERENTE Y NARRATIVA de ${count} SUBTEMAS / EPISODIOS SECUENCIALES.

Tema Principal a Analizar: "${topic.trim()}"
Tipo de Contenido / Enfoque: "${contentType}"

Instrucciones de Análisis:
1. Extrae la "Identidad Narrativa" (Narrative Arc) que conecte todos los subtemas para mantener una voz, hilo conductor e identidad constante en toda la serie.
2. Propón un "Título de la Serie / Minicurso" llamativo.
3. Genera exactamente ${count} subtemas estructurados en estricto orden secuencial pedagógico o cronológico (del fundamento a la aplicación avanzada o análisis profundo).
4. Para cada subtopic, provee un título específico, una breve descripción de lo que se hablará, 3 preguntas o puntos clave a cubrir, la duración recomendada y el ángulo/enfoque clave.

DEBES responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta (sin texto ni markdown adicional fuera del JSON):

{
  "mainTopic": "${topic.trim().replace(/"/g, '\\"')}",
  "suggestedSeriesTitle": "Título creativo y atractivo de la serie de podcast o especial",
  "narrativeIdentity": "Descripción concisa (2-3 frases) de la premisa central, tono e hilo conductor que unifica la secuencia.",
  "targetAudience": "Perfil del oyente ideal al que se dirige esta secuencia",
  "subtopics": [
    {
      "sequenceNumber": 1,
      "title": "Título del Subtema / Episodio 1",
      "description": "Resumen claro del contenido que se abordará en esta entrega.",
      "keyQuestions": [
        "Pregunta o punto clave 1",
        "Pregunta o punto clave 2",
        "Pregunta o punto clave 3"
      ],
      "suggestedDuration": "3-5 minutos",
      "recommendedAngle": "Enfoque o perspectiva con la que debe tratarse este subtema",
      "keywords": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const response = await generateContentWithFallback({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("La IA no devolvió un formato JSON válido para la secuencia de subtemas.");
    }

    const parsedData: TopicDecompositionResult = JSON.parse(jsonMatch[0]);

    if (!parsedData.subtopics || !Array.isArray(parsedData.subtopics) || parsedData.subtopics.length === 0) {
      throw new Error("No se devolvieron subtemas estructurados.");
    }

    // Sanitize sequence numbers and clean array
    parsedData.subtopics = parsedData.subtopics.map((item, idx) => ({
      sequenceNumber: idx + 1,
      title: item.title || `Subtema ${idx + 1}`,
      description: item.description || "Descripción del subtema.",
      keyQuestions: Array.isArray(item.keyQuestions) ? item.keyQuestions : [],
      suggestedDuration: item.suggestedDuration || "3-5 min",
      recommendedAngle: item.recommendedAngle || "Análisis Informativo",
      keywords: Array.isArray(item.keywords) ? item.keywords : [contentType],
    }));

    return NextResponse.json({
      ok: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error en /api/topic-decomposer:", error);
    return NextResponse.json(
      {
        ok: false,
        error: formatGeminiError(error),
      },
      { status: 500 }
    );
  }
});
