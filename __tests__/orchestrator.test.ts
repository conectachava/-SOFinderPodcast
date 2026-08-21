import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Mock de las funciones y módulos externos
const mockWithAiApiValidation = (handler: any) => async (req: any) => handler(req, {});
const mockOrchestratorResponseSchema = z.object({
  topic: z.string(),
  contentType: z.string(),
  showFormat: z.string(),
  durationMinutes: z.number(),
  intelligenceReport: z.string(),
  scriptText: z.string(),
  scriptLines: z.array(z.any()),
  wordCount: z.number(),
});

vi.mock("@/lib/middleware", () => ({
  withAiApiValidation: mockWithAiApiValidation,
}));

vi.mock("@/lib/schemas", () => ({
  OrchestratorResponseSchema: mockOrchestratorResponseSchema,
}));

// Importar la función a probar después de los mocks
import { POST } from "../app/api/orchestrator/route";

describe("Orchestrator API", () => {
  it("should return 400 if topic is missing", async () => {
    const request = new NextRequest("http://localhost/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Topic is required");
  });

  it("should successfully orchestrate the pipeline with all steps", async () => {
    // Mock de las respuestas de las APIs internas
    vi.spyOn(global, "fetch").mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url !== 'string') throw new Error("URL must be a string");

      if (url.includes("/api/source-finder")) {
        return NextResponse.json({
          report: "## Resumen Ejecutivo\nInforme de prueba SourceFinder",
          qualifiedSources: [{ url: "http://example.com", title: "Example" }],
          rawSources: [{ url: "http://example.com", title: "Example" }],
        });
      }
      if (url.includes("/api/script-writer")) {
        return NextResponse.json({
          rawScript: "Paul: Hello\nSarah: Hi",
          lines: [{ id: "1", speaker: "Paul", text: "Hello", timestamp: "0:00" }],
          wordCount: 2,
          estimatedDuration: "0.1 mins",
        });
      }
      if (url.includes("/api/storyboard")) {
        return NextResponse.json({
          storyboard: {
            characters: { Paul: "desc" },
            scenes: [{ scene_id: 1, speaker: "Paul", visual_type: "Talking Head", flow_video_prompt: "prompt", audio_cue: "cue", transition: "cut", effects: "none" }],
          },
        });
      }
      if (url.includes("/api/cover-art")) {
        return NextResponse.json({ coverArtUrl: "http://example.com/cover.png" });
      }
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    });

    const request = new NextRequest("http://localhost/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Test Topic",
        contentType: "General",
        showFormat: "Debate",
        durationMinutes: 5,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.topic).toBe("Test Topic");
    expect(json.intelligenceReport).toContain("Informe de prueba SourceFinder");
    expect(json.scriptText).toContain("Paul: Hello");
    expect(json.scriptLines).toHaveLength(1);
    expect(json.storyboard).toBeDefined();
    expect(json.coverArtUrl).toBe("http://example.com/cover.png");

    vi.restoreAllMocks();
  });

  it("should handle SourceFinder failure gracefully", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url !== 'string') throw new Error("URL must be a string");
      if (url.includes("/api/source-finder")) {
        return NextResponse.json({ error: "SF Error" }, { status: 500 });
      }
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    });

    const request = new NextRequest("http://localhost/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Test Topic",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Pipeline orchestration failed");
    expect(json.details).toContain("SourceFinder step failed");

    vi.restoreAllMocks();
  });

  it("should handle ScriptWriter failure gracefully", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url !== 'string') throw new Error("URL must be a string");
      if (url.includes("/api/source-finder")) {
        return NextResponse.json({ report: "valid report" });
      }
      if (url.includes("/api/script-writer")) {
        return NextResponse.json({ error: "SW Error" }, { status: 500 });
      }
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    });

    const request = new NextRequest("http://localhost/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Test Topic",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Pipeline orchestration failed");
    expect(json.details).toContain("ScriptWriter step failed");

    vi.restoreAllMocks();
  });

  it("should proceed even if Storyboard generation fails (non-critical step)", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url !== 'string') throw new Error("URL must be a string");

      if (url.includes("/api/source-finder")) {
        return NextResponse.json({
          report: "## Resumen Ejecutivo\nInforme de prueba SourceFinder",
          qualifiedSources: [{ url: "http://example.com", title: "Example" }],
          rawSources: [{ url: "http://example.com", title: "Example" }],
        });
      }
      if (url.includes("/api/script-writer")) {
        return NextResponse.json({
          rawScript: "Paul: Hello\nSarah: Hi",
          lines: [{ id: "1", speaker: "Paul", text: "Hello", timestamp: "0:00" }],
          wordCount: 2,
        });
      }
      if (url.includes("/api/storyboard")) {
        return NextResponse.json({ error: "Storyboard Error" }, { status: 500 }); // Simulate error
      }
      if (url.includes("/api/cover-art")) {
        return NextResponse.json({ coverArtUrl: "http://example.com/cover.png" });
      }
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    });

    const request = new NextRequest("http://localhost/api/orchestrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Test Topic",
        contentType: "General",
        showFormat: "Debate",
        durationMinutes: 5,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200); // Should still be 200, storyboard is non-critical
    const json = await response.json();
    expect(json.storyboard).toBeNull(); // Storyboard should be null

    vi.restoreAllMocks();
  });
});