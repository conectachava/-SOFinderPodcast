"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Download,
  Check,
  Wand2,
  Palette,
  Layers,
  Maximize2,
  Eye,
} from "lucide-react";
import { safeFetchJson } from "@/lib/utils";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { useToast } from "./Toast";

export interface GeneratedCoverItem {
  id: string;
  url: string;
  promptUsed: string;
  style: string;
  colorPalette: string;
  aspectRatio: "1:1" | "16:9" | "9:16";
  engineUsed: string;
  createdAt: string;
}

const COVER_STYLES = [
  {
    id: "editorial_minimal",
    label: "Editorial Minimalista",
    desc: "Diseño suizo geométrico de alto impacto tipo portada de revista",
    badge: "Swiss Design",
  },
  {
    id: "cyberpunk_neon",
    label: "Cyberpunk & Tech Neon",
    desc: "Circuitos luminosos, ondas acústicas neón y atmósfera futurista",
    badge: "Sci-Fi / Tech",
  },
  {
    id: "3d_isometric",
    label: "Estudio 3D Isométrico",
    desc: "Render 3D táctil con microfonía de condensador e iluminación cálida",
    badge: "3D Render",
  },
  {
    id: "cinematic_doc",
    label: "Documental Cinematográfico",
    desc: "Claroscuro dramático, atmósfera de investigación y grano fílmico",
    badge: "Cinematic",
  },
  {
    id: "pop_debate",
    label: "Pop Art & Debate Vibrante",
    desc: "Contraste de energía dual ideal para episodios de debate y opinión",
    badge: "High Contrast",
  },
  {
    id: "watercolor_essay",
    label: "Acuarela & Ensayo Cultural",
    desc: "Ilustración orgánica en tinta y acuarela sobre textura editorial",
    badge: "Fine Art",
  },
];

const COLOR_PALETTES = [
  {
    id: "indigo_emerald",
    label: "Índigo & Esmeralda Studio",
    swatches: ["#0f172a", "#4f46e5", "#10b981"],
  },
  {
    id: "amber_obsidian",
    label: "Ámbar & Obsidiana FM",
    swatches: ["#111827", "#f59e0b", "#ea580c"],
  },
  {
    id: "crimson_slate",
    label: "Carmesí & Pizarra Debate",
    swatches: ["#140a10", "#e11d48", "#6366f1"],
  },
  {
    id: "cyber_cyan",
    label: "Cian Cyber & Ultravioleta",
    swatches: ["#050b14", "#06b6d4", "#9333ea"],
  },
  {
    id: "monochrome_editorial",
    label: "Monocromo & Cobalto",
    swatches: ["#09090b", "#f8fafc", "#3b82f6"],
  },
];

const QUICK_MODIFIERS = [
  "Micrófono de condensador vintage",
  "Ondas sonoras holográficas",
  "Iluminación volumétrica de estudio",
  "Composición simétrica centrada",
  "Alto contraste editorial",
  "Sin texto superpuesto",
];

interface ImagenCoverStudioProps {
  topic: string;
  scriptLines: ScriptLine[];
  currentCoverArt: string | null;
  onSelectCoverArt: (url: string) => void;
}

export function ImagenCoverStudio({
  topic,
  scriptLines,
  currentCoverArt,
  onSelectCoverArt,
}: ImagenCoverStudioProps) {
  const { addToast } = useToast();

  const [selectedEngine, setSelectedEngine] = useState<"imagen-3" | "imagen-4" | "gemini-image">(
    "imagen-3"
  );
  const [selectedStyle, setSelectedStyle] = useState<string>("editorial_minimal");
  const [selectedPalette, setSelectedPalette] = useState<string>("indigo_emerald");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([
    "Iluminación volumétrica de estudio",
    "Alto contraste editorial",
  ]);
  const [showEditorialOverlay, setShowEditorialOverlay] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [gallery, setGallery] = useState<GeneratedCoverItem[]>([]);
  const [activePromptUsed, setActivePromptUsed] = useState<string | null>(null);

  const toggleModifier = (mod: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  // Extract visual concept from episode script lines
  const handleExtractConceptFromScript = () => {
    const sampleLines = scriptLines
      .slice(0, 5)
      .map((l) => l.text)
      .join(" ");
    const keywords = sampleLines
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 8)
      .join(", ");

    const generatedConcept = `Representación visual simbólica sobre "${topic}". Elementos clave del episodio: ${
      keywords || "tecnología, análisis profundo y conversación en estudio"
    }. Composición limpia de portada de podcast profesional.`;

    setCustomPrompt(generatedConcept);
    addToast(
      "Concepto Visual Extraído",
      "Se analizaron los diálogos del episodio para sugerir el prompt de Imagen.",
      "info"
    );
  };

  const handleGenerateWithImagen = async () => {
    setIsGenerating(true);
    addToast(
      "Generando Carátula con Imagen",
      `Renderizando arte único (${aspectRatio}) con motor ${
        selectedEngine === "imagen-4"
          ? "Imagen 4.0"
          : selectedEngine === "imagen-3"
          ? "Imagen 3.0"
          : "Gemini Flash Image"
      }...`,
      "info"
    );

    try {
      const res = await safeFetchJson("/api/cover-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          scriptText: scriptLines.map((l) => l.text).join(" "),
          customPrompt: customPrompt.trim(),
          style: selectedStyle,
          colorPalette: selectedPalette,
          aspectRatio,
          engine: selectedEngine,
          modifiers: selectedModifiers,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || "Error al generar la carátula con Imagen");
      }

      const data = res.data;
      if (data?.coverArtUrl) {
        onSelectCoverArt(data.coverArtUrl);
        setActivePromptUsed(data.promptUsed || null);

        const newItem: GeneratedCoverItem = {
          id: `cov-${Date.now()}`,
          url: data.coverArtUrl,
          promptUsed: data.promptUsed || customPrompt || topic,
          style: selectedStyle,
          colorPalette: selectedPalette,
          aspectRatio,
          engineUsed: data.engineUsed || selectedEngine,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setGallery((prev) => [newItem, ...prev.slice(0, 7)]);
        addToast(
          "Carátula Creada con Imagen",
          "Nueva carátula aplicada al episodio y añadida a la galería del estudio.",
          "success"
        );
      }
    } catch (err: any) {
      addToast(
        "Error en Generación de Carátula",
        err?.message || "No se pudo completar la generación con Imagen.",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCover = () => {
    if (!currentCoverArt) return;
    const link = document.createElement("a");
    link.href = currentCoverArt;
    const ext = currentCoverArt.startsWith("data:image/svg") ? "svg" : "png";
    link.download = `Caratula_Podcast_${topic.replace(/\s+/g, "_").slice(0, 30)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Carátula Descargada", "Archivo de portada guardado en tu dispositivo.", "success");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg text-white">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Estudio de Carátulas Únicas con Imagen IA
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700/80 text-[10px] font-mono font-bold rounded-full">
                Google Imagen Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Diseña portadas personalizadas para Spotify, Apple Podcasts y YouTube inspiradas en el guion de tu episodio
            </p>
          </div>
        </div>

        {/* AI Engine Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(
            [
              { id: "imagen-3", label: "Imagen 3.0 HD" },
              { id: "imagen-4", label: "Imagen 4.0 Ultra" },
              { id: "gemini-image", label: "Gemini Flash Image" },
            ] as const
          ).map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => setSelectedEngine(eng.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                selectedEngine === eng.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {eng.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls (Left 7 cols) + Live Preview & Gallery (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Artistic Controls & Prompt Builder */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Visual Style Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              1. Dirección Artística de la Carátula
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {COVER_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500 shadow-xs"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white">{style.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{style.desc}</p>
                    <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-wider pt-1">
                      {style.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Color Palette & Aspect Ratio Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                2. Paleta Cromática del Episodio
              </label>
              <div className="space-y-1.5">
                {COLOR_PALETTES.map((pal) => {
                  const isSelected = selectedPalette === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSelectedPalette(pal.id)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 border-emerald-500 text-white font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="truncate">{pal.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {pal.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  3. Formato / Plataforma
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "1:1", label: "1:1", sub: "Spotify / Apple" },
                      { id: "16:9", label: "16:9", sub: "YouTube Video" },
                      { id: "9:16", label: "9:16", sub: "Reels / Shorts" },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setAspectRatio(fmt.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        aspectRatio === fmt.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-mono font-extrabold">{fmt.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{fmt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editorial Overlay Switch */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Sello Editorial del Episodio
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Muestra el título y badge del show sobre la vista previa
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showEditorialOverlay}
                  onChange={(e) => setShowEditorialOverlay(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. Custom Prompt & Script Concept Extractor */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                4. Concepto Visual & Prompt de Imagen
              </label>
              <button
                type="button"
                onClick={handleExtractConceptFromScript}
                className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Wand2 className="w-3 h-3 text-amber-400" />
                <span>Extraer Concepto del Guion</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`Describe los elementos visuales para "${topic}" (o deja en blanco para auto-composición según el guion)...`}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Quick Modifiers */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_MODIFIERS.map((mod) => {
                const active = selectedModifiers.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModifier(mod)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-all cursor-pointer border ${
                      active
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700 font-bold"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {active ? `✓ ${mod}` : `+ ${mod}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate CTA */}
          <button
            type="button"
            onClick={handleGenerateWithImagen}
            disabled={isGenerating}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Renderizando Carátula Única con Imagen IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generar Carátula Única con Imagen IA</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Cover Preview & Session Variations Gallery */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                Vista Previa Carátula Activa ({aspectRatio})
              </span>
              {currentCoverArt && (
                <button
                  type="button"
                  onClick={handleDownloadCover}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar Arte</span>
                </button>
              )}
            </div>

            {/* Artwork Container */}
            <div
              className={`relative overflow-hidden rounded-2xl border border-slate-700/80 shadow-2xl bg-slate-900 flex items-center justify-center ${
                aspectRatio === "16:9"
                  ? "w-full aspect-video max-h-60"
                  : aspectRatio === "9:16"
                  ? "w-48 aspect-[9/16] max-h-72"
                  : "w-64 h-64 sm:w-72 sm:h-72"
              }`}
            >
              {currentCoverArt ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentCoverArt}
                    alt={`Carátula de ${topic}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {showEditorialOverlay && !currentCoverArt.startsWith("data:image/svg") && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-4 flex flex-col justify-between pointer-events-none">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/75 border border-white/15 w-fit">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[9px] font-mono font-extrabold tracking-widest uppercase text-white">
                          SOURCEFINDER PODCAST
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                          EPISODIO ESPECIAL
                        </span>
                        <h4 className="text-sm font-black text-white leading-tight line-clamp-2 drop-shadow">
                          {topic}
                        </h4>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center space-y-2 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs font-bold text-slate-300">Sin Carátula Generada</p>
                  <p className="text-[11px] text-slate-500">
                    Selecciona un estilo artístico y pulsa &ldquo;Generar Carátula Única con Imagen IA&rdquo;.
                  </p>
                </div>
              )}
            </div>

            {activePromptUsed && (
              <div className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono line-clamp-2">
                <strong className="text-indigo-400">Prompt Imagen:</strong> {activePromptUsed}
              </div>
            )}
          </div>

          {/* Variations Gallery */}
          {gallery.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Galería de Variaciones del Episodio ({gallery.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Clic para aplicar al episodio
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((item) => {
                  const isCurrent = currentCoverArt === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectCoverArt(item.url);
                        setActivePromptUsed(item.promptUsed);
                      }}
                      className={`relative group rounded-lg overflow-hidden border aspect-square cursor-pointer transition-all ${
                        isCurrent
                          ? "border-emerald-400 ring-2 ring-emerald-400/50"
                          : "border-slate-800 hover:border-slate-600"
                      }`}
                      title={`Estilo: ${item.style} (${item.createdAt})`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt="Variación de carátula"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
