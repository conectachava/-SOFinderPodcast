import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Radio,
  Play,
  Share2,
  Clock,
  Sparkles,
  Tag,
  FileText,
  Volume2,
  ExternalLink,
  ChevronLeft,
  Music,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { getPublicPodcast, getAllPublicPodcasts } from "@/lib/podcasts-repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const podcasts = await getAllPublicPodcasts();
  return podcasts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const podcast = await getPublicPodcast(resolvedParams.id);

  if (!podcast) {
    return {
      title: "Podcast No Encontrado — SourceFinder Pod",
      description: "El episodio solicitado no está disponible o ha sido eliminado.",
    };
  }

  const baseUrl = process.env.APP_URL || "https://ia.conectachava.com";
  const ogImageUrl = podcast.coverArt && !podcast.coverArt.startsWith("data:")
    ? podcast.coverArt
    : `${baseUrl}/api/og?title=${encodeURIComponent(podcast.title)}&topic=${encodeURIComponent(
        podcast.topic
      )}&format=${encodeURIComponent(podcast.format)}&duration=${encodeURIComponent(
        podcast.duration
      )}&tag=${encodeURIComponent(podcast.tags?.[0] || "IA")}`;

  const canonicalUrl = `${baseUrl}/podcast/${podcast.id}`;
  const keywords = podcast.tags && podcast.tags.length > 0
    ? podcast.tags.join(", ")
    : "SourceFinder Pod, Podcast IA, Gemini AI, TTS Multivoz, Google Search Grounding";

  return {
    title: `${podcast.title} — SourceFinder Pod`,
    description: podcast.description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${podcast.title} — SourceFinder Pod`,
      description: podcast.description,
      siteName: "SourceFinder Pod",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: podcast.title,
        },
      ],
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: `${podcast.title} — SourceFinder Pod`,
      description: podcast.description,
      images: [ogImageUrl],
      creator: "@VSNRYLABS",
    },
  };
}

export default async function PodcastEpisodePage({ params }: PageProps) {
  const resolvedParams = await params;
  const podcast = await getPublicPodcast(resolvedParams.id);

  if (!podcast) {
    notFound();
  }

  const baseUrl = process.env.APP_URL || "https://ia.conectachava.com";
  const ogImageUrl = podcast.coverArt && !podcast.coverArt.startsWith("data:")
    ? podcast.coverArt
    : `${baseUrl}/api/og?title=${encodeURIComponent(podcast.title)}&topic=${encodeURIComponent(
        podcast.topic
      )}&format=${encodeURIComponent(podcast.format)}&duration=${encodeURIComponent(
        podcast.duration
      )}&tag=${encodeURIComponent(podcast.tags?.[0] || "IA")}`;

  const schemaLdJson = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "name": podcast.title,
    "description": podcast.description,
    "datePublished": podcast.date,
    "duration": podcast.duration,
    "url": `${baseUrl}/podcast/${podcast.id}`,
    "image": ogImageUrl,
    "associatedMedia": {
      "@type": "MediaObject",
      "contentUrl": podcast.audioUrl || `${baseUrl}/podcast/${podcast.id}`,
      "encodingFormat": "audio/mpeg",
    },
    "partOfSeries": {
      "@type": "PodcastSeries",
      "name": "SourceFinder Pod — AI Multi-Voice Radio Studio",
      "url": baseUrl,
    },
    "author": {
      "@type": "Organization",
      "name": podcast.authorName || "VSNRY LABS",
      "url": "https://vsnrylabs.com",
    },
    "publisher": {
      "@type": "Organization",
      "name": "SourceFinder Pod",
      "url": baseUrl,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLdJson) }}
      />

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">SourceFinder Pod</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">OpenGraph Hub</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a la App</span>
            </Link>

            <Link
              href={`/?tab=studio&topic=${encodeURIComponent(podcast.topic)}`}
              className="text-xs font-bold text-slate-950 bg-indigo-400 hover:bg-indigo-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Abrir en Estudio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Episode Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
            {/* Cover Art */}
            <div className="relative shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImageUrl}
                alt={podcast.title}
                referrerPolicy="no-referrer"
                className="w-36 h-36 sm:w-48 sm:h-48 rounded-xl object-cover border border-slate-700 shadow-xl"
              />
              <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold font-mono px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                HD Audio Bed
              </div>
            </div>

            {/* Episode Metadata & Actions */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-mono font-bold rounded uppercase tracking-wider">
                  {podcast.format}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-medium rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{podcast.duration}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-mono font-medium rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Master -16 LUFS</span>
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  Fecha: {podcast.date}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {podcast.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {podcast.description}
              </p>

              {/* Tags Row */}
              {podcast.tags && podcast.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {podcast.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 bg-slate-800/90 text-slate-300 rounded-md border border-slate-700 flex items-center gap-1 font-mono"
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audio Playback Deck */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Audio Master Multivoz</p>
                <p className="text-[11px] text-slate-400">
                  Sintetizado con Gemini AI y ecualizado con Audio Bed ambiental
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Link
                href={`/?tab=studio&topic=${encodeURIComponent(podcast.topic)}`}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproducir &amp; Editar en Studio</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Audio Bed &amp; Normalización</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Masterizado a nivel de sonoridad broadcast ITU-R BS.1770 con atenuación inteligente de pista ambiental (Auto-Ducking).
            </p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Google Search Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contenido investigado y contrastado con fuentes web indexadas en tiempo real mediante Gemini 2.0 y Search Grounding.
            </p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Doblaje Multivoz Pro</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diálogos dirigidos con modulación emocional de tono, velocidad y calidez asignados individualmente por rol (Host, Expert, Analyst).
            </p>
          </div>
        </div>

        {/* SEO & Indexing Information Box */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>Metadatos OpenGraph y Schema.org Verificados</span>
          </div>
          <p>
            Este episodio cuenta con metaetiquetas dinámicas <code className="text-indigo-300">og:title</code>, <code className="text-indigo-300">og:description</code>, <code className="text-indigo-300">og:image</code> y tarjetas de Twitter generadas dinámicamente con resolución server-side, así como integración automática en el <Link href="/sitemap.xml" className="text-indigo-400 underline hover:text-indigo-300">sitemap.xml</Link> del sitio para una indexación óptima en buscadores y plataformas de podcast.
          </p>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>SOFinder Podcast © 2026 • VSNRY LABS • Conecta Chava • Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
