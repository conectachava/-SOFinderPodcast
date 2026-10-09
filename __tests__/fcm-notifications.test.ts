import { describe, it, expect } from "vitest";
import { POST } from "../app/api/notifications/push/route";
import { NextRequest } from "next/server";

describe("Push Notifications FCM API", () => {
  it("should reject push requests missing title or body", async () => {
    const req = new NextRequest("http://localhost:3000/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("should process and dispatch podcast rendering completed alerts", async () => {
    const req = new NextRequest("http://localhost:3000/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🎉 ¡Podcast Finalizado!",
        body: "El episodio ha sido masterizado exitosamente con Audio Bed.",
        status: "completed",
        podcastId: "ep-test-podcast",
        data: {
          lufs: "-16.0",
          bedTrack: "ambient_lounge",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.simulated || data.delivered).toBe(true);
  });

  it("should process rendering status update alerts during multi-voice synthesis", async () => {
    const req = new NextRequest("http://localhost:3000/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🎙️ Renderizado Iniciado",
        body: "Procesando 12 intervenciones de voz...",
        status: "rendering",
        podcastId: "ep-status-test",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
