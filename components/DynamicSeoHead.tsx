"use client";

import { useEffect, useState } from "react";

export interface PodcastSeoData {
  topic: string;
  description?: string;
  keywords?: string[];
  language?: string;
  format?: string;
}

export function updatePodcastSeoTopic(data: PodcastSeoData) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sf_seo_update", { detail: data }));
  }
}

export function DynamicSeoHead() {
  const [seoData, setSeoData] = useState<PodcastSeoData>({
    topic: "Investigación Automatizada & Podcasts Multivoz",
    description: "Plataforma líder en investigación automatizada, verificación de fuentes con Google Search Grounding y producción de podcasts multivoz impulsados por Gemini AI.",
    keywords: ["SourceFinder Pod", "Podcast IA", "Generador de Podcasts", "Verificación de Fuentes", "Google Search Grounding", "Gemini AI", "TTS Multivoz"],
    language: "es",
  });

  useEffect(() => {
    const handleSeoUpdate = (event: Event) => {
      const customEv = event as CustomEvent<PodcastSeoData>;
      if (customEv.detail && customEv.detail.topic) {
        setSeoData((prev) => ({
          ...prev,
          ...customEv.detail,
        }));
      }
    };

    window.addEventListener("sf_seo_update", handleSeoUpdate);
    return () => window.removeEventListener("sf_seo_update", handleSeoUpdate);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const fullTitle = `${seoData.topic} — SourceFinder Pod`;
    document.title = fullTitle;

    const updateMetaTag = (selector: string, attr: string, content: string) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        const matchName = selector.match(/name="([^"]+)"/);
        const matchProp = selector.match(/property="([^"]+)"/);
        if (matchName) tag.setAttribute("name", matchName[1]);
        if (matchProp) tag.setAttribute("property", matchProp[1]);
        document.head.appendChild(tag);
      }
      tag.setAttribute(attr, content);
    };

    const desc = seoData.description || `Episodio especial sobre ${seoData.topic} investigado con Google Search Grounding y generado con Gemini AI.`;
    const keywordsStr = (seoData.keywords && seoData.keywords.length > 0)
      ? seoData.keywords.join(", ")
      : `Podcast, ${seoData.topic}, Gemini AI, Fact-checking, Audio Multivoz, SourceFinder`;

    updateMetaTag('meta[name="description"]', 'content', desc);
    updateMetaTag('meta[name="keywords"]', 'content', keywordsStr);
    updateMetaTag('meta[property="og:title"]', 'content', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'content', desc);
    updateMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', desc);

    // Dynamic JSON-LD Schema for Podcast Episode / Podcast Series
    let jsonLdScript = document.getElementById("dynamic-podcast-schema") as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.id = "dynamic-podcast-schema";
      jsonLdScript.type = "application/ld+json";
      document.head.appendChild(jsonLdScript);
    }

    const podcastSchema = {
      "@context": "https://schema.org",
      "@type": "PodcastEpisode",
      "name": seoData.topic,
      "description": desc,
      "inLanguage": seoData.language || "es",
      "isPartOf": {
        "@type": "PodcastSeries",
        "name": "SourceFinder Pod — AI Research & Multi-Voice Podcasts",
        "url": typeof window !== "undefined" ? window.location.origin : "https://ais-dev-6uz52gv5plsbm5qyowpnha-7486352881.us-east1.run.app"
      },
      "author": {
        "@type": "Organization",
        "name": "VSNRY LABS"
      },
      "publisher": {
        "@type": "Organization",
        "name": "SourceFinder Pod"
      }
    };

    jsonLdScript.textContent = JSON.stringify(podcastSchema);
  }, [seoData]);

  return null;
}
