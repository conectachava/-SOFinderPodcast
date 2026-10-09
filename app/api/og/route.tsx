import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "SourceFinder Pod — AI Multi-Voice Studio";
    const topic = searchParams.get("topic") || "Investigación Automatizada & Fact-Checking";
    const format = searchParams.get("format") || "Debate";
    const duration = searchParams.get("duration") || "15 min";
    const tag = searchParams.get("tag") || "Google Search Grounding";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0f172a",
            padding: "60px 70px",
            color: "#f8fafc",
            fontFamily: "system-ui, sans-serif",
            backgroundImage: "radial-gradient(circle at 15% 20%, #1e1b4b 0%, #0f172a 70%)",
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#6366f1",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                🎙️
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "-0.5px" }}>
                  SourceFinder Pod
                </span>
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                  VSNRY LABS • Gemini AI Multivoz
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#312e81",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#c7d2fe",
                  border: "1px solid #4338ca",
                }}
              >
                {format}
              </span>
              <span
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#064e3b",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#6ee7b7",
                  border: "1px solid #047857",
                }}
              >
                ⏱️ {duration}
              </span>
            </div>
          </div>

          {/* Center Title & Topic */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "900",
                lineHeight: "1.15",
                color: "#ffffff",
                letterSpacing: "-1px",
              }}
            >
              {title.length > 90 ? `${title.slice(0, 87)}...` : title}
            </div>

            <div style={{ fontSize: "22px", color: "#94a3b8", lineHeight: "1.3" }}>
              {topic.length > 140 ? `${topic.slice(0, 137)}...` : topic}
            </div>
          </div>

          {/* Bottom Footer Deck */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #334155",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "15px", color: "#cbd5e1" }}>
                🏷️ #{tag}
              </span>
              <span style={{ fontSize: "15px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "15px", color: "#cbd5e1" }}>
                Normalizado a -16 LUFS
              </span>
              <span style={{ fontSize: "15px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "15px", color: "#38bdf8" }}>
                Audio Bed con Auto-Ducking
              </span>
            </div>

            <div style={{ fontSize: "14px", color: "#64748b" }}>
              ia.conectachava.com/podcast
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OpenGraph image: ${e.message}`, { status: 500 });
  }
}
