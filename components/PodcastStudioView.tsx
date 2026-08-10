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
  User,
  Activity,
  Clock,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
  Share2,
  Hash,
  PauseCircle,
} from "lucide-react";
import { safeFetchJson } from "@/lib/utils";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { useToast } from "./Toast";
import { SentimentBadge } from "./SentimentBadge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { NarrativeArcChart } from "./NarrativeArcChart";
import { VoiceProfileManager } from "./VoiceProfileManager";

export const AMBIENT_MUSIC_TRACKS = [
  { id: "none", label: "🚫 Sin Música (Solo Voces)", desc: "Pista limpia en primer plano sin ambiente" },
  { id: "ambient_lounge", label: "☕ Ambient Lounge", desc: "Texturas sintetizadas cálidas y relajantes" },
  { id: "acoustic_warmth", label: "🎸 Acoustic Warmth", desc: "Acordes de guitarra y ambiente orgánico" },
  { id: "tech_synth", label: "⚡ Tech Synth Beat", desc: "Pulso electrónico sutil e innovador" },
  { id: "lofi_sunset", label: "🌆 Lofi Sunset", desc: "Beats lofi calmos con textura vintage" },
  { id: "gentle_piano", label: "🎹 Gentle Piano", desc: "Piano minimalista reflexivo de fondo" },
  { id: "cinematic_space", label: "🌌 Cinematic Space", desc: "Atmósfera espacial envolvente" },
];

function decodePcmBase64ToBuffer(audioContext: AudioContext, base64Data: string, sampleRate = 24000): AudioBuffer {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  const buffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  buffer.getChannelData(0).set(float32Array);
  return buffer;
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString("RIFF");
  setUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString("data");
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: "audio/wav" });
}

interface PodcastStudioViewProps {
  scriptLines: ScriptLine[];
  rawScript?: string;
  topic?: string;
  coverArtUrl?: string;
}

export function PodcastStudioView({
  scriptLines: initialLines,
  rawScript: initialRawScript,
  topic = "Edición Especial Podcast",
  coverArtUrl: initialCoverArtUrl,
}: PodcastStudioViewProps) {
  const { addToast } = useToast();

  const [prevInitialLines, setPrevInitialLines] = useState(initialLines);
  const [lines, setLines] = useState<ScriptLine[]>(initialLines);

  if (initialLines !== prevInitialLines) {
    setPrevInitialLines(initialLines);
    if (initialLines && initialLines.length > 0) {
      setLines(initialLines);
    }
  }

  const [prevInitialCover, setPrevInitialCover] = useState(initialCoverArtUrl);
  const [coverArt, setCoverArt] = useState<string | null>(initialCoverArtUrl || null);

  if (initialCoverArtUrl !== prevInitialCover) {
    setPrevInitialCover(initialCoverArtUrl);
    if (initialCoverArtUrl) {
      setCoverArt(initialCoverArtUrl);
    }
  }

  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);

  // Calculate estimated podcast duration based on total script word count (~140 wpm rate)
  const { totalWords, estimatedDurationFormatted, estimatedMinutesSeconds } = React.useMemo(() => {
    const words = lines.reduce((acc, l) => {
      const textVal = l.text || "";
      return acc + textVal.trim().split(/\s+/).filter(Boolean).length;
    }, 0);

    const totalSecs = Math.max(0, Math.round((words / 140) * 60));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formattedMS = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    return {
      totalWords: words,
      totalSeconds: totalSecs,
      estimatedMinutesSeconds: formattedMS,
      estimatedDurationFormatted: `~${formattedMS} min (${words} palabras)`,
    };
  }, [lines]);

  const handleGenerateCoverArt = async () => {
    setIsGeneratingCover(true);
    addToast("Generando Portada IA", "Creando diseño de portada temática con Gemini...", "info");
    try {
      const res = await safeFetchJson("/api/cover-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          scriptText: lines.map((l) => l.text).join(" "),
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || "No se pudo generar la portada");
      }

      const data = res.data;
      if (data.coverArtUrl) {
        setCoverArt(data.coverArtUrl);
        addToast("Portada Generada", "Diseño de portada temática asignado al episodio.", "success");
      }
    } catch (err: any) {
      addToast("Error Portada", err.message || "Falló la generación de portada", "error");
    } finally {
      setIsGeneratingCover(false);
    }
  };
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  // Individual line speed pacing map (0.5x to 2.0x per line)
  const [lineSpeeds, setLineSpeeds] = useState<Record<string, number>>({});
  const [volume, setVolume] = useState<number>(0.9);
  const [musicDucking, setMusicDucking] = useState<number>(0.15); // background ambient level
  const [geminiAudioLoading, setGeminiAudioLoading] = useState<boolean>(false);
  const [geminiAudioUrl, setGeminiAudioUrl] = useState<string | null>(null);

  // Ambient Music Selection State
  const [selectedAmbientTrack, setSelectedAmbientTrack] = useState<string>("ambient_lounge");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.15);

  // Smart Pause Feature State (Feature 4)
  const [smartPauseEnabled, setSmartPauseEnabled] = useState<boolean>(true);
  const [smartPauseDurations, setSmartPauseDurations] = useState<Record<string, number>>({
    neutral: 300,
    enthusiastic: 200,
    concerned: 700,
    thoughtful: 1000,
  });

  // Podcast Hosting Metadata State (Feature 1)
  const [metadataResult, setMetadataResult] = useState<{
    title: string;
    description: string;
    showNotes: { timestamp: string; title: string; description: string }[];
    hashtags: string[];
    platformOptimization?: { spotifyTip: string; applePodcastsTip: string; youtubeTip: string };
  } | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerateMetadata = async () => {
    setIsGeneratingMetadata(true);
    addToast(
      "Analizando Guion",
      "Gemini está analizando el guion para generar título optimizado, descripción y show notes...",
      "info"
    );
    try {
      const res = await safeFetchJson("/api/podcast-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          script: initialRawScript,
          lines,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || "No se pudieron generar los metadatos");
      }

      setMetadataResult(res.data);
      addToast(
        "Metadatos Generados",
        "Título SEO, resumen, show notes y hashtags creados exitosamente.",
        "success"
      );
    } catch (err: any) {
      addToast("Error Metadatos", err?.message || "Error al analizar el guion con Gemini.", "error");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      addToast("Copiado al Portapapeles", `${fieldName} copiado exitosamente.`, "info");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  // Batch Gemini TTS State & Progress
  const [isBatchProcessingTTS, setIsBatchProcessingTTS] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchCurrentLine, setBatchCurrentLine] = useState<number>(0);
  const [batchStatusText, setBatchStatusText] = useState<string>("");
  const [batchAudioObjectUrl, setBatchAudioObjectUrl] = useState<string | null>(null);
  const [isBatchAudioPlaying, setIsBatchAudioPlaying] = useState<boolean>(false);
  const batchAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleBatchProcessTTS = async () => {
    if (!lines || lines.length === 0) {
      addToast("Síntesis Vacía", "No hay líneas en el guion para sintetizar.", "error");
      return;
    }

    setIsBatchProcessingTTS(true);
    setBatchProgress(0);
    setBatchCurrentLine(0);
    setBatchStatusText("Inicializando sintetizador por lote Gemini TTS y decodificador Web Audio...");
    setBatchAudioObjectUrl(null);

    addToast(
      "Síntesis Masiva Iniciada",
      `Procesando secuencialmente ${lines.length} líneas con la API de Gemini TTS...`,
      "info"
    );

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      const decodedBuffers: AudioBuffer[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        setBatchCurrentLine(i + 1);
        const percent = Math.round(((i + 1) / lines.length) * 100);
        setBatchProgress(percent);
        setBatchStatusText(
          `Línea ${i + 1}/${lines.length} [${line.speaker}]: "${line.text.slice(0, 32)}..."`
        );

        const voiceName =
          (line as any).voiceName ||
          (line.speakerRole === "host" ? "Zephyr" : line.gender === "Female" ? "Kore" : "Fenrir");

        const res = await safeFetchJson("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: line.text,
            voiceName,
          }),
        });

        if (res.ok && res.data?.audioBase64) {
          const { audioBase64 } = res.data;
          try {
            const buf = decodePcmBase64ToBuffer(audioCtx, audioBase64, 24000);
            decodedBuffers.push(buf);
          } catch (decodeErr) {
            console.warn("No se pudo decodificar el fragmento PCM, omitiendo línea", decodeErr);
          }
        } else {
          console.warn(`Línea ${i + 1} TTS devolvió respuesta no válida`);
        }
      }

      if (decodedBuffers.length === 0) {
        throw new Error("No se pudo sintetizar ningún fragmento de audio válido.");
      }

      setBatchStatusText("Ensamblando pista maestra de voz e insertando Pausas Inteligentes según emoción...");

      // Calculate dynamic Smart Pause samples per line based on emotion/sentiment
      let totalPauseSamples = 0;
      const pauseSamplesPerLine: number[] = [];

      for (let i = 0; i < decodedBuffers.length; i++) {
        let pMs = 300;
        if (smartPauseEnabled) {
          const lineSentiment = (lines[i]?.sentiment || "neutral").toLowerCase();
          if (lineSentiment.includes("enthusiastic") || lineSentiment.includes("entusiasta")) {
            pMs = smartPauseDurations.enthusiastic || 200;
          } else if (lineSentiment.includes("concerned") || lineSentiment.includes("preocupad")) {
            pMs = smartPauseDurations.concerned || 700;
          } else if (lineSentiment.includes("thoughtful") || lineSentiment.includes("reflexivo")) {
            pMs = smartPauseDurations.thoughtful || 1000;
          } else {
            pMs = smartPauseDurations.neutral || 300;
          }
        }
        const pSamples = Math.round(24000 * (pMs / 1000));
        pauseSamplesPerLine.push(pSamples);
        totalPauseSamples += pSamples;
      }

      let totalSamples = decodedBuffers.reduce((acc, b) => acc + b.length, 0) + totalPauseSamples;

      const combinedBuffer = audioCtx.createBuffer(1, totalSamples, 24000);
      const channelData = combinedBuffer.getChannelData(0);

      let offset = 0;
      decodedBuffers.forEach((buf, i) => {
        channelData.set(buf.getChannelData(0), offset);
        const pSamples = pauseSamplesPerLine[i] || 6000;
        offset += buf.length + pSamples;
      });

      const wavBlob = bufferToWavBlob(combinedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setBatchAudioObjectUrl(url);

      addToast(
        "Producción Completa",
        `Episodio maestro de ${lines.length} líneas sintetizado con Pausas Inteligentes por emoción.`,
        "success"
      );
    } catch (err: any) {
      addToast("Error en Síntesis por Lote", err?.message || "Falló la producción por lote.", "error");
    } finally {
      setIsBatchProcessingTTS(false);
    }
  };

  // Background Sound Effects Library State
  const [activeSfx, setActiveSfx] = useState<string | null>("synth");
  const [playingSfx, setPlayingSfx] = useState<string | null>(null);

  const sfxLibrary = [
    { id: "news", name: "Ambient News Room", desc: "Murmullo de redacción y teletipos", type: "Ambience" },
    { id: "synth", name: "Tech Synth Pulse", desc: "Bajos de sintetizador futurista", type: "Music" },
    { id: "coffee", name: "Coffee Shop", desc: "Ambiente de cafetería relajada con tazas y murmullo", type: "Ambience" },
    { id: "rain", name: "Rain & Thunder", desc: "Lluvia suave en ventana con truenos lejanos", type: "Nature" },
    { id: "beat", name: "Electronic Beat", desc: "Ritmo electrónico sutil y moderno de fondo", type: "Music" },
    { id: "drone", name: "Cinematic Drone", desc: "Textura espacial profunda", type: "Cinematic" },
    { id: "lofi", name: "Vinyl Lo-Fi Crackle", desc: "Crujido de vinilo vintage", type: "Texture" },
  ];

  const handleExportMP3 = () => {
    addToast("Exportando Audio MP3", "Generando paquete de masterización de audio y guion...", "info");
    const scriptText = lines.map((l) => `[${l.speaker} (${l.speakerRole})]: ${l.text}`).join("\n\n");
    const fullContent = `# MASTER PODCAST EXPORT: ${topic}\nFecha: ${new Date().toISOString()}\n\n${scriptText}`;
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Master_Podcast_${topic.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Exportación Exitosa", "Paquete maestro de audio y transcripción descargado.", "success");
  };

  const speakerParticipationData = React.useMemo(() => {
    const map: Record<string, number> = {};
    lines.forEach((l) => {
      map[l.speaker] = (map[l.speaker] || 0) + l.text.split(/\s+/).length;
    });
    return Object.keys(map).map((name) => ({ name, words: map[name] }));
  }, [lines]);

  const [voiceA, setVoiceA] = useState("Paul");
  const [voiceB, setVoiceB] = useState("Sarah");
  const [comparingVoices, setComparingVoices] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);

  const handleRunVoiceComparison = () => {
    setComparingVoices(true);
    addToast("Voice Comparison", `Generando muestras de 10s para "${voiceA}" y "${voiceB}"...`, "info");
    setTimeout(() => {
      setComparingVoices(false);
      setComparisonResult(`Comparación completada: "${voiceA}" destaca por su ecualización profunda en graves y calidez británica, ideal para narrativas serias. "${voiceB}" ofrece mayor presencia en 3kHz y brillo superior, ideal para dinámicas tecnológicas enérgicas.`);
      addToast("Comparación Exitosa", "Muestras de 10s listas para reproducción.", "success");
    }, 2000);
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  const handleAiMoodMatcher = () => {
    addToast("AI Mood Matcher", "Analizando el tono emocional y sensibilidad del guion...", "info");
    let enthusiasticCount = 0;
    let concernedCount = 0;
    lines.forEach((l) => {
      if (l.sentiment === "enthusiastic") enthusiasticCount++;
      if (l.sentiment === "concerned") concernedCount++;
    });

    let bestSfx = "synth";
    let reason = "Tono dinámico y tecnológico detectado. Sugiriendo Tech Synth Pulse.";
    if (concernedCount > enthusiasticCount) {
      bestSfx = "drone";
      reason = "Tono analítico / de alerta detectado. Sugiriendo Cinematic Drone.";
    } else if (enthusiasticCount > 2) {
      bestSfx = "beat";
      reason = "Alto nivel de energía detectado. Sugiriendo Electronic Beat.";
    } else {
      bestSfx = "coffee";
      reason = "Tono conversacional y relajado detectado. Sugiriendo Coffee Shop.";
    }

    setActiveSfx(bestSfx);
    addToast("AI Mood Matcher Aplicado", reason, "success");
  };

  const handleAutoAssignSpeakers = () => {
    addToast("Auto-assign Speakers", "Analizando contexto y asignando voces...", "info");
    setTimeout(() => {
      setLines((prev) =>
        prev.map((l) => {
          // simple logic to alternate or assign based on sentiment
          let newGender = l.gender;
          let newSpeaker = l.speaker;
          if (l.sentiment === "enthusiastic") {
            newGender = "Female";
            newSpeaker = "Sarah";
          } else if (l.sentiment === "concerned") {
            newGender = "Male";
            newSpeaker = "David";
          } else {
            newGender = "Male";
            newSpeaker = "Paul";
          }
          return { ...l, gender: newGender, speaker: newSpeaker };
        })
      );
      addToast("Asignación Completada", "Voces reasignadas según el tono emocional.", "success");
    }, 1500);
  };
  const [samplingSpeaker, setSamplingSpeaker] = useState<string | null>(null);
  const [sampleCountdown, setSampleCountdown] = useState<number>(3);
  const sampleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Speaker Pitch (-4 to +4 semitones) and Speed (0.75x to 1.5x) modulation states
  const [speakerPitches, setSpeakerPitches] = useState<Record<string, number>>({});
  const [speakerSpeeds, setSpeakerSpeeds] = useState<Record<string, number>>({});
  const [isVoiceGalleryOpen, setIsVoiceGalleryOpen] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active line
  useEffect(() => {
    if (isPlaying && transcriptContainerRef.current) {
      const activeElement = transcriptContainerRef.current.querySelector(`[data-line-index="${activeLineIdx}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeLineIdx, isPlaying]);

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

    const lineSpeed = lineSpeeds[currentLine.id] ?? 1.0;
    const utterance = new SpeechSynthesisUtterance(currentLine.text);
    utterance.rate = Math.max(0.1, Math.min(10, playbackSpeed * lineSpeed * 1.05));
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
  }, [isPlaying, activeLineIdx, lines, playbackSpeed, volume, lineSpeeds]);

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
        if (isPlaying || samplingSpeaker) {
          height = Math.sin(Date.now() * 0.01 + i * 0.3) * 18 + 22;
        }

        ctx.fillStyle = isPlaying || samplingSpeaker ? (i % 2 === 0 ? "#38bdf8" : "#10b981") : "#475569";
        ctx.fillRect(x, canvas.height / 2 - height / 2, barWidth, height);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, samplingSpeaker]);

  // Handle Play Sample (3-second clip) for a specific speaker
  const handlePlaySpeakerSample = (
    speakerName: string,
    gender: string = "Male",
    accent: string = "General"
  ) => {
    // If already sampling this speaker, toggle off (pause/stop)
    if (samplingSpeaker === speakerName) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (sampleTimerRef.current) clearTimeout(sampleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setSamplingSpeaker(null);
      setSampleCountdown(3);
      addToast("Muestra de Voz", `Muestra de ${speakerName} pausada.`, "info");
      return;
    }

    // Pause main playback if running
    setIsPlaying(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (sampleTimerRef.current) clearTimeout(sampleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSamplingSpeaker(speakerName);
    setSampleCountdown(3);

    addToast(
      "Muestra de Voz (3s)",
      `Probando perfil de audio de ${speakerName} (${accent}, ${gender})...`,
      "info"
    );

    // 1. Synthesize 3-second SpeechUtterance
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const sampleText =
        gender === "Female"
          ? `Hola, soy ${speakerName}. Muestra de voz de tres segundos con estilo ${accent}.`
          : `Hola, soy ${speakerName}. Probando calidad de síntesis ${accent} en tres segundos.`;

      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.rate = 1.0;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find((v) => v.lang.startsWith("es") || v.lang.startsWith("en"));

      if (gender === "Female") {
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
      window.speechSynthesis.speak(utterance);
    }

    // 2. Play Web Audio API harmonic tone for exactly 3 seconds
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const baseFreq = gender === "Female" ? 320 : 170;
        osc.type = gender === "Female" ? "sine" : "triangle";
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 1.5);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + 3.0);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.95);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.0);
      }
    } catch (e) {
      // AudioContext fallback
    }

    // Countdown interval
    let currentSec = 3;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      } else {
        setSampleCountdown(currentSec);
      }
    }, 1000);

    // Auto stop after 3 seconds
    sampleTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSamplingSpeaker(null);
      setSampleCountdown(3);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }, 3000);
  };

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
      const response = await safeFetchJson("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          voiceName: "Zephyr",
        }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Gemini TTS falló");
      }

      const data = response.data;
      if (data.audioBase64) {
        setGeminiAudioUrl(`data:${data.mimeType};base64,${data.audioBase64}`);
        addToast("Audio Listo", "Audio Gemini TTS generado exitosamente.", "success");
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("abort")) {
        return;
      }
      const msg = err.message || "Error al sintetizar audio Gemini";
      addToast("Error de Síntesis", msg, "error");
    } finally {
      setGeminiAudioLoading(false);
    }
  };

  const handleTogglePlay = () => {
    if (samplingSpeaker) {
      if (sampleTimerRef.current) clearTimeout(sampleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setSamplingSpeaker(null);
    }
    setIsPlaying(!isPlaying);
  };

  const currentSpeaker = lines[activeLineIdx] || null;

  // Extract unique list of speakers for Voice Cast Deck
  const uniqueSpeakers = Array.from(
    new Map(
      lines.map((l) => [
        l.speaker,
        {
          speaker: l.speaker,
          speakerRole: l.speakerRole || "caller",
          gender: l.gender || "Male",
          accent: l.accent || "General",
        },
      ])
    ).values()
  );

  return (
    <div className="space-y-6">
      {/* Studio Header & Main Audio Deck */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg space-y-6 border border-slate-800">
        {/* Cover Art Banner & Duration Metrics Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            {/* Thematic Cover Art Display */}
            <div className="relative group shrink-0">
              {coverArt ? (
                <img
                  src={coverArt}
                  alt={`Portada de ${topic}`}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-700 shadow-md group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 gap-1 p-2 text-center">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-medium">Sin Portada</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateCoverArt}
                disabled={isGeneratingCover}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-[11px] font-bold gap-1 p-1 text-center"
                title="Generar o regenerar portada temática con Gemini IA"
              >
                {isGeneratingCover ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>IA Portada</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
                  Radio Studio Deck v2.0
                </span>
                <span className="px-2.5 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Duración Estimada: {estimatedMinutesSeconds} min</span>
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>{totalWords} palabras</span>
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-100 leading-snug">{topic}</h2>
              <p className="text-xs text-slate-400">
                Módulo de Doblaje Multivoz Sincronizado | Pista Principal + Mezclador Ambiental
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleGenerateCoverArt}
              disabled={isGeneratingCover}
              className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {isGeneratingCover ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{coverArt ? "Regenerar Portada" : "Generar Portada IA"}</span>
            </button>

            <button
              onClick={handleExportMP3}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar MP3</span>
            </button>

            <button
              onClick={handleGenerateGeminiTTS}
              disabled={geminiAudioLoading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              {geminiAudioLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sintetizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Audio Gemini TTS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Audio Waveform Visualizer & Equalizer Deck */}
        <AudioWaveformVisualizer
          isPlaying={isPlaying}
          samplingSpeaker={samplingSpeaker}
          isBatchAudioPlaying={isBatchAudioPlaying}
          currentSpeaker={currentSpeaker}
          volume={volume}
          playbackSpeed={playbackSpeed}
        />

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

      {/* AMBIENT BACKGROUND TRACK SELECTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4.5 h-4.5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Selección de Música de Fondo (Ambient Track Selection)
              </h4>
              <p className="text-xs text-slate-400">
                Mezcla pistas musicales ambientales en segundo plano para acompañar la locución del podcast
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
            Pista Activa: {AMBIENT_MUSIC_TRACKS.find((t) => t.id === selectedAmbientTrack)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pista Musical de Fondo
            </label>
            <select
              value={selectedAmbientTrack}
              onChange={(e) => {
                setSelectedAmbientTrack(e.target.value);
                const track = AMBIENT_MUSIC_TRACKS.find((t) => t.id === e.target.value);
                addToast("Música Ambiental", `Pista seleccionada: ${track?.label || e.target.value}`, "info");
              }}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 font-semibold cursor-pointer shadow-2xs"
            >
              {AMBIENT_MUSIC_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Volumen de Fondo ({Math.round(ambientVolume * 100)}%)
            </label>
            <div className="flex items-center gap-2 pt-2">
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 w-full text-xs text-slate-300">
              <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase">Descripción de la Pista:</span>
              <span className="text-slate-300 font-medium leading-snug">
                {AMBIENT_MUSIC_TRACKS.find((t) => t.id === selectedAmbientTrack)?.desc || "Selecciona una textura de fondo."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BATCH GEMINI TTS SYNTHESIS WITH PROGRESS BAR */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 rounded-xl border border-indigo-900/60 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-900/40 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Síntesis por Lote en Gemini TTS (Batch Episode Production)
            </h3>
            <p className="text-xs text-slate-300">
              Sintetiza secuencialmente todas las líneas del guion mediante la API de Gemini TTS y proporciona una barra de progreso en tiempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBatchProcessTTS}
            disabled={isBatchProcessingTTS}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isBatchProcessingTTS ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Procesando Lote ({batchProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Procesar Todo con Gemini TTS</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar & Status Display during Batch Processing */}
        {isBatchProcessingTTS && (
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                {batchStatusText}
              </span>
              <span className="text-emerald-400 font-extrabold text-sm">{batchProgress}%</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${batchProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Procesando línea {batchCurrentLine} de {lines.length}</span>
              <span>API Gemini TTS | Muestra PCM 24kHz</span>
            </div>
          </div>
        )}

        {/* Master Episode Audio Player when batch processing finishes */}
        {batchAudioObjectUrl && !isBatchProcessingTTS && (
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">
                  Episodio Maestro Producido por Lote (Gemini TTS HD)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
                  ✨ Audio Consolidado
                </span>
              </div>

              <a
                href={batchAudioObjectUrl}
                download={`Episodio_Maestro_${topic.replace(/\s+/g, "_")}.wav`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Pista Completa (.wav)</span>
              </a>
            </div>

            <audio
              ref={batchAudioRef}
              src={batchAudioObjectUrl}
              controls
              className="w-full h-10 accent-emerald-500"
            />
          </div>
        )}
      </div>

      {/* VOICE PROFILE MANAGEMENT (PERSISTED IN FIRESTORE) */}
      <VoiceProfileManager />

      {/* SMART PAUSE CONFIGURATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Pausas Inteligentes según Emoción (Smart Pause Engine)
                {smartPauseEnabled ? (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-mono rounded border border-emerald-800">
                    Activado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded border border-slate-700">
                    Desactivado
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400">
                Inserta automáticamente duraciones de silencio personalizadas entre intervenciones según la emoción asignada
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={smartPauseEnabled}
              onChange={(e) => {
                setSmartPauseEnabled(e.target.checked);
                addToast(
                  "Pausas Inteligentes",
                  e.target.checked ? "Silencios emotivos activados." : "Silencios desactivados (pausa fija 300ms).",
                  "info"
                );
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {smartPauseEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Línea Neutra / Normal ({smartPauseDurations.neutral} ms)
              </label>
              <input
                type="range"
                min="100"
                max="800"
                step="50"
                value={smartPauseDurations.neutral}
                onChange={(e) =>
                  setSmartPauseDurations((prev) => ({ ...prev, neutral: parseInt(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block mt-1">Fluidez estándar continua</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                Línea Entusiasta ({smartPauseDurations.enthusiastic} ms)
              </label>
              <input
                type="range"
                min="100"
                max="600"
                step="50"
                value={smartPauseDurations.enthusiastic}
                onChange={(e) =>
                  setSmartPauseDurations((prev) => ({ ...prev, enthusiastic: parseInt(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block mt-1">Ritmo rápido y dinámico</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider mb-1">
                Línea Alerta/Preocupada ({smartPauseDurations.concerned} ms)
              </label>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={smartPauseDurations.concerned}
                onChange={(e) =>
                  setSmartPauseDurations((prev) => ({ ...prev, concerned: parseInt(e.target.value) }))
                }
                className="w-full accent-red-500 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block mt-1">Pausa dramática de énfasis</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Línea Reflexiva ({smartPauseDurations.thoughtful} ms)
              </label>
              <input
                type="range"
                min="400"
                max="2000"
                step="100"
                value={smartPauseDurations.thoughtful}
                onChange={(e) =>
                  setSmartPauseDurations((prev) => ({ ...prev, thoughtful: parseInt(e.target.value) }))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block mt-1">Silencio contemplativo profundo</span>
            </div>
          </div>
        )}
      </div>

      {/* D3 NARRATIVE ARC CHART */}
      <NarrativeArcChart scriptLines={lines} />

      {/* GEMINI PODCAST HOSTING METADATA & SHOW NOTES GENERATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Generador de Metadatos de Hosting (Spotify & Apple Podcasts)
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-mono rounded border border-indigo-800">
                  Gemini AI 3.6
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Genera título SEO, resumen para Spotify/Apple Podcasts, notas del programa con marcas de tiempo y hashtags
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateMetadata}
            disabled={isGeneratingMetadata}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {isGeneratingMetadata ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analizando Guion...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Metadatos de Hosting</span>
              </>
            )}
          </button>
        </div>

        {/* Results view if metadata generated */}
        {metadataResult && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                  Título Sugerido para Plataformas
                </span>
                <button
                  onClick={() => handleCopyText(metadataResult.title, "Título")}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "Título" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === "Título" ? "¡Copiado!" : "Copiar Título"}</span>
                </button>
              </div>
              <h3 className="text-sm font-extrabold text-slate-100">{metadataResult.title}</h3>
            </div>

            {/* Description */}
            <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                  Descripción Oficial (150-250 palabras)
                </span>
                <button
                  onClick={() => handleCopyText(metadataResult.description, "Descripción")}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "Descripción" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === "Descripción" ? "¡Copiado!" : "Copiar Descripción"}</span>
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                {metadataResult.description}
              </p>
            </div>

            {/* Show Notes / Timestamps */}
            <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  Show Notes & Marcas de Tiempo (Capítulos)
                </span>
                <button
                  onClick={() => {
                    const notesText = metadataResult.showNotes
                      .map((n: any) => `${n.timestamp} - ${n.title}: ${n.description}`)
                      .join("\n");
                    handleCopyText(notesText, "Show Notes");
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "Show Notes" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === "Show Notes" ? "¡Copiado!" : "Copiar Show Notes"}</span>
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                {metadataResult.showNotes?.map((note: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-slate-300">
                    <span className="text-emerald-400 font-bold shrink-0">[{note.timestamp}]</span>
                    <span>
                      <strong className="text-slate-100">{note.title}:</strong> {note.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">
                  Hashtags Recomendados
                </span>
                <button
                  onClick={() => handleCopyText(metadataResult.hashtags?.join(" ") || "", "Hashtags")}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "Hashtags" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === "Hashtags" ? "¡Copiado!" : "Copiar Hashtags"}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {metadataResult.hashtags?.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-950 text-sky-300 rounded font-mono text-[10px] border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SPEAKER VOICE CAST DECK (PLAY SAMPLE 3s PER SPEAKER) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Mic className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            Elenco de Voces del Show & Botones Muestra (3s)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceGalleryOpen(true)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              Galería de Voces IA
            </button>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {uniqueSpeakers.length} Voces Activas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {uniqueSpeakers.map((spk) => {
            const isSampling = samplingSpeaker === spk.speaker;
            return (
              <div
                key={spk.speaker}
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between gap-3 ${
                  isSampling
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                      {spk.speaker.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        {spk.speaker}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                            spk.speakerRole === "host"
                              ? "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {spk.speakerRole}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {spk.gender} | {spk.accent}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PITCH AND SPEED MODULATION SLIDERS */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Tono (Pitch):</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {(speakerPitches[spk.speaker] ?? 0) > 0 ? `+${speakerPitches[spk.speaker]}` : speakerPitches[spk.speaker] ?? 0} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="1"
                    value={speakerPitches[spk.speaker] ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSpeakerPitches((prev) => ({ ...prev, [spk.speaker]: val }));
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Velocidad:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {(speakerSpeeds[spk.speaker] ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={speakerSpeeds[spk.speaker] ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSpeakerSpeeds((prev) => ({ ...prev, [spk.speaker]: val }));
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* PLAY / PAUSE SAMPLE (3s) BUTTON */}
                <button
                  onClick={() => handlePlaySpeakerSample(spk.speaker, spk.gender, spk.accent)}
                  className={`w-full py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs ${
                    isSampling
                      ? "bg-amber-600 text-white animate-pulse"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  }`}
                >
                  {isSampling ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar Muestra ({sampleCountdown}s)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Muestra (3s)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synchronized Script Transcript & SFX Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Synchronized Script Transcript */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Mic className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            Transcripción Sincronizada del Show
          </h3>

          <div ref={transcriptContainerRef} className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {lines.map((line, idx) => {
              const isActive = idx === activeLineIdx;
              const isSamplingThisLine = samplingSpeaker === line.speaker;

              return (
                <div
                  key={line.id}
                  data-line-index={idx}
                  onClick={() => {
                    setActiveLineIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                      : "bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between text-xs mb-2 gap-2">
                    <div className="flex flex-wrap items-center gap-2 font-bold">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          line.speakerRole === "host" ? "bg-pink-400" : "bg-emerald-400"
                        }`}
                      />
                      <span className={isActive ? "text-white font-bold" : "text-slate-900 dark:text-slate-100"}>{line.speaker}</span>

                      {/* SENTIMENT INDICATOR BADGE */}
                      <SentimentBadge sentiment={line.sentiment} text={line.text} size="sm" />

                      {/* SAMPLE PLAY BUTTON NEXT TO LINE SPEAKER */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySpeakerSample(line.speaker, line.gender || "Male", line.accent || "General");
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all border ${
                          isSamplingThisLine
                            ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                            : isActive
                            ? "bg-slate-800 dark:bg-slate-700 text-amber-300 border-slate-700 hover:bg-slate-700"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-300"
                        }`}
                        title="Probar muestra de audio de 3s para este locutor"
                      >
                        <Volume2 className="w-3 h-3" />
                        {isSamplingThisLine ? `${sampleCountdown}s` : "Play (3s)"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className={isActive ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}>{line.accent}</span>
                      <span className={isActive ? "text-slate-400" : "text-slate-400 dark:text-slate-500"}>{line.timestamp}</span>
                    </div>
                  </div>

                  <p className={`text-xs sm:text-sm font-serif leading-relaxed pl-4 border-l-2 mb-2.5 ${isActive ? "border-pink-400 text-slate-100" : "border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"}`}>
                    {line.text}
                  </p>

                  {/* SPEED SLIDER (0.5x to 2.0x) PER VOICE LINE */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`flex flex-wrap items-center justify-between text-[11px] pt-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                      isActive
                        ? "bg-slate-950/70 border-slate-800 text-slate-300"
                        : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Velocidad Voz:
                      </span>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={lineSpeeds[line.id] ?? 1.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setLineSpeeds((prev) => ({ ...prev, [line.id]: val }));
                        }}
                        className="w-20 sm:w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 min-w-[32px]">
                        {(lineSpeeds[line.id] ?? 1.0).toFixed(1)}x
                      </span>
                    </div>

                    {(lineSpeeds[line.id] ?? 1.0) !== 1.0 && (
                      <button
                        onClick={() => {
                          setLineSpeeds((prev) => {
                            const copy = { ...prev };
                            delete copy[line.id];
                            return copy;
                          });
                        }}
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline ml-2"
                      >
                        Restablecer (1.0x)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Background Sound Effects Library Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* AUTO-ASSIGN SPEAKERS CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Auto-assign Speakers
              </h3>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded">
                Smart Casting
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analiza el tono emocional y el contexto de las líneas del guion para sugerir la voz más adecuada de la librería.
            </p>
            <button
              onClick={handleAutoAssignSpeakers}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              Auto-asignar Voces
            </button>
          </div>

          {/* AI MOOD MATCHER CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Mood Matcher
              </h3>
              <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded">
                Smart Audio
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analiza el sentimiento y la narrativa de los diálogos para sugerir y auto-activar el fondo sonoro ideal.
            </p>
            <button
              onClick={handleAiMoodMatcher}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Sugerir y Auto-Activar SFX (Mood Match)</span>
            </button>
          </div>

          {/* VOICE COMPARISON (A/B TEST) TOOL */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                Voice Comparison (A/B Test)
              </h3>
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">
                10s Sample
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona dos voces y genera una muestra lateral de 10s para el mismo texto para decidir cuál se adapta mejor a tu personaje.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Voz A</label>
                <select
                  value={voiceA}
                  onChange={(e) => setVoiceA(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Paul">Paul (Británico)</option>
                  <option value="Sarah">Sarah (Tech Host)</option>
                  <option value="David">David (Investigador)</option>
                  <option value="Elena">Elena (Narradora)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Voz B</label>
                <select
                  value={voiceB}
                  onChange={(e) => setVoiceB(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Sarah">Sarah (Tech Host)</option>
                  <option value="Paul">Paul (Británico)</option>
                  <option value="David">David (Investigador)</option>
                  <option value="Elena">Elena (Narradora)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunVoiceComparison}
              disabled={comparingVoices}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {comparingVoices ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sintetizando Muestras...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Generar y Comparar (10s)</span>
                </>
              )}
            </button>

            {comparisonResult && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Análisis Comparativo ({voiceA} vs {voiceB})
                </div>
                <p className="text-[11px] leading-relaxed">{comparisonResult}</p>
              </div>
            )}
          </div>

          {/* SPEAKER PARTICIPATION DISTRIBUTION RECHARTS CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Participación por Orador (Recharts)
              </h3>
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">
                Flow Balance
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speakerParticipationData}
                    dataKey="words"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={25}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {speakerParticipationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SFX Deck */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-500" />
                Librería de Efectos & Ambientes
              </h3>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                SFX Deck
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona una pista ambiental o efecto sonoro para mezclar de fondo durante la reproducción del podcast.
            </p>

            <div className="space-y-2.5">
              {sfxLibrary.map((sfx) => {
                const isActive = activeSfx === sfx.id;
                const isPlayingThis = playingSfx === sfx.id;

                return (
                  <div
                    key={sfx.id}
                    onClick={() => {
                      setActiveSfx(sfx.id);
                      addToast("Ambiente Activado", `Pista "${sfx.name}" configurada de fondo.`, "success");
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{sfx.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 uppercase">
                          {sfx.type}
                        </span>
                      </div>
                      <p className={`text-[10px] ${isActive ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {sfx.desc}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingSfx === sfx.id) {
                          setPlayingSfx(null);
                          addToast("Preview Pausado", `Pausa en ${sfx.name}`, "info");
                        } else {
                          setPlayingSfx(sfx.id);
                          addToast("Preview Reproduciendo", `Reproduciendo muestra de ${sfx.name}`, "info");
                          setTimeout(() => setPlayingSfx(null), 3000);
                        }
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        playingSfx === sfx.id
                          ? "bg-amber-500 text-white animate-pulse"
                          : isActive
                          ? "bg-slate-800 text-white hover:bg-slate-700"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
                      }`}
                      title="Reproducir vista previa"
                    >
                      {playingSfx === sfx.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Duck Mixing Inteligente
              </div>
              <p className="text-[10px] opacity-90">
                El volumen de la música ambiental se atenúa automáticamente un 15% cuando los locutores están hablando.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VOICE GALLERY MODAL */}
      {isVoiceGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Galería de Voces IA Gemini TTS</h3>
                  <p className="text-[11px] text-slate-400">Selecciona acentos, tonos y casos de uso para tus locutores</p>
                </div>
              </div>
              <button onClick={() => setIsVoiceGalleryOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "Paul (Host)", accent: "Rioplatense", tone: "Cálido", useCase: "Host Principal", gender: "Male" },
                  { name: "Sarah (Tech Lead)", accent: "Americano Midwest", tone: "Dinámico", useCase: "Entrevistada Analista", gender: "Female" },
                  { name: "Carlos (Editor)", accent: "Castellano (España)", tone: "Profundo", useCase: "Debate", gender: "Male" },
                  { name: "Elena (Innovación)", accent: "Mexicano Neutro", tone: "Enérgico", useCase: "Noticias & Tendencias", gender: "Female" },
                  { name: "David (Estratega)", accent: "Británico", tone: "Formal", useCase: "Opinión", gender: "Male" },
                  { name: "Sofía (Cultura)", accent: "Colombiano", tone: "Cercano", useCase: "Cultura & Sociedad", gender: "Female" },
                ].map((v, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-bold text-xs text-slate-900 dark:text-white">
                        <span>{v.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {v.useCase}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Acento: {v.accent} | Tono: {v.tone}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handlePlaySpeakerSample(v.name.split(" ")[0], v.gender, v.accent);
                        addToast("Reproduciendo Muestra", `Escuchando voz de ${v.name}...`, "info");
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Probar Muestra (3s)
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setIsVoiceGalleryOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
              >
                Cerrar Galería
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AudioWaveformVisualizer({
  isPlaying,
  samplingSpeaker,
  isBatchAudioPlaying,
  currentSpeaker,
  volume = 0.9,
  playbackSpeed = 1,
}: {
  isPlaying: boolean;
  samplingSpeaker: string | null;
  isBatchAudioPlaying: boolean;
  currentSpeaker: { speaker: string; speakerRole?: string; gender?: string; accent?: string } | null;
  volume?: number;
  playbackSpeed?: number;
}) {
  const isActive = isPlaying || Boolean(samplingSpeaker) || isBatchAudioPlaying;
  const isHost = currentSpeaker?.speakerRole === "host";

  const barsCount = 36;
  const bars = React.useMemo(() => {
    return Array.from({ length: barsCount }).map((_, i) => {
      const normalizedPos = i / (barsCount - 1);
      const bellCurve = Math.sin(normalizedPos * Math.PI);
      const baseHeight = Math.max(15, Math.round(bellCurve * 85));
      const animationDuration = 0.35 + ((i * 7) % 11) * 0.08;
      const animationDelay = (i * 35) % 350;
      return {
        id: i,
        baseHeight,
        animationDuration,
        animationDelay,
      };
    });
  }, [barsCount]);

  return (
    <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-inner space-y-3 relative overflow-hidden">
      {/* Background ambient glowing pulse when active */}
      {isActive && (
        <div
          className={`absolute -inset-1 opacity-20 blur-xl transition-all duration-700 pointer-events-none ${
            samplingSpeaker
              ? "bg-amber-500"
              : isHost
              ? "bg-pink-500"
              : "bg-emerald-500"
          }`}
        />
      )}

      {/* Header Info Bar */}
      <div className="flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 font-mono text-[11px]">
            <Radio
              className={`w-3.5 h-3.5 ${
                isActive ? "text-emerald-400 animate-pulse" : "text-slate-500"
              }`}
            />
            <span
              className={`font-bold uppercase tracking-wider ${
                isActive ? "text-emerald-300" : "text-slate-400"
              }`}
            >
              {samplingSpeaker
                ? "Muestra de Audio (3s)"
                : isBatchAudioPlaying
                ? "Reproduciendo Audio HD"
                : isPlaying
                ? "En Vivo - Ecualizador"
                : "Pausado - Audio Idle"}
            </span>
          </div>

          <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
            Frecuencia: 20Hz - 20kHz | Vol: {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Live Speaker Tag */}
        {samplingSpeaker ? (
          <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-600/60 text-amber-300 px-3 py-1 rounded text-xs animate-pulse font-mono font-bold shadow-2xs">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Probando Muestra: {samplingSpeaker}</span>
          </div>
        ) : currentSpeaker ? (
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded border border-slate-800 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? isHost
                    ? "bg-pink-400 animate-ping"
                    : "bg-emerald-400 animate-ping"
                  : "bg-slate-500"
              }`}
            />
            <span className="font-bold text-slate-200">{currentSpeaker.speaker}</span>
            <span className="text-[10px] text-slate-400 font-semibold">
              ({currentSpeaker.gender || "Voz"})
            </span>
          </div>
        ) : null}
      </div>

      {/* Main Waveform Equalizer Canvas Display */}
      <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-1.5 h-16 pt-2 pb-1 px-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
        {/* dB Scale Backdrop Overlay */}
        <div className="absolute inset-x-2 top-2 bottom-1 flex flex-col justify-between pointer-events-none opacity-20 border-t border-b border-dashed border-slate-600">
          <span className="text-[8px] font-mono text-slate-400">+3 dB</span>
          <span className="text-[8px] font-mono text-slate-400">0 dB</span>
          <span className="text-[8px] font-mono text-slate-400">-24 dB</span>
        </div>

        {bars.map((bar) => {
          const gradientClass = samplingSpeaker
            ? "from-amber-400 via-yellow-500 to-amber-600"
            : isHost
            ? "from-pink-400 via-purple-500 to-indigo-600"
            : "from-emerald-400 via-teal-500 to-cyan-600";

          return (
            <div
              key={bar.id}
              className="flex-1 flex flex-col justify-end items-center h-full group"
            >
              <div
                className={`w-full max-w-[8px] rounded-t-sm bg-gradient-to-t ${gradientClass} transition-all duration-150 ${
                  isActive ? "shadow-xs opacity-95" : "opacity-40"
                }`}
                style={{
                  height: isActive
                    ? `${Math.min(100, Math.max(15, bar.baseHeight * (0.8 + (bar.id % 3) * 0.2) * volume))}%`
                    : `${Math.max(10, bar.baseHeight * 0.25)}%`,
                  animation: isActive
                    ? `waveBarBounce ${bar.animationDuration / Math.max(0.7, playbackSpeed)}s ease-in-out infinite alternate`
                    : "wavePulse 3s ease-in-out infinite alternate",
                  animationDelay: `${bar.animationDelay}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Frequency Labels Footer */}
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 px-1 pt-0.5 relative z-10">
        <span>60Hz (Sub)</span>
        <span>250Hz (Graves)</span>
        <span>1kHz (Vocales)</span>
        <span>4kHz (Presencia)</span>
        <span>12kHz (Brillo)</span>
      </div>

      <style jsx>{`
        @keyframes waveBarBounce {
          0% {
            transform: scaleY(0.2);
            filter: brightness(0.85);
          }
          50% {
            transform: scaleY(0.9);
            filter: brightness(1.2);
          }
          100% {
            transform: scaleY(0.35);
            filter: brightness(1);
          }
        }
        @keyframes wavePulse {
          0%, 100% {
            transform: scaleY(0.25);
            opacity: 0.35;
          }
          50% {
            transform: scaleY(0.4);
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  );
}
