import { NextRequest, NextResponse } from "next/server";
import { withAiApiValidation } from "@/lib/middleware";

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

    // Step 2: ScriptWriter
    const swRes = await fetch(`${baseUrl}/api/script-writer`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({
        intelligenceReport: sfData.report,
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

    // Step 3: Storyboard Generator (Flow Video)
    let storyboardData = null;
    try {
      const sbRes = await fetch(`${baseUrl}/api/storyboard`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          scriptText: swData.rawScript,
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
          scriptText: swData.rawScript,
        }),
      });

      if (caRes.ok) {
        const caResult = await caRes.json();
        coverArtUrl = caResult.coverArtUrl;
      }
    } catch (caErr) {
      console.warn("Cover art generation step skipped/warning:", caErr);
    }

    return NextResponse.json({
      topic,
      contentType,
      showFormat,
      durationMinutes,
      intelligenceReport: sfData.report,
      qualifiedSources: sfData.qualifiedSources,
      rawSources: sfData.rawSources,
      scriptText: swData.rawScript,
      scriptLines: swData.lines,
      storyboard: storyboardData,
      coverArtUrl,
      estimatedDuration: swData.estimatedDuration,
      wordCount: swData.wordCount,
      timestamp: new Date().toISOString(),
    });
  } catch {
    console.log("Notice: Orchestrator workflow handled error gracefully.");
    return NextResponse.json(
      { error: "Pipeline orchestration failed" },
      { status: 500 }
    );
  }
});
