import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAiApiValidation } from "@/lib/middleware";
import { OrchestratorResponseSchema } from "@/lib/schemas";

// --- ESQUEMAS DE VALIDACIÓN (Validation Gates) ---
const SourceFinderReportSchema = z.object({
  report: z.string().min(50, { message: "El informe de inteligencia parece demasiado corto o corrupto." }),
});

const ScriptWriterOutputSchema = z.object({
  rawScript: z.string().min(50, { message: "El guion generado parece demasiado corto o corrupto." }),
});

export const dynamic = "force-dynamic";

export const POST = withAiApiValidation(async function POST(req: NextRequest) {
  try {
    const { topic, contentType = "General", showFormat = "Debate", durationMinutes = 3 } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const internalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-aistudio-client": "sourcefinder-app",
      "x-internal-token": "internal-orchestrator",
    };

    const clientAuthHeader = req.headers.get("authorization");
    if (clientAuthHeader) {
      internalHeaders["authorization"] = clientAuthHeader;
    }

    // Step 1: SourceFinder
    const sfRes = await fetch(`${baseUrl}/api/source-finder`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({ topic, contentType }),
    });

    const sfText = await sfRes.text();
    let sfData: any = {};
    try { sfData = JSON.parse(sfText); } catch {}

    if (!sfRes.ok) {
      throw new Error(`SourceFinder step failed: ${sfData.error || sfRes.statusText || "Server error"}`);
    }

    // V A L I D A T I O N   G A T E   #1
    const validation1 = SourceFinderReportSchema.safeParse(sfData);
    if (!validation1.success) {
      console.error("Validation Gate 1 falló:", validation1.error.message);
      throw new Error(`El informe del SourceFinder no superó la validación: ${validation1.error.message}`);
    }
    const informeValidado = validation1.data.report;

    // Step 2: ScriptWriter
    const swRes = await fetch(`${baseUrl}/api/script-writer`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({
        intelligenceReport: informeValidado,
        showFormat,
        durationMinutes,
      }),
    });

    const swText = await swRes.text();
    let swData: any = {};
    try { swData = JSON.parse(swText); } catch {}

    if (!swRes.ok) {
      throw new Error(`ScriptWriter step failed: ${swData.error || swRes.statusText || "Server error"}`);
    }

    // V A L I D A T I O N   G A T E   #2
    const validation2 = ScriptWriterOutputSchema.safeParse(swData);
    if (!validation2.success) {
      console.error("Validation Gate 2 falló:", validation2.error.message);
      throw new Error(`El guion generado no superó la validación: ${validation2.error.message}`);
    }
    const guionValidado = validation2.data.rawScript;

    // Step 3: Storyboard Generator (Flow Video)
    let storyboardData = null;
    try {
      const sbRes = await fetch(`${baseUrl}/api/storyboard`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          scriptText: guionValidado,
          scriptLines: swData.lines,
        }),
      });

      if (sbRes.ok) {
        const sbText = await sbRes.text();
        const sbResult = JSON.parse(sbText);
        storyboardData = sbResult.storyboard;
      }
    } catch (sbErr) {
      console.warn("Storyboard generation step skipped/warning:", sbErr);
    }

    // Step 4: AI Cover Art Generator (Gemini Image Generation)
    let coverArtUrl = null;
    try {
      const caRes = await fetch(`${baseUrl}/api/cover-art`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          topic,
          scriptText: guionValidado,
        }),
      });

      if (caRes.ok) {
        const caResult = await caRes.json();
        coverArtUrl = caResult.coverArtUrl;
      }
    } catch (caErr) {
      console.warn("Cover art generation step skipped/warning:", caErr);
    }

    const result = {
      topic,
      contentType,
      showFormat,
      durationMinutes,
      intelligenceReport: informeValidado,
      scriptText: guionValidado,
      scriptLines: swData.lines || [],
      wordCount: swData.wordCount || 0,
    };
    
    // Validate with Zod
    const validatedData = OrchestratorResponseSchema.parse(result);

    return NextResponse.json({
      ...validatedData,
      qualifiedSources: sfData.qualifiedSources,
      rawSources: sfData.rawSources,
      storyboard: storyboardData,
      coverArtUrl,
      estimatedDuration: swData.estimatedDuration,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Pipeline orchestration failed:", err);
    return NextResponse.json(
      { error: "Pipeline orchestration failed", details: err.message },
      { status: 500 }
    );
  }
});
