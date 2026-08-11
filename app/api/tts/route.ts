import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const { text, voiceName = "Kore", multiSpeaker = false, speakers } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required for TTS" }, { status: 400 });
    }

    const ai = getGeminiClient();

    let config: any = {
      responseModalities: ["AUDIO"],
    };


    if (multiSpeaker && Array.isArray(speakers) && speakers.length >= 2) {
      config.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map((s: { speaker: string; voiceName: string }) => ({
            speaker: s.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voiceName || "Kore" },
            },
          })),
        },
      };
    } else {
      config.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config,
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      return NextResponse.json(
        { error: "No audio data returned from Gemini TTS API" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || "audio/pcm",
    });
  } catch {
    console.log("Notice: Speech generation API encountered an error.");
    return NextResponse.json(
      { error: "Speech generation failed." },
      { status: 500 }
    );
  }
});
