import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, generateContentWithFallback } from "@/lib/gemini";
import { withAiApiValidation } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export interface CoverArtStylePreset {
  id: string;
  label: string;
  promptDescriptor: string;
}

const STYLE_DESCRIPTORS: Record<string, string> = {
  editorial_minimal:
    "Swiss editorial minimalist podcast cover design, bold geometric Bauhaus shapes, clean negative space, modern magazine aesthetic, razor-sharp vector composition",
  cyberpunk_neon:
    "Futuristic cyberpunk studio aesthetic, glowing neon circuitry and soundwaves, deep obsidian background with electric cyan and magenta rim lighting, high-tech digital art",
  "3d_isometric":
    "Tactile 3D isometric broadcast studio render, studio condenser microphone and acoustic panels, soft global illumination, Pixar/Octane stylized 3D render, rich depth of field",
  cinematic_doc:
    "Cinematic documentary key art, dramatic chiaroscuro lighting, investigative journalism mood, subtle anamorphic lens flare, moody atmospheric photography style",
  pop_debate:
    "Vibrant modern pop-art debate illustration, dynamic contrasting halves, expressive editorial screenprint texture, energetic broadcast visual identity",
  watercolor_essay:
    "Fine-art editorial watercolor and ink illustration, organic textures, warm archival paper tones, intellectual cultural podcast cover aesthetic",
};

const PALETTE_DESCRIPTORS: Record<string, { prompt: string; primary: string; secondary: string; accent: string; bg: string }> = {
  indigo_emerald: {
    prompt: "deep midnight indigo (#0f172a), electric royal blue (#4f46e5), and vibrant studio emerald (#10b981)",
    primary: "#4f46e5",
    secondary: "#10b981",
    accent: "#38bdf8",
    bg: "#090d16",
  },
  amber_obsidian: {
    prompt: "warm broadcast gold (#f59e0b), burnt orange (#ea580c), and rich obsidian charcoal (#111827)",
    primary: "#f59e0b",
    secondary: "#ea580c",
    accent: "#fde68a",
    bg: "#120f0d",
  },
  crimson_slate: {
    prompt: "editorial crimson (#e11d48), rose neon (#fb7185), and dark slate (#0f172a)",
    primary: "#e11d48",
    secondary: "#6366f1",
    accent: "#fda4af",
    bg: "#140a10",
  },
  cyber_cyan: {
    prompt: "neon cyan (#06b6d4), ultraviolet purple (#9333ea), and deep space navy (#030712)",
    primary: "#06b6d4",
    secondary: "#9333ea",
    accent: "#67e8f9",
    bg: "#050b14",
  },
  monochrome_editorial: {
    prompt: "high-contrast monochrome black, platinum silver, warm ivory, and a single surgical cobalt accent",
    primary: "#f8fafc",
    secondary: "#64748b",
    accent: "#3b82f6",
    bg: "#09090b",
  },
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFallbackSvgCoverArt(params: {
  topic: string;
  style: string;
  colorPalette: string;
  aspectRatio: string;
  customPrompt?: string;
}): string {
  const palette = PALETTE_DESCRIPTORS[params.colorPalette] || PALETTE_DESCRIPTORS.indigo_emerald;
  const width = params.aspectRatio === "16:9" ? 1280 : params.aspectRatio === "9:16" ? 720 : 1024;
  const height = params.aspectRatio === "16:9" ? 720 : params.aspectRatio === "9:16" ? 1280 : 1024;

  const cleanTitle = (params.topic || "Episodio Especial").trim().slice(0, 68);
  const words = cleanTitle.split(/\s+/);
  const line1 = words.slice(0, 4).join(" ");
  const line2 = words.slice(4, 8).join(" ");
  const line3 = words.slice(8, 13).join(" ");

  const subtitle = (params.customPrompt || params.style || "IMAGEN AI STUDIO COVER")
    .replace(/[_-]/g, " ")
    .toUpperCase()
    .slice(0, 48);

  const cx = Math.round(width / 2);
  const cy = Math.round(height * 0.44);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0.42"/>
        <stop offset="55%" stop-color="${palette.secondary}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${palette.bg}" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.primary}"/>
        <stop offset="50%" stop-color="${palette.secondary}"/>
        <stop offset="100%" stop-color="${palette.accent}"/>
      </linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${palette.accent}" stroke-width="0.7" stroke-opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="${palette.bg}"/>
    <rect width="100%" height="100%" fill="url(#bgGlow)"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    
    <!-- Acoustic Concentric Rings -->
    <circle cx="${cx}" cy="${cy}" r="${Math.round(Math.min(width, height) * 0.34)}" fill="none" stroke="url(#accentGrad)" stroke-width="2" stroke-opacity="0.35" stroke-dasharray="10 8"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(Math.min(width, height) * 0.25)}" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.28"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(Math.min(width, height) * 0.16)}" fill="${palette.primary}" fill-opacity="0.16" stroke="url(#accentGrad)" stroke-width="3"/>

    <!-- Dynamic Soundwave Bars -->
    <g transform="translate(${cx - 165}, ${cy - 45})">
      ${Array.from({ length: 22 })
        .map((_, idx) => {
          const barH = 24 + Math.round(Math.abs(Math.sin(idx * 0.65 + cleanTitle.length)) * 72);
          const y = 45 - Math.round(barH / 2);
          return `<rect x="${idx * 15}" y="${y}" width="8" height="${barH}" rx="4" fill="url(#accentGrad)" opacity="${(0.55 + (idx % 3) * 0.15).toFixed(2)}"/>`;
        })
        .join("")}
    </g>

    <!-- Editorial Header Badge -->
    <rect x="64" y="64" width="290" height="42" rx="21" fill="${palette.primary}" fill-opacity="0.24" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="1.5"/>
    <circle cx="92" cy="85" r="6" fill="${palette.secondary}"/>
    <text x="110" y="91" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" letter-spacing="2.5">SOURCEFINDER STUDIO</text>

    <!-- Bottom Editorial Title Card -->
    <rect x="56" y="${height - 290}" width="${width - 112}" height="234" rx="24" fill="#090d16" fill-opacity="0.82" stroke="${palette.accent}" stroke-opacity="0.3" stroke-width="1.5"/>
    <text x="88" y="${height - 242}" fill="${palette.accent}" font-family="monospace" font-size="15" font-weight="700" letter-spacing="3">${escapeXml(subtitle)}</text>
    <text x="88" y="${height - 192}" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900">${escapeXml(line1)}</text>
    ${line2 ? `<text x="88" y="${height - 144}" fill="#f1f5f9" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800">${escapeXml(line2)}</text>` : ""}
    ${line3 ? `<text x="88" y="${height - 98}" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="700">${escapeXml(line3)}</text>` : ""}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic = "Podcast Especial",
      scriptText = "",
      customPrompt = "",
      style = "editorial_minimal",
      colorPalette = "indigo_emerald",
      aspectRatio = "1:1",
      engine = "imagen-3",
      modifiers = [],
    } = body;

    const validAspectRatio = ["1:1", "16:9", "9:16", "4:3", "3:4"].includes(aspectRatio)
      ? aspectRatio
      : "1:1";

    const styleDescription =
      STYLE_DESCRIPTORS[style] ||
      style ||
      STYLE_DESCRIPTORS.editorial_minimal;

    const paletteObj =
      PALETTE_DESCRIPTORS[colorPalette] || PALETTE_DESCRIPTORS.indigo_emerald;

    const scriptSnippet = typeof scriptText === "string" && scriptText.trim().length > 0
      ? scriptText.trim().slice(0, 320)
      : "";

    const modifiersText = Array.isArray(modifiers) && modifiers.length > 0
      ? `Additional visual elements: ${modifiers.join(", ")}.`
      : "";

    const promptUsed = [
      `Create a bespoke, high-impact podcast episode cover artwork (${validAspectRatio} aspect ratio) for an episode titled "${topic}".`,
      customPrompt ? `Core visual concept: ${customPrompt}.` : "",
      scriptSnippet ? `Thematic context from episode script: ${scriptSnippet}.` : "",
      `Artistic direction: ${styleDescription}.`,
      `Color palette: ${paletteObj.prompt}.`,
      modifiersText,
      "Studio quality lighting, award-winning album and podcast cover composition, ultra-crisp details, no messy watermark.",
    ]
      .filter(Boolean)
      .join(" ");

    let coverArtUrl: string | null = null;
    let engineUsed = engine;

    // 1. Primary path: Try Imagen (generateImages) when requested or by default
    if (engine === "imagen-3" || engine === "imagen-4") {
      const imagenModel =
        engine === "imagen-4" ? "imagen-4.0-generate-001" : "imagen-3.0-generate-002";
      try {
        const client = getGeminiClient();
        const imagenRes = await client.models.generateImages({
          model: imagenModel,
          prompt: promptUsed,
          config: {
            numberOfImages: 1,
            aspectRatio: validAspectRatio,
            outputMimeType: "image/png",
          },
        });

        const imgBytes = imagenRes?.generatedImages?.[0]?.image?.imageBytes;
        if (imgBytes) {
          coverArtUrl = `data:image/png;base64,${imgBytes}`;
          engineUsed = imagenModel;
        }
      } catch (imagenErr: any) {
        console.warn(`[CoverArt Imagen Notice (${imagenModel})]:`, imagenErr?.message || imagenErr);
      }
    }

    // 2. Secondary path: Gemini Flash Image model (gemini-3.1-flash-lite-image)
    if (!coverArtUrl) {
      try {
        const response = await generateContentWithFallback({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: promptUsed }],
          },
          config: {
            imageConfig: {
              aspectRatio: validAspectRatio,
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              coverArtUrl = `data:${mime};base64,${part.inlineData.data}`;
              engineUsed = "gemini-3.1-flash-lite-image";
              break;
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn("[CoverArt Gemini Image Notice]:", geminiErr?.message || geminiErr);
      }
    }

    // 3. Deterministic bespoke SVG Studio Cover fallback if cloud image models are unreachable
    if (!coverArtUrl) {
      coverArtUrl = buildFallbackSvgCoverArt({
        topic,
        style,
        colorPalette,
        aspectRatio: validAspectRatio,
        customPrompt,
      });
      engineUsed = "imagen-studio-vector-synth";
    }

    return NextResponse.json({
      success: true,
      coverArtUrl,
      promptUsed,
      topic,
      style,
      colorPalette,
      aspectRatio: validAspectRatio,
      engineUsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in cover art API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate cover art." },
      { status: 500 }
    );
  }
});
