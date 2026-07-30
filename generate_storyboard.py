#!/usr/bin/env python3
"""
Storyboard-Writing Agent v1.0
Generates consistent character prompts and video scene prompts for Flow / AI Video.
"""

import argparse
import json
from pathlib import Path
import sys

# Simulación de llamada a la IA (en tu app real esto llama a la API de Gemini/OpenAI)
def GeminiAgent(system_prompt: str, user_input: str) -> str:
    """
    Simulates calling the Gemini agent to generate the visual storyboard.
    """
    print(f"--- AGENT_CALL: GeminiAgent for Storyboard ---")
    
    # Mock de respuesta JSON estructurada que el agente real devolverá
    mock_response = {
        "characters": {
            "Paul": "A realistic 40-year-old British male podcast host, short neat brown hair, wearing a black crewneck sweater and professional studio headphones. Sitting in front of a high-end podcast microphone. Dark studio background with warm soft golden lighting, shot on 35mm lens, photorealistic, cinematic, static camera, talking head --ar 16:9",
            "Sarah": "A realistic 28-year-old American female podcast host, long blonde hair tied in a neat ponytail, wearing a cozy gray hoodie. Sitting in front of a podcast microphone, modern cozy studio background with warm ambient light, photorealistic, extremely detailed skin texture, static camera, talking head --ar 16:9",
            "David": "A realistic 35-year-old British male, light beard, smart casual blue shirt, in a modern London flat studio background with soft natural lighting coming from a window, cinematic, static camera, talking head --ar 16:9"
        },
        "scenes": [
            {
                "scene_id": 1,
                "speaker": "Paul (Intro)",
                "visual_type": "Intro/B-Roll",
                "flow_video_prompt": "Cinematic slow motion shot of a professional studio red 'ON AIR' neon sign flickering in a dark modern broadcasting room, shallow depth of field, warm atmosphere, 4k, realistic --ar 16:9",
                "audio_cue": "Bienvenidos a nuestro programa...",
                "transition": "Smooth Fade In",
                "effects": "Subtle dust particles in the air, glowing neon"
            },
            {
                "scene_id": 2,
                "speaker": "Sarah",
                "visual_type": "Talking Head",
                "flow_video_prompt": "Using character image of Sarah: Sarah talking directly to the camera, talking head, natural eye blinking and subtle facial micro-expressions, podcast studio background, warm lighting --ar 16:9",
                "audio_cue": "Pues mira, según un reporte de The Verge...",
                "transition": "Quick Cut",
                "effects": "None"
            },
            {
                "scene_id": 3,
                "speaker": "Concept B-Roll",
                "visual_type": "B-Roll/Concept",
                "flow_video_prompt": "3D high-tech animation of digital data streams, neon blue and gold lines flowing through a microchip in a futuristic tech environment, clean motion graphics, high value content, captivating visual --ar 16:9",
                "audio_cue": "el nuevo chip A17 Bionic...",
                "transition": "Zoom In Cut",
                "effects": "Glow on data lines"
            },
            {
                "scene_id": 4,
                "speaker": "David",
                "visual_type": "Talking Head",
                "flow_video_prompt": "Using character image of David: David talking with hands, natural facial expressions, intelligent look, cozy London apartment background, cinematic lighting --ar 16:9",
                "audio_cue": "Sí, la potencia es real, pero ¿a qué costo?...",
                "transition": "Quick Cut",
                "effects": "None"
            },
            {
                "scene_id": 5,
                "speaker": "Paul (Outro)",
                "visual_type": "Studio Wide Angle",
                "flow_video_prompt": "Cinematic wide shot of an empty modern podcast studio with two professional microphones, glowing warm background lights, slow camera pan, late-night aesthetic --ar 16:9",
                "audio_cue": "Gracias a ambos por sus valiosas opiniones...",
                "transition": "Fade to Black",
                "effects": "De-focus camera blur at the end"
            }
        ]
    }
    return json.dumps(mock_response, indent=2)

class StoryboardGenerator:
    """
    Generates video scene prompts, character cards, and transitions 
    optimized for Flow Video from a radio/podcast script.
    """
    SYSTEM_PROMPT = """
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
5. **JSON Output:** Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con las llaves "characters" y "scenes".
"""

    def generate(self, script_text: str) -> str:
        # Aquí se fusiona el sistema con el input del usuario (el guion generado anteriormente)
        storyboard_json = GeminiAgent(
            system_prompt=self.SYSTEM_PROMPT,
            user_input=script_text
        )
        return storyboard_json

def main():
    parser = argparse.ArgumentParser(description="Storyboard Generator for Flow Video")
    parser.add_argument("--script_path", type=Path, required=True, help="Path to the script.md file.")
    parser.add_argument("--output_path", type=Path, required=True, help="Path to save the storyboard.json.")
    args = parser.parse_args()

    print("=== Visual Storyboard Generation (Flow Video) ===")
    
    # 1. Leer el guion generado
    try:
        script_text = args.script_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"ERROR: No se pudo leer el guion: {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Generar el storyboard
    generator = StoryboardGenerator()
    storyboard = generator.generate(script_text)

    # 3. Guardar el JSON del Storyboard
    try:
        args.output_path.parent.mkdir(parents=True, exist_ok=True)
        args.output_path.write_text(storyboard, encoding="utf-8")
        print(f"✅ Storyboard de Video guardado con éxito en: {args.output_path}")
    except Exception as e:
        print(f"ERROR: No se pudo guardar el Storyboard: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
