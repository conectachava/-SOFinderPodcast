export interface RoyaltyFreeTrack {
  id: string;
  label: string;
  genre: string;
  bpm: number;
  musicalKey: string;
  desc: string;
  license: string;
  baseFreqs: number[];
  pulseHz: number;
  warmth: number;
}

export const ROYALTY_FREE_BED_TRACKS: RoyaltyFreeTrack[] = [
  {
    id: "none",
    label: "🚫 Sin Música (Solo Voces)",
    genre: "Dry Voice",
    bpm: 0,
    musicalKey: "—",
    desc: "Pista vocal limpia en primer plano sin cama musical de fondo.",
    license: "N/A",
    baseFreqs: [],
    pulseHz: 0,
    warmth: 0,
  },
  {
    id: "ambient_lounge",
    label: "☕ Ambient Lounge",
    genre: "Ambient / Chill",
    bpm: 84,
    musicalKey: "D Minor",
    desc: "Texturas sintetizadas cálidas y acordes suspendidos para charlas profundas.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [146.83, 220.0, 261.63, 329.63],
    pulseHz: 1.4,
    warmth: 0.85,
  },
  {
    id: "acoustic_warmth",
    label: "🎸 Acoustic Warmth",
    genre: "Folk / Organic",
    bpm: 92,
    musicalKey: "G Major",
    desc: "Armónicos acústicos suaves y ambiente orgánico para entrevistas cercanas.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [196.0, 246.94, 293.66, 392.0],
    pulseHz: 1.53,
    warmth: 0.9,
  },
  {
    id: "tech_synth",
    label: "⚡ Tech Synth Beat",
    genre: "Electronic / Sci-Fi",
    bpm: 110,
    musicalKey: "A Minor",
    desc: "Pulso electrónico analógico e innovador ideal para noticias de IA y tecnología.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [110.0, 164.81, 220.0, 329.63],
    pulseHz: 1.83,
    warmth: 0.65,
  },
  {
    id: "lofi_sunset",
    label: "🌆 Lofi Sunset",
    genre: "Lo-Fi Beats",
    bpm: 78,
    musicalKey: "F Major 7",
    desc: "Acordes eléctricos suaves con textura vintage y ritmo pausado.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [174.61, 220.0, 261.63, 329.63],
    pulseHz: 1.3,
    warmth: 0.95,
  },
  {
    id: "gentle_piano",
    label: "🎹 Gentle Piano",
    genre: "Neoclassical",
    bpm: 68,
    musicalKey: "C Major",
    desc: "Notas de piano minimalista reflexivo para narrativa documental y ensayo.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [130.81, 196.0, 246.94, 293.66],
    pulseHz: 1.13,
    warmth: 0.8,
  },
  {
    id: "cinematic_space",
    label: "🌌 Cinematic Space",
    genre: "Cinematic Drone",
    bpm: 60,
    musicalKey: "E Minor",
    desc: "Atmósfera espacial envolvente de baja frecuencia para reportajes de alto impacto.",
    license: "Royalty-Free (Uso Comercial Libre)",
    baseFreqs: [82.41, 123.47, 164.81, 246.94],
    pulseHz: 0.5,
    warmth: 0.92,
  },
];

export interface VoiceTrackLoudnessMetrics {
  trackId: string;
  speaker: string;
  rms: number;
  inputLufs: number;
  inputPeakDb: number;
  targetLufs: number;
  recommendedGainDb: number;
  outputLufs: number;
  outputPeakDb: number;
  dynamicRangeDb: number;
  clippedSamples: number;
  status: "optimal" | "boosted" | "attenuated" | "silent";
}

export interface NormalizationResult {
  metrics: VoiceTrackLoudnessMetrics;
  normalizedSamples: Float32Array;
}

export interface AudioBedConfig {
  trackId: string;
  bedVolume: number;
  autoDucking: boolean;
  duckingAmountDb: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  customBedSamples?: Float32Array | null;
  customBedSampleRate?: number;
  customTrackName?: string | null;
}

const EPSILON = 1e-9;

export function linearToDb(linear: number): number {
  if (linear <= EPSILON) return -96.0;
  return 20 * Math.log10(linear);
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function analyzeTrackLoudness(
  samples: Float32Array,
  options: {
    trackId?: string;
    speaker?: string;
    targetLufs?: number;
    maxGainDb?: number;
    ceilingDb?: number;
    manualTrimDb?: number;
  } = {}
): VoiceTrackLoudnessMetrics {
  const trackId = options.trackId || "track-0";
  const speaker = options.speaker || "Locutor";
  const targetLufs = options.targetLufs ?? -16.0;
  const maxGainDb = options.maxGainDb ?? 18.0;
  const ceilingDb = options.ceilingDb ?? -1.0;
  const manualTrimDb = options.manualTrimDb ?? 0;

  if (!samples || samples.length === 0) {
    return {
      trackId,
      speaker,
      rms: 0,
      inputLufs: -96.0,
      inputPeakDb: -96.0,
      targetLufs,
      recommendedGainDb: 0,
      outputLufs: -96.0,
      outputPeakDb: -96.0,
      dynamicRangeDb: 0,
      clippedSamples: 0,
      status: "silent",
    };
  }

  let sumSquares = 0;
  let activeSumSquares = 0;
  let activeCount = 0;
  let peak = 0;
  let clippedSamples = 0;
  const gateThreshold = dbToLinear(-55);

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    if (abs >= 0.999) clippedSamples++;
    const sq = abs * abs;
    sumSquares += sq;
    if (abs >= gateThreshold) {
      activeSumSquares += sq;
      activeCount++;
    }
  }

  const meanSquare =
    activeCount > samples.length * 0.05
      ? activeSumSquares / activeCount
      : sumSquares / samples.length;
  const rms = Math.sqrt(meanSquare);

  if (rms <= 1e-5) {
    return {
      trackId,
      speaker,
      rms: 0,
      inputLufs: -96.0,
      inputPeakDb: linearToDb(peak),
      targetLufs,
      recommendedGainDb: 0,
      outputLufs: -96.0,
      outputPeakDb: linearToDb(peak),
      dynamicRangeDb: 0,
      clippedSamples,
      status: "silent",
    };
  }

  const inputLufs = Math.max(-70, -0.691 + 10 * Math.log10(Math.max(EPSILON, meanSquare)));
  const inputPeakDb = linearToDb(peak);
  const dynamicRangeDb = Math.max(0, inputPeakDb - inputLufs);

  const rawDeltaDb = targetLufs - inputLufs + manualTrimDb;
  const clampedGainDb = Math.max(-maxGainDb, Math.min(maxGainDb, rawDeltaDb));

  const projectedOutputLufs = Number((inputLufs + clampedGainDb).toFixed(1));
  const projectedPeakDb = Math.min(ceilingDb, Number((inputPeakDb + clampedGainDb).toFixed(1)));

  let status: VoiceTrackLoudnessMetrics["status"] = "optimal";
  if (Math.abs(clampedGainDb) >= 0.8) {
    status = clampedGainDb > 0 ? "boosted" : "attenuated";
  }

  return {
    trackId,
    speaker,
    rms: Number(rms.toFixed(5)),
    inputLufs: Number(inputLufs.toFixed(1)),
    inputPeakDb: Number(inputPeakDb.toFixed(1)),
    targetLufs,
    recommendedGainDb: Number(clampedGainDb.toFixed(1)),
    outputLufs: projectedOutputLufs,
    outputPeakDb: projectedPeakDb,
    dynamicRangeDb: Number(dynamicRangeDb.toFixed(1)),
    clippedSamples,
    status,
  };
}

export function normalizeVoiceTrackSamples(
  samples: Float32Array,
  options: {
    trackId?: string;
    speaker?: string;
    targetLufs?: number;
    maxGainDb?: number;
    ceilingDb?: number;
    manualTrimDb?: number;
  } = {}
): NormalizationResult {
  const ceilingDb = options.ceilingDb ?? -1.0;
  const ceilingLinear = dbToLinear(ceilingDb);
  const kneeStart = ceilingLinear * 0.82;

  const metrics = analyzeTrackLoudness(samples, options);
  if (metrics.status === "silent" || samples.length === 0) {
    return {
      metrics,
      normalizedSamples: new Float32Array(samples),
    };
  }

  const gainLinear = dbToLinear(metrics.recommendedGainDb);
  const out = new Float32Array(samples.length);

  let postSumSquares = 0;
  let postActiveCount = 0;
  let postPeak = 0;
  const gateThreshold = dbToLinear(-55);

  for (let i = 0; i < samples.length; i++) {
    let val = samples[i] * gainLinear;
    const sign = val < 0 ? -1 : 1;
    const abs = Math.abs(val);

    if (abs > kneeStart) {
      const excess = abs - kneeStart;
      const headroom = Math.max(1e-4, ceilingLinear - kneeStart);
      const compressed = kneeStart + headroom * Math.tanh(excess / headroom);
      val = sign * Math.min(ceilingLinear, compressed);
    }

    out[i] = val;
    const outAbs = Math.abs(val);
    if (outAbs > postPeak) postPeak = outAbs;
    if (outAbs >= gateThreshold) {
      postSumSquares += outAbs * outAbs;
      postActiveCount++;
    }
  }

  const postMeanSq =
    postActiveCount > 0 ? postSumSquares / postActiveCount : postSumSquares / Math.max(1, out.length);
  const actualOutputLufs =
    postMeanSq > EPSILON ? Number((-0.691 + 10 * Math.log10(postMeanSq)).toFixed(1)) : metrics.outputLufs;

  return {
    metrics: {
      ...metrics,
      outputLufs: actualOutputLufs,
      outputPeakDb: Number(linearToDb(postPeak).toFixed(1)),
    },
    normalizedSamples: out,
  };
}

export function analyzeAndNormalizeVoiceTracks(
  tracks: { trackId: string; speaker: string; samples: Float32Array; manualTrimDb?: number }[],
  targetLufs = -16.0,
  ceilingDb = -1.0
): {
  results: NormalizationResult[];
  inputSpreadLufs: number;
  outputSpreadLufs: number;
  consistencyScore: number;
} {
  const results = tracks.map((t) =>
    normalizeVoiceTrackSamples(t.samples, {
      trackId: t.trackId,
      speaker: t.speaker,
      targetLufs,
      ceilingDb,
      manualTrimDb: t.manualTrimDb ?? 0,
    })
  );

  const activeResults = results.filter((r) => r.metrics.status !== "silent");
  if (activeResults.length === 0) {
    return {
      results,
      inputSpreadLufs: 0,
      outputSpreadLufs: 0,
      consistencyScore: 100,
    };
  }

  const inputLufsValues = activeResults.map((r) => r.metrics.inputLufs);
  const outputLufsValues = activeResults.map((r) => r.metrics.outputLufs);

  const inputSpreadLufs = Number(
    (Math.max(...inputLufsValues) - Math.min(...inputLufsValues)).toFixed(1)
  );
  const outputSpreadLufs = Number(
    (Math.max(...outputLufsValues) - Math.min(...outputLufsValues)).toFixed(1)
  );

  const consistencyScore = Math.max(
    50,
    Math.min(100, Math.round(100 - Math.max(0, outputSpreadLufs - 0.3) * 8))
  );

  return {
    results,
    inputSpreadLufs,
    outputSpreadLufs,
    consistencyScore,
  };
}

export function synthesizeRoyaltyFreeBedSamples(
  trackId: string,
  sampleRate: number,
  durationSeconds: number
): Float32Array {
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const out = new Float32Array(totalSamples);

  const track = ROYALTY_FREE_BED_TRACKS.find((t) => t.id === trackId);
  if (!track || track.id === "none" || track.baseFreqs.length === 0) {
    return out;
  }

  const freqs = track.baseFreqs;
  const pulseHz = track.pulseHz || 1.2;
  const twoPi = 2 * Math.PI;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;

    const chordShift = Math.floor(t / 4) % 2 === 1 ? 1.059463 : 1.0;
    const lfo = 0.72 + 0.28 * Math.sin(twoPi * (pulseHz * 0.25) * t);
    const beatPulse =
      track.id === "tech_synth" || track.id === "lofi_sunset"
        ? 0.75 + 0.25 * Math.max(0, Math.sin(twoPi * pulseHz * t))
        : 0.88 + 0.12 * Math.sin(twoPi * (pulseHz * 0.5) * t);

    let sample = 0;
    for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
      const f = freqs[fIdx] * (fIdx === 2 ? chordShift : 1.0);
      const detune = 1 + (fIdx - 1.5) * 0.0015;
      const weight = 1 / (fIdx + 1.2);
      sample += Math.sin(twoPi * f * detune * t) * weight;
      if (fIdx === 0) {
        sample += Math.sin(twoPi * (f * 0.5) * t) * 0.45 * track.warmth;
      }
    }

    sample = (sample / 2.6) * lfo * beatPulse;
    out[i] = Math.max(-0.95, Math.min(0.95, sample));
  }

  return out;
}

export function blendVoiceAndAudioBedSamples(
  voiceSamples: Float32Array,
  sampleRate: number,
  config: AudioBedConfig
): Float32Array {
  const length = voiceSamples.length;
  if (length === 0) return new Float32Array(0);

  const hasCustomBed =
    config.trackId === "custom_upload" &&
    config.customBedSamples &&
    config.customBedSamples.length > 0;

  if (
    (!hasCustomBed && (config.trackId === "none" || !config.trackId)) ||
    config.bedVolume <= 0.001
  ) {
    return new Float32Array(voiceSamples);
  }

  let bedSamples: Float32Array;
  if (hasCustomBed && config.customBedSamples) {
    bedSamples = new Float32Array(length);
    const src = config.customBedSamples;
    const srcLen = src.length;
    for (let i = 0; i < length; i++) {
      bedSamples[i] = src[i % srcLen];
    }
  } else {
    bedSamples = synthesizeRoyaltyFreeBedSamples(
      config.trackId,
      sampleRate,
      length / sampleRate
    );
  }

  const out = new Float32Array(length);
  const baseBedGain = Math.max(0, Math.min(0.8, config.bedVolume));
  const duckRatio = config.autoDucking ? dbToLinear(config.duckingAmountDb) : 1.0;

  const fadeInSamples = Math.max(1, Math.floor((config.fadeInSeconds || 1.0) * sampleRate));
  const fadeOutSamples = Math.max(1, Math.floor((config.fadeOutSeconds || 1.5) * sampleRate));

  const attackCoeff = Math.exp(-1 / Math.max(1, sampleRate * 0.045));
  const releaseCoeff = Math.exp(-1 / Math.max(1, sampleRate * 0.32));
  const speechThreshold = 0.025;
  let speechEnv = 0;

  const ceilingLinear = dbToLinear(-0.8);

  for (let i = 0; i < length; i++) {
    const v = voiceSamples[i];
    const absV = Math.abs(v);

    if (absV > speechEnv) {
      speechEnv = attackCoeff * speechEnv + (1 - attackCoeff) * absV;
    } else {
      speechEnv = releaseCoeff * speechEnv + (1 - releaseCoeff) * absV;
    }

    let duckMultiplier = 1.0;
    if (config.autoDucking && speechEnv > speechThreshold) {
      const activity = Math.min(1, (speechEnv - speechThreshold) / 0.12);
      duckMultiplier = 1.0 - activity * (1.0 - duckRatio);
    }

    let fadeGain = 1.0;
    if (i < fadeInSamples) {
      fadeGain = i / fadeInSamples;
    } else if (i > length - fadeOutSamples) {
      fadeGain = Math.max(0, (length - i) / fadeOutSamples);
    }

    const bedSample = bedSamples[i] * baseBedGain * duckMultiplier * fadeGain;
    const mixed = v + bedSample;

    if (Math.abs(mixed) > ceilingLinear) {
      out[i] = (mixed < 0 ? -1 : 1) * ceilingLinear;
    } else {
      out[i] = mixed;
    }
  }

  return out;
}
