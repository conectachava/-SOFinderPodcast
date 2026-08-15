import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, generateContentWithFallback } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export interface StoryboardCharacter {
  name: string;
  description: string;
}

export interface StoryboardScene {
  scene_id: number;
  speaker: string;
  visual_type: string;
  flow_video_prompt: string;
  audio_cue: string;
  transition: string;
  effects: string;
}

export interface StoryboardData {
  characters: Record<string, string>;
  scenes: StoryboardScene[];
}

// Helpers
function extractSpeakersFromScript(scriptText: string): string[] {
  const lines = scriptText.split('\n');
  const speakers = new Set<string>();
  lines.forEach(line => {
    const match = line.match(/^\[([^\]]+)\]/);
    if (match) speakers.add(match[1]);
  });
  return Array.from(speakers);
}

async function generateCharacterDescription(name: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await generateContentWithFallback({
    model: "gemini-3.5-flash",
    contents: `Genera una descripción física profesional, hiperrealista y detallada para un locutor de podcast llamado "${name}". Incluye su estilo, ropa, micrófono, fondo de estudio y el tag --ar 16:9 al final.`,
  });
  return response.text || "A professional podcast host.";
}

const SYSTEM_PROMPT = `
**ROL Y MISIÓN**
Eres el Director de Arte Visual y Storyboarder de VSNRY LABS. Tu trabajo es leer un guion de podcast de audio y convertirlo en un Storyboard Visual estructurado en JSON para generar videos en Flow.

**REGLAS DE EJECUCIÓN**
1. **Consistencia de Personajes (Characters):** Utiliza las descripciones proporcionadas para cada locutor.
2. **Escenas Dinámicas (Scenes):** Divide el guion en escenas de entre 5 y 15 segundos. 
3. **Alternancia de Planos:** No dejes a los locutores hablando todo el tiempo. Intercala:
   - "Talking Head" (El locutor hablando, movimiento sutil de rostro).
   - "B-Roll/Concept" (Metáforas visuales de alta calidad: chips de silicio, datos abstractos, calles de ciudades, etc., relevantes a lo que se dice).
   - "Studio Wide Angle" o "Detail Shot" (Planos de micrófonos, luces ON AIR).
4. **Formato Estricto de Flow Video:** Redacta prompts optimizados para IA de Video, enfocados en movimientos de cámara suaves ("slow pan", "subtle motion", "cinematic lighting"). Evita verbos complejos de acción para prevenir deformaciones.
5. **JSON Output:** Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con la estructura:
{
  "scenes": [
    {
      "scene_id": 1,
      "speaker": "LocutorA",
      "visual_type": "Intro/B-Roll",
      "flow_video_prompt": "Prompt visual...",
      "audio_cue": "Fragmento audio...",
      "transition": "Cut",
      "effects": "efectos..."
    }
  ]
}
`;

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const { scriptText, scriptLines } = await req.json();

    if (!scriptText && (!scriptLines || scriptLines.length === 0)) {
      return NextResponse.json(
        { error: "scriptText or scriptLines is required" },
        { status: 400 }
      );
    }

    const inputScript =
      scriptText ||
      (Array.isArray(scriptLines)
        ? scriptLines.map((l: any) => `[${l.speaker}]: ${l.text}`).join("\n")
        : "");

    const db = getAdminDb();
    const speakerNames = extractSpeakersFromScript(inputScript);
    const characters: { [key: string]: string } = {};

    for (const name of speakerNames) {
      const characterRef = db.collection('podcast_characters').doc(name);
      const doc = await characterRef.get();

      if (doc.exists) {
        characters[name] = doc.data()?.description;
      } else {
        const newDescription = await generateCharacterDescription(name);
        await characterRef.set({ name: name, description: newDescription, createdAt: new Date() });
        characters[name] = newDescription;
      }
    }

    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `${SYSTEM_PROMPT}\n\n**PERSONAJES:**\n${JSON.stringify(characters)}\n\n**GUION DE PODCAST:**\n${inputScript}`,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.scenes) {
          return NextResponse.json({ storyboard: { characters, scenes: parsed.scenes } });
        }
      }
    } catch (e) {
      console.error("Storyboard generation error:", e);
    }

    return NextResponse.json({ error: "Failed to generate storyboard" }, { status: 500 });
  } catch (error: any) {
    console.error("Storyboard error:", error);
    return NextResponse.json(
      { error: error?.message || "Storyboard generation failed" },
      { status: 500 }
    );
  }
});
