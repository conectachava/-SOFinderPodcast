import type { MetadataRoute } from "next";
import { getAllPublicPodcasts } from "@/lib/podcasts-repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || "https://ia.conectachava.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/?tab=orchestrator`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/?tab=sourcefinder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/?tab=studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/?tab=analytics`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const podcasts = await getAllPublicPodcasts();
    const dynamicRoutes: MetadataRoute.Sitemap = podcasts.map((podcast) => {
      let podcastDate = now;
      if (podcast.updatedAt) {
        const parsed = new Date(podcast.updatedAt);
        if (!isNaN(parsed.getTime())) podcastDate = parsed;
      } else if (podcast.date) {
        const parsed = new Date(podcast.date);
        if (!isNaN(parsed.getTime())) podcastDate = parsed;
      }
      return {
        url: `${baseUrl}/podcast/${encodeURIComponent(podcast.id)}`,
        lastModified: podcastDate,
        changeFrequency: "weekly",
        priority: 0.85,
      };
    });
    return [...staticRoutes, ...dynamicRoutes];
  } catch (err) {
    console.warn("[Sitemap Generator] Fallback to static routes:", err);
    return staticRoutes;
  }
}
