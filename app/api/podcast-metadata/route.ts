import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getGeminiClient, generateContentWithFallback } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const { topic, script, lines } = await req.json();

    const scriptText =
      script ||
      (Array.isArray(lines)
        ? lines.map((l: any) => `[${l.timestamp || "0:00"}] ${l.speaker}: ${l.text}`).join("\n")
        : "");

    if (!scriptText || typeof scriptText !== "string") {
      return NextResponse.json(
        { error: "No script content provided for metadata generation." },
        { status: 400 }
      );
    }

    try {
      const ai = getGeminiClient();

      const prompt = `
System Prompt: Podcast Metadata & Hosting Optimizer Engine v1.0
Misión: Analizar el guion de podcast y el tema principal proporcionados para generar metadatos altamente optimizados para plataformas de distribución (Spotify, Apple Podcasts, YouTube Podcasts, RSS).

Tema del episodio: ${topic || "Podcast Episode"}

Guion del episodio:
---
${scriptText.slice(0, 8000)}
---

Requisitos de Salida:
1. "title": Título sugerente, directo, optimizado para SEO y CTR (máximo 70 caracteres).
2. "description": Resumen profesional y atractivo del episodio (150-250 palabras) con llamada a la acción.
3. "showNotes": Lista de notas del programa organizadas cronológicamente con marcas de tiempo (timestamp), título de sección y breve descripción.
4. "hashtags": Array de 6 a 10 hashtags altamente relevantes y populares en formato "#Hashtag".
5. "platformOptimization": Consejos específicos para Spotify, Apple Podcasts y YouTube.
`;

      const response = await generateContentWithFallback({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título optimizado para SEO" },
              description: { type: Type.STRING, description: "Descripción completa del episodio" },
              showNotes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING, description: "Marca de tiempo ej. '01:15'" },
                    title: { type: Type.STRING, description: "Título de la sección" },
                    description: { type: Type.STRING, description: "Punto clave o resumen" },
                  },
                  required: ["timestamp", "title", "description"],
                },
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              platformOptimization: {
                type: Type.OBJECT,
                properties: {
                  spotifyTip: { type: Type.STRING },
                  applePodcastsTip: { type: Type.STRING },
                  youtubeTip: { type: Type.STRING },
                },
                required: ["spotifyTip", "applePodcastsTip", "youtubeTip"],
              },
            },
            required: ["title", "description", "showNotes", "hashtags", "platformOptimization"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return NextResponse.json(parsed);
      }
    } catch (err) {
      console.warn("[Podcast Metadata Gemini API Warning]:", err);
    }

    // Fallback generation logic if Gemini API key is unavailable or errored
    const fallbackTitle = `Episodio Especial: ${topic || "Análisis en Profundidad y Debate"}`;
    const fallbackDescription = `En este episodio exploramos a fondo el tema "${topic || "Análisis Tecnológico"}". Acompaña a nuestro panel de expertos en una conversación dinámica con datos clave, perspectivas críticas y previsiones estratégicas para el futuro.`;
    const fallbackShowNotes = [
      { timestamp: "00:00", title: "Introducción y Contexto", description: "Apertura del episodio y planteamiento de las preguntas fundamentales." },
      { timestamp: "02:15", title: "Análisis de Datos y Fuentes", description: "Revisión de reportes clave y evidencia verificada." },
      { timestamp: "05:40", title: "Debate y Perspectivas de Expertos", description: "Discusión entre Host y Analista sobre las implicaciones." },
      { timestamp: "08:10", title: "Conclusiones y Recomendaciones", description: "Cierre del episodio y llamadas a la acción para la audiencia." },
    ];
    const fallbackHashtags = [
      "#Podcast",
      "#PodcastEspanol",
      `#${(topic || "Tech").replace(/\s+/g, "")}`,
      "#Analisis",
      "#SpotifyPodcasts",
      "#ApplePodcasts",
      "#SourceFinder",
    ];

    return NextResponse.json({
      title: fallbackTitle,
      description: fallbackDescription,
      showNotes: fallbackShowNotes,
      hashtags: fallbackHashtags,
      platformOptimization: {
        spotifyTip: "Incluye las marcas de tiempo en la descripción para habilitar capítulos automáticos en Spotify.",
        applePodcastsTip: "Configura las etiquetas de temporada y episodio en tu feed RSS para mejor indexación en Apple.",
        youtubeTip: "Añade los hashtags al final de la descripción de YouTube y agrega tarjetas interactiva en 08:10.",
      },
    });
  } catch (error: any) {
    console.error("Error generating podcast metadata:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate podcast metadata" },
      { status: 500 }
    );
  }
});
