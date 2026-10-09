import { describe, it, expect } from "vitest";
import {
  buildDefaultProVoiceSetting,
  buildSynthesizablePromptForLine,
  EMOTIONAL_EMPHASIS_OPTIONS,
} from "../components/ProVoiceSettingsPanel";
import type { ScriptLine } from "../app/api/script-writer/route";

describe("ProVoiceSettingsPanel helpers", () => {
  it("builds default granular voice settings from a neutral ScriptLine", () => {
    const line: ScriptLine = {
      id: "line-1",
      speaker: "Paul",
      speakerRole: "host",
      sentiment: "neutral",
      text: "Bienvenidos al episodio de hoy.",
      timestamp: "0:05",
    };

    const setting = buildDefaultProVoiceSetting(line);
    expect(setting.lineId).toBe("line-1");
    expect(setting.emotion).toBe("neutral");
    expect(setting.pitch).toBe(0);
    expect(setting.speed).toBe(1.0);
    expect(setting.emphasisIntensity).toBe(50);
    expect(setting.prosodyInflection).toBe("natural");
  });

  it("detects rising prosody inflection for interrogative lines and maps enthusiastic sentiment", () => {
    const line: ScriptLine = {
      id: "line-2",
      speaker: "Sarah",
      speakerRole: "caller",
      sentiment: "enthusiastic",
      text: "¿Estamos ante el mayor salto en computación cuántica?",
      timestamp: "0:18",
    };

    const setting = buildDefaultProVoiceSetting(line);
    expect(setting.emotion).toBe("enthusiastic");
    expect(setting.pitch).toBe(1.5);
    expect(setting.speed).toBe(1.12);
    expect(setting.emphasisIntensity).toBe(85);
    expect(setting.prosodyInflection).toBe("rising");
  });

  it("formats synthesizable TTS prompt with pitch, speed, and emotional emphasis cues", () => {
    const lineText = "Los datos muestran una aceleración sin precedentes.";
    const prompt = buildSynthesizablePromptForLine(lineText, {
      lineId: "line-3",
      pitch: -2.5,
      speed: 0.85,
      emotion: "dramatic",
      emphasisIntensity: 90,
      prosodyInflection: "punchy",
    });

    expect(prompt).toContain("[Dirección de voz:");
    expect(prompt).toContain("intensidad dramática");
    expect(prompt).toContain("énfasis emocional alto");
    expect(prompt).toContain("registro tonal profundo");
    expect(prompt).toContain("ritmo pausado");
    expect(prompt).toContain("remarcando las palabras clave");
    expect(prompt).toContain(lineText);
  });

  it("exposes all 6 emotional emphasis presets with valid bounds", () => {
    expect(EMOTIONAL_EMPHASIS_OPTIONS).toHaveLength(6);
    for (const opt of EMOTIONAL_EMPHASIS_OPTIONS) {
      expect(opt.defaultPitch).toBeGreaterThanOrEqual(-6);
      expect(opt.defaultPitch).toBeLessThanOrEqual(6);
      expect(opt.defaultSpeed).toBeGreaterThanOrEqual(0.5);
      expect(opt.defaultSpeed).toBeLessThanOrEqual(2.0);
      expect(opt.defaultIntensity).toBeGreaterThanOrEqual(0);
      expect(opt.defaultIntensity).toBeLessThanOrEqual(100);
    }
  });
});
