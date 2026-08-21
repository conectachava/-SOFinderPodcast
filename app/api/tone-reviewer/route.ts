import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { script, format } = await req.json();

    if (!script) {
      return NextResponse.json(
        { error: "Se requiere el guion para la revisión de tono." },
        { status: 400 }
      );
    }

    const systemInstruction = `
Eres un editor experto en podcasts y guiones de radio.
Tu objetivo es analizar un guion de podcast y encontrar palabras o frases que no encajen con el tono deseado.
El formato del podcast es: ${format || "Informativo/Debate"}.
Debes identificar frases que sean demasiado informales, demasiado complejas (jerga innecesaria), o que rompan la fluidez de un podcast conversacional.

Responde ÚNICAMENTE con un JSON válido usando el siguiente esquema:
{
  "highlights": [
    {
      "text": "la frase exacta encontrada en el guion",
      "reason": "explicación breve de por qué no encaja",
      "suggestion": "una alternativa sugerida",
      "type": "informal" | "complex" | "awkward"
    }
  ]
}
No incluyas markdown, solo el JSON puro.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: script,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let parsedData = { highlights: [] };
    
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.error("Error parsing JSON from Gemini:", e);
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Tone Review API Error:", error);
    return NextResponse.json(
      { error: "Falló la revisión de tono.", details: error.message },
      { status: 500 }
    );
  }
}
