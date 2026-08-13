import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  const prompt = `Analiza el siguiente texto y extrae los 3 puntos clave más importantes. Devuelve una lista JSON con 3 strings. 
  Texto: ${content}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    // Simplistic parsing for the AI result
    const text = response.text || "";
    const takeaways = text.split('\n').filter(line => line.trim() !== '').slice(0, 3);
    
    return NextResponse.json({ takeaways });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
