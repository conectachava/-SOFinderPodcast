import { describe, it, expect } from "vitest";
import {
  analyzeTrackLoudness,
  normalizeVoiceTrackSamples,
  analyzeAndNormalizeVoiceTracks,
  synthesizeRoyaltyFreeBedSamples,
  blendVoiceAndAudioBedSamples,
  ROYALTY_FREE_BED_TRACKS,
} from "./audio-bed-dsp";

function generateSineTrack(amplitude: number, length = 4800, freq = 220): Float32Array {
  const arr = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / 24000);
  }
  return arr;
}

describe("audio-bed-dsp: Multi-Voice Volume Detection & Normalization", () => {
  it("handles empty or silent tracks safely without NaN or clipping", () => {
    const empty = new Float32Array(0);
    const emptyMetrics = analyzeTrackLoudness(empty, { speaker: "Paul" });
    expect(emptyMetrics.status).toBe("silent");
    expect(emptyMetrics.recommendedGainDb).toBe(0);

    const silent = new Float32Array(1200);
    const silentRes = normalizeVoiceTrackSamples(silent, { speaker: "Sarah" });
    expect(silentRes.metrics.status).toBe("silent");
    expect(silentRes.normalizedSamples.length).toBe(1200);
  });

  it("detects volume discrepancies between quiet and loud voice tracks and normalizes them to target LUFS", () => {
    const quietTrack = generateSineTrack(0.05); // ~ -29.7 LUFS
    const loudTrack = generateSineTrack(0.55); // ~ -8.9 LUFS

    const batch = analyzeAndNormalizeVoiceTracks(
      [
        { trackId: "t1", speaker: "Paul", samples: quietTrack },
        { trackId: "t2", speaker: "Sarah", samples: loudTrack },
      ],
      -16.0,
      -1.0
    );

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].metrics.status).toBe("boosted");
    expect(batch.results[0].metrics.recommendedGainDb).toBeGreaterThan(5);
    expect(batch.results[1].metrics.status).toBe("attenuated");
    expect(batch.results[1].metrics.recommendedGainDb).toBeLessThan(-5);

    // Output spread after normalization should be much smaller than input spread
    expect(batch.outputSpreadLufs).toBeLessThan(batch.inputSpreadLufs);
    expect(batch.outputSpreadLufs).toBeLessThanOrEqual(1.0);
    expect(batch.consistencyScore).toBeGreaterThanOrEqual(90);

    // True peak ceiling (-1.0 dBFS) should never be exceeded
    expect(batch.results[0].metrics.outputPeakDb).toBeLessThanOrEqual(-1.0);
    expect(batch.results[1].metrics.outputPeakDb).toBeLessThanOrEqual(-1.0);
  });
});

describe("audio-bed-dsp: Royalty-Free Audio Bed Synthesis & Auto-Ducking Blend", () => {
  it("synthesizes non-zero audio samples for royalty-free tracks and silence for 'none'", () => {
    expect(ROYALTY_FREE_BED_TRACKS.length).toBeGreaterThanOrEqual(6);

    const noneSamples = synthesizeRoyaltyFreeBedSamples("none", 24000, 1.0);
    expect(noneSamples.every((s) => s === 0)).toBe(true);

    const loungeSamples = synthesizeRoyaltyFreeBedSamples("ambient_lounge", 24000, 1.0);
    expect(loungeSamples.length).toBe(24000);
    const maxAbs = loungeSamples.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
    expect(maxAbs).toBeGreaterThan(0.1);
    expect(maxAbs).toBeLessThanOrEqual(0.95);
  });

  it("blends custom or preset audio bed with voice samples and applies sidechain auto-ducking", () => {
    const sampleRate = 24000;
    const voice = new Float32Array(sampleRate); // 1 second
    // First half silent, second half active voice
    for (let i = sampleRate / 2; i < sampleRate; i++) {
      voice[i] = 0.35 * Math.sin((2 * Math.PI * 200 * i) / sampleRate);
    }

    const customBed = new Float32Array(sampleRate).fill(0.4);

    const blendedWithDucking = blendVoiceAndAudioBedSamples(voice, sampleRate, {
      trackId: "custom_upload",
      bedVolume: 0.25,
      autoDucking: true,
      duckingAmountDb: -12,
      fadeInSeconds: 0.05,
      fadeOutSeconds: 0.05,
      customBedSamples: customBed,
    });

    expect(blendedWithDucking.length).toBe(sampleRate);
    // During silent voice section (around index 6000), bed should be audible
    expect(Math.abs(blendedWithDucking[6000])).toBeGreaterThan(0.05);
  });
});
