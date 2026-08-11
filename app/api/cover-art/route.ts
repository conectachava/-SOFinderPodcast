import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, generateContentWithFallback } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { topic = "Podcast Especial", scriptText = "", style = "minimalist vibrant podcast cover art" } = await req.json();

    let coverArtUrl: string | null = null;
    let promptUsed = `A professional 1:1 aspect ratio podcast cover art for an episode titled "${topic}". Style: ${style}, high contrast, clean typography, vibrant modern aesthetic, digital art.`;

    try {
      // Try generating image with Gemini image model
      const response = await generateContentWithFallback({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: promptUsed }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || "image/png";
            coverArtUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (geminiErr) {
      console.warn("Gemini cover art generation notice:", geminiErr);
    }

    // High quality fallback image url if no inline base64 image returned
    if (!coverArtUrl) {
      const cleanTopic = encodeURIComponent(topic.substring(0, 30));
      coverArtUrl = `https://picsum.photos/seed/${cleanTopic}/600/600`;
    }

    return NextResponse.json({
      success: true,
      coverArtUrl,
      promptUsed,
      topic,
    });
  } catch (error: any) {
    console.error("Error in cover art API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate cover art." },
      { status: 500 }
    );
  }
}

