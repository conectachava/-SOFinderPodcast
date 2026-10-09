import { describe, it, expect } from "vitest";
import {
  getPublicPodcast,
  getAllPublicPodcasts,
  savePublicPodcast,
  SEED_PODCASTS,
} from "../lib/podcasts-repository";

describe("Public Podcasts Repository & Dynamic Metadata", () => {
  it("should have seed podcasts configured for immediate search indexing", async () => {
    const list = await getAllPublicPodcasts();
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.some((p) => p.id === "ep-gemini-multimodal")).toBe(true);
    expect(list.some((p) => p.id === "ep-search-grounding")).toBe(true);
  });

  it("should fetch a podcast by its exact ID", async () => {
    const podcast = await getPublicPodcast("ep-gemini-multimodal");
    expect(podcast).toBeDefined();
    expect(podcast?.title).toContain("Gemini");
    expect(podcast?.format).toBe("Análisis");
    expect(podcast?.tags).toBeInstanceOf(Array);
    expect(podcast?.tags?.length).toBeGreaterThan(0);
  });

  it("should save and retrieve a new podcast episode with OpenGraph metadata", async () => {
    const testEpisode = {
      id: "ep-test-innovation-2026",
      title: "IA Cuántica y Síntesis de Audio de Alta Fidelidad",
      topic: "Computación cuántica aplicada a modelos generativos de audio",
      description: "Exploración de algoritmos de optimización tensorial para la generación de ondas sonoras ultrarrápidas.",
      contentType: "Tecnología Avanzada",
      format: "Análisis" as const,
      status: "Ready" as const,
      duration: "11:45",
      date: "2026-10-08",
      coverArt: "https://picsum.photos/seed/quantum/1200/630",
      scriptLinesCount: 14,
      tags: ["Quantum", "AudioIA", "Gemini"],
    };

    const saved = await savePublicPodcast(testEpisode);
    expect(saved).toBe(true);

    const retrieved = await getPublicPodcast("ep-test-innovation-2026");
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe(testEpisode.title);
    expect(retrieved?.description).toBe(testEpisode.description);
  });

  it("should include all saved podcasts in getAllPublicPodcasts for dynamic sitemap generation", async () => {
    const list = await getAllPublicPodcasts();
    const found = list.find((p) => p.id === "ep-test-innovation-2026");
    expect(found).toBeDefined();
    expect(found?.id).toBe("ep-test-innovation-2026");
  });
});
