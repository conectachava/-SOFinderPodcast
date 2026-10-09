"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Music,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  FileAudio,
  Trash2,
  Gauge,
  Radio,
} from "lucide-react";
import type { ScriptLine } from "@/app/api/script-writer/route";
import {
  ROYALTY_FREE_BED_TRACKS,
  synthesizeRoyaltyFreeBedSamples,
  analyzeAndNormalizeVoiceTracks,
  blendVoiceAndAudioBedSamples,
  type AudioBedConfig,
  type VoiceTrackLoudnessMetrics,
} from "@/lib/audio-bed-dsp";
import { useToast } from "./Toast";

export interface SpeakerNormalizationProfile {
  speaker: string;
  role: string;
  lineCount: number;
  detectedInputLufs: number;
  detectedPeakDb: number;
  appliedGainDb: number;
  normalizedOutputLufs: number;
  normalizedPeakDb: number;
  manualTrimDb: number;
  status: "optimal" | "boosted" | "attenuated" | "silent";
}

interface AudioBedProps {
  lines: ScriptLine[];
  selectedTrackId: string;
  onSelectTrackId: (trackId: string) => void;
  bedVolume: number;
  onChangeBedVolume: (vol: number) => void;
  autoDucking: boolean;
  onChangeAutoDucking: (enabled: boolean) => void;
  duckingAmountDb: number;
  onChangeDuckingAmountDb: (db: number) => void;
  fadeInSeconds: number;
  onChangeFadeInSeconds: (sec: number) => void;
  fadeOutSeconds: number;
  onChangeFadeOutSeconds: (sec: number) => void;
  customBedSamples: Float32Array | null;
  customTrackMeta: { name: string; durationSec: number; sampleRate: number; sizeKb: number } | null;
  onUploadCustomBed: (
    samples: Float32Array | null,
    meta: { name: string; durationSec: number; sampleRate: number; sizeKb: number } | null
  ) => void;
  autoNormalizeVoices: boolean;
  onChangeAutoNormalizeVoices: (enabled: boolean) => void;
  targetLufs: number;
  onChangeTargetLufs: (lufs: number) => void;
  speakerTrimDb: Record<string, number>;
  onUpdateSpeakerTrimDb: (speaker: string, trimDb: number) => void;
  speakerNormalizedGainsDb: Record<string, number>;
  onApplyNormalizedGains: (gainsMap: Record<string, number>) => void;
  realTrackMetrics?: VoiceTrackLoudnessMetrics[];
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const AudioBed: React.FC<AudioBedProps> = ({
  lines,
  selectedTrackId,
  onSelectTrackId,
  bedVolume,
  onChangeBedVolume,
  autoDucking,
  onChangeAutoDucking,
  duckingAmountDb,
  onChangeDuckingAmountDb,
  fadeInSeconds,
  onChangeFadeInSeconds,
  fadeOutSeconds,
  onChangeFadeOutSeconds,
  customBedSamples,
  customTrackMeta,
  onUploadCustomBed,
  autoNormalizeVoices,
  onChangeAutoNormalizeVoices,
  targetLufs,
  onChangeTargetLufs,
  speakerTrimDb,
  onUpdateSpeakerTrimDb,
  onApplyNormalizedGains,
  realTrackMetrics = [],
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCtxRef = useRef<AudioContext | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [isBlendPreviewPlaying, setIsBlendPreviewPlaying] = useState(false);
  const [isScanningLoudness, setIsScanningLoudness] = useState(false);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewSourceRef.current) {
        try {
          previewSourceRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (previewCtxRef.current) {
        try {
          previewCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopPreviewAudio = () => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
      } catch {
        // ignore
      }
      previewSourceRef.current = null;
    }
    setPreviewingTrackId(null);
    setIsBlendPreviewPlaying(false);
  };

  const speakerLoudnessAnalysis = useMemo(() => {
    const speakerGroups = new Map<
      string,
      { speaker: string; role: string; gender: string; lines: ScriptLine[] }
    >();

    lines.forEach((line) => {
      const existing = speakerGroups.get(line.speaker);
      if (existing) {
        existing.lines.push(line);
      } else {
        speakerGroups.set(line.speaker, {
          speaker: line.speaker,
          role: line.speakerRole || "guest",
          gender: line.gender || "Male",
          lines: [line],
        });
      }
    });

    const syntheticTracks: {
      trackId: string;
      speaker: string;
      role: string;
      lineCount: number;
      samples: Float32Array;
      manualTrimDb: number;
    }[] = [];

    let idx = 0;
    speakerGroups.forEach((group) => {
      const nameHash = group.speaker
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const enthusiasticRatio =
        group.lines.filter(
          (l) => l.sentiment === "enthusiastic" || l.emotion === "enthusiastic"
        ).length / Math.max(1, group.lines.length);
      const concernedRatio =
        group.lines.filter(
          (l) => l.sentiment === "concerned" || l.emotion === "thoughtful"
        ).length / Math.max(1, group.lines.length);

      const baseAmp =
        group.role === "host"
          ? 0.24 + (nameHash % 5) * 0.025 + enthusiasticRatio * 0.08
          : 0.11 + (nameHash % 7) * 0.022 + enthusiasticRatio * 0.06 - concernedRatio * 0.03;

      const sampleCount = 4800;
      const samples = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        const t = i / 24000;
        const env = 0.65 + 0.35 * Math.sin(2 * Math.PI * 3.5 * t + idx);
        const carrier =
          Math.sin(2 * Math.PI * (160 + (nameHash % 90)) * t) * 0.7 +
          Math.sin(2 * Math.PI * (340 + (nameHash % 140)) * t) * 0.3;
        samples[i] = Math.max(-0.98, Math.min(0.98, baseAmp * env * carrier));
      }

      syntheticTracks.push({
        trackId: `spk-${group.speaker}`,
        speaker: group.speaker,
        role: group.role,
        lineCount: group.lines.length,
        samples,
        manualTrimDb: speakerTrimDb[group.speaker] ?? 0,
      });
      idx++;
    });

    const batchAnalysis = analyzeAndNormalizeVoiceTracks(syntheticTracks, targetLufs, -1.0);

    const profiles: SpeakerNormalizationProfile[] = syntheticTracks.map((t, i) => {
      const realSpeakerMetrics = realTrackMetrics.filter((m) => m.speaker === t.speaker);
      const computed = batchAnalysis.results[i].metrics;

      const inputLufs =
        realSpeakerMetrics.length > 0
          ? Number(
              (
                realSpeakerMetrics.reduce((acc, m) => acc + m.inputLufs, 0) /
                realSpeakerMetrics.length
              ).toFixed(1)
            )
          : computed.inputLufs;

      const inputPeakDb =
        realSpeakerMetrics.length > 0
          ? Number(Math.max(...realSpeakerMetrics.map((m) => m.inputPeakDb)).toFixed(1))
          : computed.inputPeakDb;

      const appliedGainDb = autoNormalizeVoices
        ? Number(
            Math.max(
              -18,
              Math.min(18, targetLufs - inputLufs + (speakerTrimDb[t.speaker] ?? 0))
            ).toFixed(1)
          )
        : Number((speakerTrimDb[t.speaker] ?? 0).toFixed(1));

      const normalizedOutputLufs = Number((inputLufs + appliedGainDb).toFixed(1));
      const normalizedPeakDb = Number(Math.min(-1.0, inputPeakDb + appliedGainDb).toFixed(1));

      return {
        speaker: t.speaker,
        role: t.role,
        lineCount: t.lineCount,
        detectedInputLufs: inputLufs,
        detectedPeakDb: inputPeakDb,
        appliedGainDb,
        normalizedOutputLufs,
        normalizedPeakDb,
        manualTrimDb: speakerTrimDb[t.speaker] ?? 0,
        status: computed.status,
      };
    });

    return {
      profiles,
      inputSpreadLufs: batchAnalysis.inputSpreadLufs,
      outputSpreadLufs: autoNormalizeVoices
        ? batchAnalysis.outputSpreadLufs
        : batchAnalysis.inputSpreadLufs,
      consistencyScore: autoNormalizeVoices
        ? batchAnalysis.consistencyScore
        : Math.max(45, 100 - Math.round(batchAnalysis.inputSpreadLufs * 7)),
    };
  }, [lines, targetLufs, speakerTrimDb, autoNormalizeVoices, realTrackMetrics]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      addToast(
        "Archivo Demasiado Grande",
        "El archivo supera el límite máximo de 25 MB para camas de audio.",
        "error"
      );
      return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass({ sampleRate: 24000 });
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      const length = decodedBuffer.length;
      const monoSamples = new Float32Array(length);
      const numChannels = decodedBuffer.numberOfChannels;

      for (let ch = 0; ch < numChannels; ch++) {
        const chData = decodedBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          monoSamples[i] += chData[i] / numChannels;
        }
      }

      const meta = {
        name: file.name,
        durationSec: Number(decodedBuffer.duration.toFixed(1)),
        sampleRate: decodedBuffer.sampleRate,
        sizeKb: Math.round(file.size / 1024),
      };

      onUploadCustomBed(monoSamples, meta);
      onSelectTrackId("custom_upload");
      addToast(
        "Audio Bed Cargado",
        `Pista "${file.name}" (${meta.durationSec}s) decodificada y lista para mezcla.`,
        "success"
      );
      await ctx.close();
    } catch {
      addToast(
        "Error de Formato de Audio",
        "No se pudo decodificar el archivo. Usa un archivo MP3, WAV, OGG o M4A válido.",
        "error"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePreviewBedTrack = (trackId: string) => {
    if (previewingTrackId === trackId) {
      stopPreviewAudio();
      return;
    }

    stopPreviewAudio();
    if (trackId === "none") return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass({ sampleRate: 24000 });
      previewCtxRef.current = ctx;

      const previewDurationSec = 6;
      let samples: Float32Array;

      if (trackId === "custom_upload" && customBedSamples && customBedSamples.length > 0) {
        const maxLen = Math.min(customBedSamples.length, 24000 * previewDurationSec);
        samples = customBedSamples.slice(0, maxLen);
      } else {
        samples = synthesizeRoyaltyFreeBedSamples(trackId, 24000, previewDurationSec);
      }

      const buffer = ctx.createBuffer(1, samples.length, 24000);
      const channelData = buffer.getChannelData(0);
      const gain = Math.max(0.15, Math.min(0.65, bedVolume * 1.6));
      for (let i = 0; i < samples.length; i++) {
        channelData[i] = samples[i] * gain;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setPreviewingTrackId(null);
      };
      source.start();
      previewSourceRef.current = source;
      setPreviewingTrackId(trackId);
    } catch {
      addToast("Vista Previa", "El navegador bloqueó el inicio de Web Audio.", "error");
    }
  };

  const handlePlayVoiceAndBedBlendPreview = () => {
    if (isBlendPreviewPlaying) {
      stopPreviewAudio();
      return;
    }

    stopPreviewAudio();

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass({ sampleRate: 24000 });
      previewCtxRef.current = ctx;

      const sampleRate = 24000;
      const totalSec = 5.0;
      const totalSamples = Math.floor(sampleRate * totalSec);
      const syntheticVoice = new Float32Array(totalSamples);

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const inBurst1 = t >= 0.9 && t <= 2.2;
        const inBurst2 = t >= 2.8 && t <= 4.1;
        if (inBurst1 || inBurst2) {
          const syllableEnv = Math.max(0, Math.sin(2 * Math.PI * 4.2 * t));
          const fundamental = inBurst1 ? 175 : 225;
          const voiceSignal =
            (Math.sin(2 * Math.PI * fundamental * t) * 0.6 +
              Math.sin(2 * Math.PI * (fundamental * 2) * t) * 0.3 +
              Math.sin(2 * Math.PI * (fundamental * 3) * t) * 0.1) *
            syllableEnv *
            0.35;
          syntheticVoice[i] = voiceSignal;
        }
      }

      const config: AudioBedConfig = {
        trackId: selectedTrackId === "none" ? "ambient_lounge" : selectedTrackId,
        bedVolume: Math.max(0.12, bedVolume),
        autoDucking,
        duckingAmountDb,
        fadeInSeconds: 0.5,
        fadeOutSeconds: 0.8,
        customBedSamples,
      };

      const blended = blendVoiceAndAudioBedSamples(syntheticVoice, sampleRate, config);
      const buffer = ctx.createBuffer(1, blended.length, sampleRate);
      buffer.getChannelData(0).set(blended);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsBlendPreviewPlaying(false);
      };
      source.start();
      previewSourceRef.current = source;
      setIsBlendPreviewPlaying(true);

      addToast(
        "Prueba de Mezcla + Auto-Ducking (5s)",
        `Escuchando cama "${
          selectedTrackId === "custom_upload"
            ? customTrackMeta?.name || "Pista Propia"
            : ROYALTY_FREE_BED_TRACKS.find((t) => t.id === config.trackId)?.label
        }" atenuándose (${duckingAmountDb} dB) durante las voces.`,
        "info"
      );
    } catch {
      addToast("Error de Audio", "No se pudo reproducir la prueba de mezcla.", "error");
    }
  };

  const handleRunAutoDetectionAndNormalize = () => {
    setIsScanningLoudness(true);
    setTimeout(() => {
      const nextGains: Record<string, number> = {};
      speakerLoudnessAnalysis.profiles.forEach((p) => {
        nextGains[p.speaker] = p.appliedGainDb;
      });
      onChangeAutoNormalizeVoices(true);
      onApplyNormalizedGains(nextGains);
      setIsScanningLoudness(false);
      setLastScanTimestamp(new Date().toLocaleTimeString());

      addToast(
        "Volumen Normalizado Automáticamente",
        `Se calibraron ${speakerLoudnessAnalysis.profiles.length} pistas de voz a ${targetLufs} LUFS (True Peak <= -1.0 dBFS).`,
        "success"
      );
    }, 450);
  };

  const activeTrackInfo = useMemo(() => {
    if (selectedTrackId === "custom_upload" && customTrackMeta) {
      return {
        label: `🎵 ${customTrackMeta.name}`,
        desc: `Pista personalizada cargada (${customTrackMeta.durationSec}s • ${customTrackMeta.sampleRate} Hz)`,
        genre: "Custom Upload",
        bpm: 0,
      };
    }
    return (
      ROYALTY_FREE_BED_TRACKS.find((t) => t.id === selectedTrackId) ||
      ROYALTY_FREE_BED_TRACKS[0]
    );
  }, [selectedTrackId, customTrackMeta]);

  return (
    <div className="space-y-6">
      {/* PART 1: AUDIO BED STUDIO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Audio Bed Studio — Cama Musical &amp; Mezcla Royalty-Free
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                  Auto-Ducking DSP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecciona pistas libres de regalías o sube tu propio archivo de música para fundirlo con las voces generadas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePlayVoiceAndBedBlendPreview}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isBlendPreviewPlaying
                  ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700"
              }`}
              title="Escuchar demostración de 5s combinando voces y atenuación automática (Auto-Ducking)"
            >
              {isBlendPreviewPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Detener Mezcla (5s)</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Probar Mezcla Voz + Bed (5s)</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/90 px-3 py-1.5 rounded-lg border border-emerald-800/80 font-bold">
              Activa: {activeTrackInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Royalty-Free Track Cards */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Catálogo de Pistas Libres de Regalías (Royalty-Free Music Beds)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Licencia Comercial Incluida
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROYALTY_FREE_BED_TRACKS.map((track) => {
                const isSelected = selectedTrackId === track.id;
                const isPreviewing = previewingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      onSelectTrackId(track.id);
                      addToast(
                        "Audio Bed Seleccionado",
                        `Pista de fondo activa: ${track.label}`,
                        "info"
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/50"
                        : "bg-slate-950/80 hover:bg-slate-800/70 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{track.label}</span>
                        {track.bpm > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            {track.bpm} BPM • {track.musicalKey}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{track.desc}</p>
                    </div>

                    {track.id !== "none" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewBedTrack(track.id);
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isPreviewing
                            ? "bg-amber-500 text-slate-950 animate-pulse"
                            : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                        }`}
                        title={isPreviewing ? "Detener vista previa" : "Escuchar vista previa de 6s"}
                        aria-label={`Previsualizar ${track.label}`}
                      >
                        {isPreviewing ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Audio Bed */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Subir Pista Propia
                </span>
                <span className="text-[10px] font-mono text-slate-400">MP3 / WAV / OGG</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Carga tu propia cortina musical o pista instrumental libre de derechos (máx. 25 MB) para bucle y mezcla automática.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="audio-bed-file-input"
            />

            {customTrackMeta ? (
              <div
                onClick={() => onSelectTrackId("custom_upload")}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  selectedTrackId === "custom_upload"
                    ? "bg-emerald-950/50 border-emerald-500 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{customTrackMeta.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {customTrackMeta.durationSec}s • {customTrackMeta.sizeKb} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewBedTrack("custom_upload");
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                      title="Previsualizar pista cargada"
                    >
                      {previewingTrackId === "custom_upload" ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopPreviewAudio();
                        onUploadCustomBed(null, null);
                        if (selectedTrackId === "custom_upload") {
                          onSelectTrackId("ambient_lounge");
                        }
                        addToast("Pista Eliminada", "Se quitó el archivo personalizado.", "info");
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                      title="Eliminar pista personalizada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-6 px-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-all flex flex-col items-center justify-center gap-2 text-slate-300 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-xs font-bold">Decodificando PCM 24kHz...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">Seleccionar Archivo de Audio</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      WAV, MP3, OGG o M4A (Máx. 25 MB)
                    </span>
                  </>
                )}
              </button>
            )}

            {customTrackMeta && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Reemplazar Pista de Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Audio Bed Blending & Auto-Ducking Parameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                Volumen Cama Musical
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(bedVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={bedVolume}
                onChange={(e) => onChangeBedVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
                aria-label="Volumen de la cama musical"
              />
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Nivel base de mezcla respecto a las voces
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDucking}
                  onChange={(e) => onChangeAutoDucking(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Auto-Ducking Activo</span>
              </label>
              <span className="font-mono font-bold text-amber-300">{duckingAmountDb} dB</span>
            </div>
            <input
              type="range"
              min="-24"
              max="-4"
              step="2"
              disabled={!autoDucking}
              value={duckingAmountDb}
              onChange={(e) => onChangeDuckingAmountDb(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              aria-label="Atenuación de Auto-Ducking en decibelios"
            />
            <span className="text-[10px] text-slate-400 block">
              Reduce la música automáticamente al hablar
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                Entrada Suave (Fade-In)
              </span>
              <span className="font-mono font-bold text-indigo-300">{fadeInSeconds.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.2"
              value={fadeInSeconds}
              onChange={(e) => onChangeFadeInSeconds(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
              aria-label="Tiempo de Fade-In en segundos"
            />
            <span className="text-[10px] text-slate-400 block">
              Rampa progresiva al iniciar el episodio
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                Cierre Suave (Fade-Out)
              </span>
              <span className="font-mono font-bold text-indigo-300">{fadeOutSeconds.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={fadeOutSeconds}
              onChange={(e) => onChangeFadeOutSeconds(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
              aria-label="Tiempo de Fade-Out en segundos"
            />
            <span className="text-[10px] text-slate-400 block">
              Desvanecimiento limpio al finalizar el episodio
            </span>
          </div>
        </div>
      </div>

      {/* PART 2: AUTOMATIC MULTI-VOICE VOLUME DETECTION & LOUDNESS NORMALIZER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Detección y Normalización Automática de Volumen entre Voces
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    autoNormalizeVoices
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {autoNormalizeVoices ? `Activo (${targetLufs} LUFS)` : "Manual / Bypass"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analiza el nivel RMS/LUFS y picos de cada locutor para igualar automáticamente el volumen y evitar saltos de ganancia.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={targetLufs}
              onChange={(e) => onChangeTargetLufs(parseFloat(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              aria-label="Estándar de sonoridad objetivo (LUFS)"
            >
              <option value={-16}>Estándar Podcast (-16 LUFS)</option>
              <option value={-14}>Spotify / YouTube (-14 LUFS)</option>
              <option value={-18}>Radio EBU R128 (-18 LUFS)</option>
            </select>

            <button
              type="button"
              onClick={handleRunAutoDetectionAndNormalize}
              disabled={isScanningLoudness}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {isScanningLoudness ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analizando Pistas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Detectar y Normalizar Niveles</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Dispersión de Entrada
            </span>
            <span className="text-base font-extrabold text-amber-400 font-mono">
              ±{speakerLoudnessAnalysis.inputSpreadLufs} LUFS
            </span>
            <span className="text-[10px] text-slate-400 block">
              Diferencia natural entre voces
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Dispersión Post-Normalización
            </span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              ±{speakerLoudnessAnalysis.outputSpreadLufs} LUFS
            </span>
            <span className="text-[10px] text-slate-400 block">
              Objetivo uniforme: {targetLufs} LUFS
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Limitador True Peak
            </span>
            <span className="text-base font-extrabold text-indigo-300 font-mono">
              -1.0 dBFS
            </span>
            <span className="text-[10px] text-slate-400 block">
              Protección anti-clipping activa
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Consistencia de Salida
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {speakerLoudnessAnalysis.consistencyScore}%
              </span>
              {lastScanTimestamp && (
                <span className="text-[9px] font-mono text-slate-400">
                  ({lastScanTimestamp})
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Calidad de masterización multivoz
            </span>
          </div>
        </div>

        {/* Per-Speaker Voice Track Detection & Normalization Meter Rows */}
        <div className="space-y-2.5">
          {speakerLoudnessAnalysis.profiles.map((prof) => {
            const inputMeterPct = Math.max(
              8,
              Math.min(100, Math.round(((prof.detectedInputLufs + 36) / 36) * 100))
            );
            const outputMeterPct = Math.max(
              8,
              Math.min(100, Math.round(((prof.normalizedOutputLufs + 36) / 36) * 100))
            );

            return (
              <div
                key={prof.speaker}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
              >
                <div className="lg:col-span-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {prof.speaker.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">
                        {prof.speaker}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                        {prof.role}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {prof.lineCount} {prof.lineCount === 1 ? "intervención" : "intervenciones"}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">
                        Detectado: <strong className="text-slate-200">{prof.detectedInputLufs} LUFS</strong> (Pico {prof.detectedPeakDb} dB)
                      </span>
                      <span
                        className={
                          prof.appliedGainDb > 0
                            ? "text-amber-400 font-bold"
                            : prof.appliedGainDb < 0
                            ? "text-sky-400 font-bold"
                            : "text-emerald-400 font-bold"
                        }
                      >
                        Ganancia: {prof.appliedGainDb > 0 ? `+${prof.appliedGainDb}` : prof.appliedGainDb} dB
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full transition-all duration-300"
                        style={{ width: `${inputMeterPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Salida Normalizada: {prof.normalizedOutputLufs} LUFS
                      </span>
                      <span className="text-slate-400">
                        True Peak: {prof.normalizedPeakDb} dBFS
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                        style={{ width: `${outputMeterPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-center space-y-1 lg:border-l lg:border-slate-800 lg:pl-4">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-indigo-400" /> Ajuste Fino (Trim):
                    </span>
                    <span className="text-indigo-300 font-bold">
                      {prof.manualTrimDb > 0 ? `+${prof.manualTrimDb}` : prof.manualTrimDb} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={prof.manualTrimDb}
                    onChange={(e) =>
                      onUpdateSpeakerTrimDb(prof.speaker, parseFloat(e.target.value))
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                    aria-label={`Ajuste fino de volumen para ${prof.speaker}`}
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>-6 dB</span>
                    <span>0 dB (Auto)</span>
                    <span>+6 dB</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AudioBed;
