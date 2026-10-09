"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Share2,
  Linkedin,
  Twitter,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Radio,
  Clock,
  ShieldCheck,
  X as CloseIcon,
  MessageSquare,
  Globe,
  Hash,
} from "lucide-react";
import { useToast } from "./Toast";
import type { ScriptLine } from "@/app/api/script-writer/route";

interface PodcastSocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  podcastId?: string;
  coverArtUrl?: string | null;
  durationFormatted?: string;
  scriptLines?: ScriptLine[];
  metadataDescription?: string;
}

export function PodcastSocialShareModal({
  isOpen,
  onClose,
  topic,
  podcastId,
  coverArtUrl,
  durationFormatted = "~15 min",
  scriptLines = [],
  metadataDescription,
}: PodcastSocialShareModalProps) {
  const { addToast } = useToast();
  const [platform, setPlatform] = useState<"linkedin" | "x">("linkedin");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Generate shareable URL with dynamic podcast page if ID is provided
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ia.conectachava.com";
  const shareUrl = podcastId
    ? `${baseUrl}/podcast/${encodeURIComponent(podcastId)}`
    : `${baseUrl}?podcast=${encodeURIComponent(topic)}`;

  // Extract a compelling quote from the script
  const keyQuote = React.useMemo(() => {
    if (scriptLines && scriptLines.length > 1) {
      const line = scriptLines.find((l) => l.text.length > 50 && l.text.length < 180) || scriptLines[1];
      return line?.text || "Análisis riguroso con fuentes auditadas en tiempo real.";
    }
    return "Análisis riguroso con fuentes auditadas en tiempo real y síntesis multivoz.";
  }, [scriptLines]);

  // Derived default post texts
  const defaultLinkedinText = React.useMemo(() => {
    return `🎙️ Nuevo episodio disponible: "${topic}"\n\nInvestigamos a fondo las tendencias y hechos verificados combinando fuentes en tiempo real y debate multivoz.\n\n💡 Cita destacada:\n"${keyQuote}"\n\nEscúchalo aquí: ${shareUrl}\n\n#Podcast #InteligenciaArtificial #Tecnología #Innovación #FactChecking`;
  }, [topic, keyQuote, shareUrl]);

  const defaultXText = React.useMemo(() => {
    return `🎙️ Nuevo episodio: "${topic}"\n\n"${keyQuote.slice(0, 110)}..."\n\nEscucha el podcast verificado con Google Grounding aquí 👇\n${shareUrl}\n\n#Podcast #AI #GeminiAI`;
  }, [topic, keyQuote, shareUrl]);

  const [customLinkedinText, setCustomLinkedinText] = useState<string | null>(null);
  const [customXText, setCustomXText] = useState<string | null>(null);

  const linkedinPostText = customLinkedinText ?? defaultLinkedinText;
  const xPostText = customXText ?? defaultXText;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      addToast("Enlace Copiado", "El enlace al podcast ha sido copiado al portapapeles.", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPostText = () => {
    const textToCopy = platform === "linkedin" ? linkedinPostText : xPostText;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      addToast("Texto Copiado", `Publicación para ${platform === "linkedin" ? "LinkedIn" : "X"} lista para pegar.`, "info");
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleShareToLinkedIn = () => {
    const shareEndpoint = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(shareEndpoint, "_blank", "noopener,noreferrer,width=650,height=600");
    addToast("Abriendo LinkedIn", "Preparando publicación en una nueva ventana...", "info");
  };

  const handleShareToX = () => {
    const shareEndpoint = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xPostText)}`;
    window.open(shareEndpoint, "_blank", "noopener,noreferrer,width=600,height=500");
    addToast("Abriendo X", "Preparando tweet en una nueva ventana...", "info");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Compartir Podcast en Redes Sociales
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Social Preview Card
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Genera vistas previas enriquecidas y enlaces directos para LinkedIn y X (Twitter).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Platform Tab Selector & Edit Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlatform("linkedin")}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  platform === "linkedin"
                    ? "bg-[#0a66c2] text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() => setPlatform("x")}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  platform === "x"
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Twitter className="w-4 h-4" />
                <span>X (Twitter)</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>{platform === "linkedin" ? "Red Profesional" : "Microblogging"}</span>
              <span className="text-slate-600">·</span>
              <span className={platform === "x" && xPostText.length > 280 ? "text-red-400 font-bold" : "text-emerald-400"}>
                {platform === "linkedin" ? `${linkedinPostText.length} caracteres` : `${xPostText.length}/280 caracteres`}
              </span>
            </div>
          </div>

          {/* Editable Post Text Area */}
          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Personalizar Contenido de la Publicación:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Se sincroniza en tiempo real con la tarjeta inferior
              </span>
            </div>
            {platform === "linkedin" ? (
              <textarea
                rows={4}
                value={linkedinPostText}
                onChange={(e) => setCustomLinkedinText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-3 font-sans focus:border-indigo-500 focus:outline-hidden resize-y leading-relaxed"
                placeholder="Escribe tu publicación de LinkedIn..."
              />
            ) : (
              <textarea
                rows={3}
                value={xPostText}
                onChange={(e) => setCustomXText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-3 font-sans focus:border-indigo-500 focus:outline-hidden resize-y leading-relaxed"
                placeholder="Escribe tu tweet para X..."
              />
            )}
          </div>

          {/* Social Preview Mockup (What viewers will see) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="uppercase tracking-wider text-[11px] font-bold">
                Vista Previa en {platform === "linkedin" ? "LinkedIn" : "X (Twitter)"}
              </span>
              <span>1200 × 630 OpenGraph Render</span>
            </div>

            {/* LinkedIn Mockup Card */}
            {platform === "linkedin" && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 shadow-md">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    SP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      SourceFinder Pod
                      <span className="text-[10px] text-slate-400 font-normal">· Siguiendo</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Plataforma de Investigación & Podcasts de IA</div>
                  </div>
                </div>

                {/* Post Text Preview */}
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {linkedinPostText}
                </div>

                {/* Link Preview Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs hover:border-slate-700 transition-colors">
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden flex items-center justify-center">
                    {coverArtUrl ? (
                      <Image
                        src={coverArtUrl}
                        alt={topic}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Radio className="w-10 h-10 text-indigo-400" />
                        <span className="text-xs font-mono font-bold">SourceFinder Pod HD</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="px-2 py-0.5 rounded bg-indigo-900/90 text-indigo-200 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {durationFormatted}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Grounding Verificado
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">ia.conectachava.com</span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{topic}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {metadataDescription ||
                        "Debate periodístico e investigación automatizada con Google Search Grounding y síntesis multivoz en alta definición."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* X (Twitter) Mockup Card */}
            {platform === "x" && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs">
                    SF
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-white">SourceFinder Pod</span>
                    <span className="text-slate-500 font-mono">@SourceFinderPod · 1m</span>
                  </div>
                </div>

                <div className="text-xs text-slate-200 whitespace-pre-line font-sans pl-11">
                  {xPostText}
                </div>

                {/* Twitter Large Image Summary Card */}
                <div className="ml-11 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <div className="relative h-44 w-full bg-slate-800">
                    {coverArtUrl ? (
                      <Image
                        src={coverArtUrl}
                        alt={topic}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Radio className="w-8 h-8 text-indigo-400" />
                        <span className="text-xs font-mono">SourceFinder Pod Preview</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-900">
                    <span className="text-[10px] text-slate-500 font-mono block">ia.conectachava.com</span>
                    <h4 className="text-xs font-bold text-white truncate">{topic}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Link & Actions Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300">Enlace Público para Compartir:</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 font-mono outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copiado" : "Copiar Enlace"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Sharing Action Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyPostText}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Copiar Texto Completo</span>
          </button>

          <div className="flex items-center gap-2">
            {platform === "linkedin" ? (
              <button
                onClick={handleShareToLinkedIn}
                className="px-5 py-2.5 bg-[#0a66c2] hover:bg-[#084e96] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Linkedin className="w-4 h-4" />
                <span>Publicar en LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ) : (
              <button
                onClick={handleShareToX}
                className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Twitter className="w-4 h-4 text-slate-900" />
                <span>Publicar en X (Twitter)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
