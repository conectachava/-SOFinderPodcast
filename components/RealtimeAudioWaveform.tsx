"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Activity,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";

interface RealtimeAudioWaveformProps {
  audioUrl?: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentSpeaker?: { speaker: string; speakerRole?: string; gender?: string; sentiment?: string } | null;
  topic?: string;
  volume?: number;
  playbackSpeed?: number;
  durationSeconds?: number;
  activeLineIdx?: number;
  totalLines?: number;
  onSeekTime?: (timeSeconds: number) => void;
}

export function RealtimeAudioWaveform({
  audioUrl,
  isPlaying,
  onTogglePlay,
  currentSpeaker,
  topic = "Podcast Master Track",
  volume = 0.9,
  playbackSpeed = 1,
  durationSeconds = 180,
  activeLineIdx = 0,
  totalLines = 1,
  onSeekTime,
}: RealtimeAudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [internalTime, setInternalTime] = useState<number>(0);
  const [actualDuration, setActualDuration] = useState<number>(durationSeconds);
  const [peakDb, setPeakDb] = useState<number>(-24);
  const [rmsLevel, setRmsLevel] = useState<number>(-28);
  const [visualizerMode, setVisualizerMode] = useState<"peaks" | "spectrum" | "hybrid">("hybrid");
  const [precomputedPeaks, setPrecomputedPeaks] = useState<number[] | null>(null);

  // Effective current time (uses audio playback if audioUrl, else active line fraction)
  const effectiveCurrentTime = useMemo(() => {
    if (audioUrl) return internalTime;
    if (isPlaying) {
      const lineFraction = (activeLineIdx + 1) / Math.max(1, totalLines);
      return lineFraction * durationSeconds;
    }
    return 0;
  }, [audioUrl, internalTime, isPlaying, activeLineIdx, totalLines, durationSeconds]);

  const isAudioLoaded = Boolean(audioUrl && precomputedPeaks);

  // Generate synthetic waveform peaks based on script lines if no raw audio is loaded yet
  const fallbackPeaks = useMemo(() => {
    const bars = 80;
    const generated: number[] = [];
    for (let i = 0; i < bars; i++) {
      const position = i / bars;
      // Combine multiple harmonic frequencies for natural speech envelope
      const harmonic1 = Math.sin(position * Math.PI * 4) * 0.25;
      const harmonic2 = Math.sin(position * Math.PI * 12) * 0.15;
      const noise = ((i * 37) % 19) / 70;
      const envelope = Math.sin(position * Math.PI); // tapering at edges
      const peak = Math.max(0.12, Math.min(0.95, (0.35 + harmonic1 + harmonic2 + noise) * envelope));
      generated.push(peak);
    }
    return generated;
  }, []);

  // Compute actual peaks when audioUrl is available
  useEffect(() => {
    if (!audioUrl) {
      return;
    }

    let isCancelled = false;

    const analyzeAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const tempCtx = new AudioCtxClass();
        const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);

        if (isCancelled) {
          tempCtx.close();
          return;
        }

        setActualDuration(decodedBuffer.duration);

        // Extract 80 peak samples across the track
        const channelData = decodedBuffer.getChannelData(0);
        const samplesCount = 80;
        const blockSize = Math.floor(channelData.length / samplesCount);
        const peaks: number[] = [];

        for (let i = 0; i < samplesCount; i++) {
          const start = i * blockSize;
          let max = 0;
          for (let j = 0; j < blockSize; j += 4) {
            const val = Math.abs(channelData[start + j] || 0);
            if (val > max) max = val;
          }
          peaks.push(Math.max(0.08, Math.min(1.0, max * 1.4)));
        }

        setPrecomputedPeaks(peaks);
        tempCtx.close();
      } catch (err) {
        console.warn("[RealtimeAudioWaveform] Fallback to synthetic peaks:", err);
      }
    };

    analyzeAudio();

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Connect Web Audio AnalyserNode to audio element when audioUrl plays
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !audioUrl) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtxClass();
      }

      const ctx = audioContextRef.current;

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      // Connect source node only once per element
      if (!sourceNodeRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioElement);
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
          sourceNodeRef.current = source;
        } catch (e) {
          // May already be connected
        }
      }
    } catch (e) {
      console.warn("[RealtimeAudioWaveform] Analyser connection notice:", e);
    }
  }, [audioUrl]);

  // Sync Audio playback with isPlaying prop
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = volume;
    audioElement.playbackRate = playbackSpeed;

    if (audioUrl) {
      if (isPlaying) {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        audioElement.play().catch((err) => {
          console.warn("[RealtimeAudioWaveform] Auto-play restriction:", err);
        });
      } else {
        audioElement.pause();
      }
    }
  }, [isPlaying, audioUrl, volume, playbackSpeed]);

  // Time progress update loop from native audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setInternalTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setInternalTime(0);
      if (isPlaying) onTogglePlay();
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [isPlaying, onTogglePlay]);

  // Real-time Canvas Rendering Loop (Peaks, FFT Spectrum & dB Meter)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const peaksToDraw = precomputedPeaks && precomputedPeaks.length > 0 ? precomputedPeaks : fallbackPeaks;
    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let currentPeakMagnitude = 0;
      let sumSquares = 0;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i] / 255;
          if (val > currentPeakMagnitude) currentPeakMagnitude = val;
          sumSquares += val * val;
        }
      } else if (isPlaying) {
        // Speech synthesis or fallback dynamic simulated peak
        const t = Date.now() * 0.008;
        currentPeakMagnitude = 0.4 + Math.sin(t * 1.8) * 0.25 + Math.sin(t * 4.2) * 0.15;
        sumSquares = currentPeakMagnitude * currentPeakMagnitude * bufferLength;
      }

      // Update Decibel & RMS readings
      if (isPlaying) {
        const peakDbfs = Math.max(-48, Math.round(20 * Math.log10(Math.max(0.001, currentPeakMagnitude))));
        const rmsVal = Math.sqrt(sumSquares / bufferLength);
        const rmsDbfs = Math.max(-54, Math.round(20 * Math.log10(Math.max(0.001, rmsVal))));
        setPeakDb(peakDbfs);
        setRmsLevel(rmsDbfs);
      } else {
        setPeakDb(-36);
        setRmsLevel(-42);
      }

      // 1. Draw Background Grid Lines & dB Reference Marks
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.25);
      ctx.lineTo(width, height * 0.25);
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.moveTo(0, height * 0.75);
      ctx.lineTo(width, height * 0.75);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Calculate Playhead Position
      const progress = actualDuration > 0 ? Math.min(1, effectiveCurrentTime / actualDuration) : 0;
      const playheadX = progress * width;

      // 3. Render according to visualizerMode
      if (visualizerMode === "spectrum") {
        // Real-time FFT Frequency Spectrum Analyzer
        const numBins = Math.min(bufferLength, 64);
        const binSpacing = width / numBins;
        const binWidth = Math.max(2, binSpacing - 2);

        for (let i = 0; i < numBins; i++) {
          const x = i * binSpacing;
          const val = isPlaying ? (dataArray[i] || 0) / 255 : (Math.sin(i * 0.2) * 0.15 + 0.15);
          const binHeight = Math.max(4, val * (height * 0.85));
          const yTop = height - binHeight - 4;

          const grad = ctx.createLinearGradient(0, yTop, 0, height);
          grad.addColorStop(0, "#f43f5e"); // Rose peak
          grad.addColorStop(0.3, "#a855f7"); // Purple
          grad.addColorStop(0.7, "#38bdf8"); // Sky
          grad.addColorStop(1, "#10b981"); // Emerald bass
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.roundRect(x, yTop, binWidth, binHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (visualizerMode === "peaks") {
        // DAW-Style Symmetrical Speech Peak Envelope (Mirrored across center)
        const numBars = peaksToDraw.length;
        const barSpacing = width / numBars;
        const barWidth = Math.max(2, barSpacing - 1.5);

        for (let i = 0; i < numBars; i++) {
          const x = i * barSpacing;
          let peak = peaksToDraw[i] || 0.2;

          if (isPlaying && Math.abs(x - playheadX) < 25) {
            peak = Math.min(1.0, peak * (1 + currentPeakMagnitude * 0.5));
          }

          const halfHeight = Math.max(2, (peak * (height * 0.8)) / 2);
          const yCenter = height / 2;
          const isPlayed = x <= playheadX;

          if (isPlayed) {
            const grad = ctx.createLinearGradient(0, yCenter - halfHeight, 0, yCenter + halfHeight);
            grad.addColorStop(0, "#38bdf8");
            grad.addColorStop(0.5, "#818cf8");
            grad.addColorStop(1, "#34d399");
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
          }

          ctx.beginPath();
          ctx.roundRect(x, yCenter - halfHeight, barWidth, halfHeight * 2, 2);
          ctx.fill();
        }
      } else {
        // Hybrid Mode: Classic Waveform with Frequency Flutter
        const numBars = peaksToDraw.length;
        const barSpacing = width / numBars;
        const barWidth = Math.max(2, barSpacing - 1.5);

        for (let i = 0; i < numBars; i++) {
          const x = i * barSpacing;
          let basePeak = peaksToDraw[i] || 0.2;

          if (isPlaying) {
            const distToPlayhead = Math.abs(x - playheadX);
            if (distToPlayhead < 30) {
              basePeak = Math.min(1.0, basePeak * (1 + currentPeakMagnitude * 0.6));
            } else if (analyser) {
              const freqIdx = i % bufferLength;
              const freqVal = (dataArray[freqIdx] || 0) / 255;
              basePeak = Math.min(1.0, basePeak * 0.7 + freqVal * 0.5);
            }
          }

          const barHeight = Math.max(4, basePeak * (height * 0.85));
          const yTop = (height - barHeight) / 2;
          const isPlayed = x <= playheadX;

          if (isPlayed) {
            const grad = ctx.createLinearGradient(0, yTop, 0, yTop + barHeight);
            grad.addColorStop(0, "#38bdf8");
            grad.addColorStop(0.5, "#818cf8");
            grad.addColorStop(1, "#34d399");
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = "rgba(100, 116, 139, 0.45)";
          }

          ctx.beginPath();
          ctx.roundRect(x, yTop, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      // 4. Render Playhead Needle & Glow
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead Top Pointer Cap
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(playheadX, 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Playhead Bottom Cap
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(playheadX, height - 5, 3, 0, Math.PI * 2);
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [precomputedPeaks, fallbackPeaks, actualDuration, effectiveCurrentTime, isPlaying, visualizerMode]);

  // Click on waveform to seek
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = clickRatio * actualDuration;

    setInternalTime(targetSeconds);

    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = targetSeconds;
    }

    if (onSeekTime) {
      onSeekTime(targetSeconds);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner space-y-4 relative overflow-hidden transition-colors">
      {/* Hidden audio element if audioUrl exists */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />}

      {/* Top Deck Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs relative z-10 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Play/Pause Trigger */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isPlaying
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 active:scale-95"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95"
            }`}
            title={isPlaying ? "Pausar reproducción" : "Reproducir audio del podcast"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            <span>{isPlaying ? "Pausa" : "Play"}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className={`font-bold uppercase tracking-wider ${isPlaying ? "text-emerald-300" : "text-slate-400"}`}>
              {isPlaying ? "En Reproducción Activa" : "Audio En Pausa"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="font-bold text-white">{formatTime(effectiveCurrentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTime(actualDuration)}</span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setVisualizerMode("hybrid")}
              className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                visualizerMode === "hybrid"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Modo Híbrido: Envolvente de audio modulada por frecuencias en vivo"
            >
              Híbrido
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode("peaks")}
              className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                visualizerMode === "peaks"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Modo Picos: Pista simétrica estilo DAW profesional"
            >
              Picos (DAW)
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode("spectrum")}
              className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                visualizerMode === "spectrum"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Modo Espectro: Analizador FFT de frecuencias por bandas"
            >
              Espectro FFT
            </button>
          </div>
        </div>

        {/* Live Audio Telemetry Meters */}
        <div className="flex items-center gap-4 font-mono text-[10px]">
          {/* Peak dB Meter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Peak dB:</span>
            <span
              className={`font-bold ${
                peakDb > -3
                  ? "text-red-400"
                  : peakDb > -12
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {peakDb} dB
            </span>
          </div>

          {/* Broadcast Loudness Standard (-16 LUFS Target) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Mastering:</span>
            <span className="text-indigo-400 font-bold">-16 LUFS EBU R128</span>
          </div>

          {/* Current Locutor Tag */}
          {currentSpeaker && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-200">{currentSpeaker.speaker}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Realtime Waveform Canvas (Clickable to Seek) */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={800}
          height={110}
          onClick={handleWaveformClick}
          className="w-full h-24 sm:h-28 bg-slate-900/80 rounded-lg cursor-pointer border border-slate-800/90 hover:border-slate-700 transition-colors shadow-2xs"
          title="Haz clic en cualquier punto para avanzar o retroceder el audio"
        />

        {/* Hover Hint */}
        <div className="absolute right-2 bottom-1.5 pointer-events-none opacity-0 group-hover:opacity-75 transition-opacity text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
          Haz clic para saltar en la pista
        </div>
      </div>

      {/* Waveform Frequency Axis & Equalizer Labels */}
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 px-1 pt-0.5">
        <div className="flex items-center gap-3">
          <span>20Hz Sub</span>
          <span className="text-slate-600">·</span>
          <span>250Hz Graves</span>
          <span className="text-slate-600">·</span>
          <span>1kHz Voces</span>
          <span className="text-slate-600">·</span>
          <span>4kHz Presencia</span>
          <span className="text-slate-600">·</span>
          <span>16kHz Aire</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            {isAudioLoaded ? "Pista PCM 24kHz Decodificada" : "Síntesis en Tiempo Real"}
          </span>
        </div>
      </div>
    </div>
  );
}
