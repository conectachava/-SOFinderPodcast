"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Mic,
  Music,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { ScriptLine } from "@/app/api/script-writer/route";
import { useToast } from "./Toast";

interface PodcastStudioViewProps {
  scriptLines: ScriptLine[];
  rawScript?: string;
  topic?: string;
}

export function PodcastStudioView({
  scriptLines: initialLines,
  rawScript: initialRawScript,
  topic = "Edición Especial Podcast",
}: PodcastStudioViewProps) {
  const { addToast } = useToast();

  const [lines, setLines] = useState<ScriptLine[]>(initialLines);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0.9);
  const [musicDucking, setMusicDucking] = useState<number>(0.15); // background ambient level
  const [geminiAudioLoading, setGeminiAudioLoading] = useState<boolean>(false);
  const [geminiAudioUrl, setGeminiAudioUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Sync lines state when initialLines change
  const [prevInitialLines, setPrevInitialLines] = useState(initialLines);
  if (initialLines !== prevInitialLines) {
    setPrevInitialLines(initialLines);
    if (initialLines && initialLines.length > 0) {
      setLines(initialLines);
      setActiveLineIdx(0);
    }
  }

  // Web Speech Synthesis engine fallback / playback loop
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    if (activeLineIdx >= lines.length) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setActiveLineIdx(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    const currentLine = lines[activeLineIdx];
    if (!currentLine) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentLine.text);
    utterance.rate = playbackSpeed * 1.05;
    utterance.volume = volume;

    // Pick voice based on speaker gender / role
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find((v) => v.lang.startsWith("es") || v.lang.startsWith("en"));

    if (currentLine.gender === "Female") {
      const fVoice = voices.find(
        (v) =>
          (v.lang.startsWith("es") || v.lang.startsWith("en")) &&
          (v.name.includes("Female") || v.name.includes("Monica") || v.name.includes("Samantha") || v.name.includes("Google US English"))
      );
      if (fVoice) selectedVoice = fVoice;
    } else {
      const mVoice = voices.find(
        (v) =>
          (v.lang.startsWith("es") || v.lang.startsWith("en")) &&
          (v.name.includes("Male") || v.name.includes("Jorge") || v.name.includes("Daniel") || v.name.includes("Google UK English Male"))
      );
      if (mVoice) selectedVoice = mVoice;
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (isPlaying) {
        setActiveLineIdx((prev) => prev + 1);
      }
    };

    utterance.onerror = () => {
      if (isPlaying) {
        setActiveLineIdx((prev) => prev + 1);
      }
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, activeLineIdx, lines, playbackSpeed, volume]);

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bars = 40;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        const x = i * (canvas.width / bars);
        const barWidth = canvas.width / bars - 2;

        let height = 4;
        if (isPlaying) {
          height = Math.sin(Date.now() * 0.01 + i * 0.3) * 18 + 22;
        }

        ctx.fillStyle = isPlaying ? (i % 2 === 0 ? "#0f172a" : "#10b981") : "#cbd5e1";
        ctx.fillRect(x, canvas.height / 2 - height / 2, barWidth, height);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying]);

  // Request high quality Gemini TTS for entire episode
  const handleGenerateGeminiTTS = async () => {
    if (lines.length === 0) {
      addToast("Error de Audio", "No hay guion cargado para generar audio.", "error");
      return;
    }

    setGeminiAudioLoading(true);
    addToast("Gemini TTS HD", "Sintetizando pista de audio en la nube con Gemini Voice...", "info");

    try {
      const fullText = lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          voiceName: "Zephyr",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gemini TTS falló");
      }

      const data = await res.json();
      if (data.audioBase64) {
        setGeminiAudioUrl(`data:${data.mimeType};base64,${data.audioBase64}`);
        addToast("Audio Listo", "Audio Gemini TTS generado exitosamente.", "success");
      }
    } catch (err: any) {
      const msg = err.message || "Error al sintetizar audio Gemini";
      addToast("Error de Síntesis", msg, "error");
    } finally {
      setGeminiAudioLoading(false);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSpeaker = lines[activeLineIdx] || null;

  return (
    <div className="space-y-6">
      {/* Studio Header & Main Audio Deck */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg space-y-6 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
              Radio Studio Deck v2.0
            </span>
            <h2 className="text-lg font-extrabold mt-1 text-slate-100">{topic}</h2>
            <p className="text-xs text-slate-400">
              Módulo de Doblaje Multivoz Sincronizado | Pista Principal + Mezclador Ambiental
            </p>
          </div>

          <button
            onClick={handleGenerateGeminiTTS}
            disabled={geminiAudioLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            {geminiAudioLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sintetizando Voz Gemini TTS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generar Audio Gemini TTS HD
              </>
            )}
          </button>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
          <canvas ref={canvasRef} width={320} height={40} className="w-full max-w-md h-10" />

          {currentSpeaker && (
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs">
              <div
                className={`w-3 h-3 rounded-full animate-ping ${
                  currentSpeaker.speakerRole === "host" ? "bg-pink-400" : "bg-emerald-400"
                }`}
              />
              <div>
                <span className="font-bold text-slate-200 block">{currentSpeaker.speaker}</span>
                <span className="text-[10px] text-slate-400">
                  {currentSpeaker.gender} | {currentSpeaker.accent}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls & Sliders */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveLineIdx(Math.max(0, activeLineIdx - 1))}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 font-bold"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setActiveLineIdx(Math.min(lines.length - 1, activeLineIdx + 1))}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono text-slate-400 ml-2">
              Línea {activeLineIdx + 1} / {lines.length}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300">
            {/* Speed selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Velocidad:</span>
              <button
                onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-mono font-bold"
              >
                {playbackSpeed}x
              </button>
            </div>

            {/* Music ducking slider */}
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Música Fondo:</span>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.05"
                value={musicDucking}
                onChange={(e) => setMusicDucking(parseFloat(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Gemini Audio Player if generated */}
        {geminiAudioUrl && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Audio Oficial Generado con Gemini TTS HD
            </span>
            <audio src={geminiAudioUrl} controls className="w-full h-8" />
          </div>
        )}
      </div>

      {/* Synchronized Script Transcript */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Mic className="w-4 h-4 text-slate-900" />
          Transcripción Sincronizada del Show
        </h3>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
          {lines.map((line, idx) => {
            const isActive = idx === activeLineIdx;
            return (
              <div
                key={line.id}
                onClick={() => {
                  setActiveLineIdx(idx);
                  setIsPlaying(true);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 font-bold">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        line.speakerRole === "host" ? "bg-pink-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className={isActive ? "text-white font-bold" : "text-slate-900"}>{line.speaker}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className={isActive ? "text-slate-300" : "text-slate-500"}>{line.accent}</span>
                    <span className={isActive ? "text-slate-400" : "text-slate-400"}>{line.timestamp}</span>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm font-serif leading-relaxed pl-4 border-l-2 ${isActive ? "border-pink-400 text-slate-100" : "border-slate-300 text-slate-800"}`}>
                  {line.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
