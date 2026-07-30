import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

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

const SYSTEM_PROMPT = `
**ROL Y MISIÓN**
Eres el Director de Arte Visual y Storyboarder de VSNRY LABS. Tu trabajo es leer un guion de podcast de audio y convertirlo en un Storyboard Visual estructurado en JSON para generar videos en Flow.

**REGLAS DE EJECUCIÓN**
1. **Consistencia de Personajes (Characters):** Crea descripciones físicas hiperrealistas e inmutables para cada locutor que aparezca en el guion (ej. Paul, Sarah, David). Describe su ropa, su rostro, su micrófono y el fondo de su estudio. Añade el tag '--ar 16:9' o '--ar 9:16' según el formato.
2. **Escenas Dinámicas (Scenes):** Divide el guion en escenas de entre 5 y 15 segundos. 
3. **Alternancia de Planos:** No dejes a los locutores hablando todo el tiempo. Intercala:
   - "Talking Head" (El locutor hablando, movimiento sutil de rostro).
   - "B-Roll/Concept" (Metáforas visuales de alta calidad: chips de silicio, datos abstractos, calles de ciudades, etc., relevantes a lo que se dice).
   - "Studio Wide Angle" o "Detail Shot" (Planos de micrófonos, luces ON AIR).
4. **Formato Estricto de Flow Video:** Redacta prompts optimizados para IA de Video, enfocados en movimientos de cámara suaves ("slow pan", "subtle motion", "cinematic lighting"). Evita verbos complejos de acción para prevenir deformaciones.
5. **JSON Output:** Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con la estructura:
{
  "characters": {
    "LocutorA": "descripción...",
    "LocutorB": "descripción..."
  },
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

const MOCK_STORYBOARD: StoryboardData = {
  characters: {
    Paul: "A realistic 40-year-old British male podcast host, short neat brown hair, wearing a black crewneck sweater and professional studio headphones. Sitting in front of a high-end podcast microphone. Dark studio background with warm soft golden lighting, shot on 35mm lens, photorealistic, cinematic, static camera, talking head --ar 16:9",
    Sarah: "A realistic 28-year-old American female podcast host, long blonde hair tied in a neat ponytail, wearing a cozy gray hoodie. Sitting in front of a podcast microphone, modern cozy studio background with warm ambient light, photorealistic, extremely detailed skin texture, static camera, talking head --ar 16:9",
    David: "A realistic 35-year-old British male, light beard, smart casual blue shirt, in a modern London flat studio background with soft natural lighting coming from a window, cinematic, static camera, talking head --ar 16:9",
  },
  scenes: [
    {
      scene_id: 1,
      speaker: "Paul (Intro)",
      visual_type: "Intro/B-Roll",
      flow_video_prompt:
        "Cinematic slow motion shot of a professional studio red 'ON AIR' neon sign flickering in a dark modern broadcasting room, shallow depth of field, warm atmosphere, 4k, realistic --ar 16:9",
      audio_cue: "Bienvenidos a nuestro programa...",
      transition: "Smooth Fade In",
      effects: "Subtle dust particles in the air, glowing neon",
    },
    {
      scene_id: 2,
      speaker: "Sarah",
      visual_type: "Talking Head",
      flow_video_prompt:
        "Using character image of Sarah: Sarah talking directly to the camera, talking head, natural eye blinking and subtle facial micro-expressions, podcast studio background, warm lighting --ar 16:9",
      audio_cue: "Pues mira, según un reporte de The Verge...",
      transition: "Quick Cut",
      effects: "None",
    },
    {
      scene_id: 3,
      speaker: "Concept B-Roll",
      visual_type: "B-Roll/Concept",
      flow_video_prompt:
        "3D high-tech animation of digital data streams, neon blue and gold lines flowing through a microchip in a futuristic tech environment, clean motion graphics, high value content, captivating visual --ar 16:9",
      audio_cue: "el nuevo chip A17 Bionic...",
      transition: "Zoom In Cut",
      effects: "Glow on data lines",
    },
    {
      scene_id: 4,
      speaker: "David",
      visual_type: "Talking Head",
      flow_video_prompt:
        "Using character image of David: David talking with hands, natural facial expressions, intelligent look, cozy London apartment background, cinematic lighting --ar 16:9",
      audio_cue: "Sí, la potencia es real, pero ¿a qué costo?...",
      transition: "Quick Cut",
      effects: "None",
    },
    {
      scene_id: 5,
      speaker: "Paul (Outro)",
      visual_type: "Studio Wide Angle",
      flow_video_prompt:
        "Cinematic wide shot of an empty modern podcast studio with two professional microphones, glowing warm background lights, slow camera pan, late-night aesthetic --ar 16:9",
      audio_cue: "Gracias a ambos por sus valiosas opiniones...",
      transition: "Fade to Black",
      effects: "De-focus camera blur at the end",
    },
  ],
};

export async function POST(req: NextRequest) {
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

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${SYSTEM_PROMPT}\n\n**GUION DE PODCAST:**\n${inputScript}`,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.characters && parsed.scenes) {
          return NextResponse.json({ storyboard: parsed });
        }
      }
    } catch {
      console.log("Notice: Storyboard used offline mock fallback.");
    }

    return NextResponse.json({ storyboard: MOCK_STORYBOARD });
  } catch (error: any) {
    console.error("Storyboard error:", error);
    return NextResponse.json(
      { error: error?.message || "Storyboard generation failed" },
      { status: 500 }
    );
  }
}
