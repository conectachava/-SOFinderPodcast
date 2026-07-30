import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topic, contentType = "General", showFormat = "Debate", durationMinutes = 3 } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Step 1: SourceFinder
    const sfRes = await fetch(`${baseUrl}/api/source-finder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, contentType }),
    });

    if (!sfRes.ok) {
      const err = await sfRes.json();
      throw new Error(`SourceFinder step failed: ${err.error || sfRes.statusText}`);
    }

    const sfData = await sfRes.json();

    // Step 2: ScriptWriter
    const swRes = await fetch(`${baseUrl}/api/script-writer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intelligenceReport: sfData.report,
        showFormat,
        durationMinutes,
      }),
    });

    if (!swRes.ok) {
      const err = await swRes.json();
      throw new Error(`ScriptWriter step failed: ${err.error || swRes.statusText}`);
    }

    const swData = await swRes.json();

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
      estimatedDuration: swData.estimatedDuration,
      wordCount: swData.wordCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Orchestrator error:", error);
    return NextResponse.json(
      { error: error?.message || "Pipeline orchestration failed" },
      { status: 500 }
    );
  }
}
