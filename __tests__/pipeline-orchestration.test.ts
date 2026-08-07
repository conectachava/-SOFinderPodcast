import { describe, it, expect } from "vitest";
import {
  calculatePipelineHealth,
  serializePipelineSession,
  deserializePipelineSession,
  switchViewAndRetainState,
  PipelineSessionState,
  ScriptLine,
} from "../lib/pipeline-orchestration";

describe("Pipeline State Orchestration & Health Check Logic", () => {
  const sampleLines: ScriptLine[] = [
    {
      id: "line-1",
      speaker: "Paul",
      speakerRole: "host",
      gender: "Male",
      text: "Bienvenidos a SourceFinder AI Podcast.",
      emotion: "neutral",
      timestamp: "00:00",
    },
    {
      id: "line-2",
      speaker: "Laura",
      speakerRole: "expert",
      gender: "Female",
      text: "Un placer estar aquí para analizar la noticia de hoy.",
      emotion: "happy",
      timestamp: "00:05",
    },
  ];

  it("should return idle status when no report or script is present", () => {
    const emptyState: PipelineSessionState = {
      scriptLines: [],
    };
    const health = calculatePipelineHealth(emptyState);

    expect(health.status).toBe("idle");
    expect(health.score).toBe(0);
    expect(health.label).toContain("Esperando Tema");
  });

  it("should return partial status (35%) when only a verified report is present", () => {
    const reportState: PipelineSessionState = {
      reportText: "Informe de Inteligencia: Avances de Inteligencia Artificial en el año 2026.",
      scriptLines: [],
    };
    const health = calculatePipelineHealth(reportState);

    expect(health.status).toBe("partial");
    expect(health.score).toBe(35);
    expect(health.label).toContain("Informe Verificado");
  });

  it("should return partial status (75%) when report and script are both present", () => {
    const scriptState: PipelineSessionState = {
      reportText: "Informe de Inteligencia: Avances de Inteligencia Artificial en el año 2026.",
      rawScript: "Paul: Hola a todos...",
      scriptLines: sampleLines,
    };
    const health = calculatePipelineHealth(scriptState);

    expect(health.status).toBe("partial");
    expect(health.score).toBe(75);
    expect(health.label).toContain("Guion Listo");
  });

  it("should return optimal status (100%) when report, script, and storyboard are present", () => {
    const fullState: PipelineSessionState = {
      reportText: "Informe de Inteligencia: Avances de Inteligencia Artificial en el año 2026.",
      rawScript: "Paul: Hola a todos...",
      scriptLines: sampleLines,
      storyboardData: { title: "AI Breakthroughs 2026", scenes: [1, 2] },
    };
    const health = calculatePipelineHealth(fullState);

    expect(health.status).toBe("optimal");
    expect(health.score).toBe(100);
    expect(health.label).toContain("100% Salud Óptima");
  });

  it("should detect inconsistency when a script exists without a preceding report", () => {
    const inconsistentState: PipelineSessionState = {
      scriptLines: sampleLines,
    };
    const health = calculatePipelineHealth(inconsistentState);

    expect(health.status).toBe("inconsistent");
    expect(health.score).toBe(40);
    expect(health.label).toContain("Inconsistencia");
  });

  it("should serialize and deserialize pipeline session state accurately for recovery", () => {
    const initialState: PipelineSessionState = {
      reportText: "Resumen ejecutivo de fuentes de investigación.",
      rawScript: "Guion bruto de prueba",
      scriptLines: sampleLines,
      storyboardData: { sceneId: "sc-1" },
    };

    const json = serializePipelineSession(initialState);
    expect(typeof json).toBe("string");

    const recovered = deserializePipelineSession(json);
    expect(recovered).not.toBeNull();
    expect(recovered?.reportText).toBe(initialState.reportText);
    expect(recovered?.rawScript).toBe(initialState.rawScript);
    expect(recovered?.scriptLines).toHaveLength(2);
    expect(recovered?.scriptLines[0].speaker).toBe("Paul");
    expect(recovered?.storyboardData?.sceneId).toBe("sc-1");
  });

  it("should handle corrupted json gracefully during deserialization", () => {
    const recovered = deserializePipelineSession("invalid-json-{broken}");
    expect(recovered).toBeNull();
  });

  it("should guarantee data retention when switching views", () => {
    const currentState: PipelineSessionState = {
      reportText: "Informe mantenido al cambiar de pestaña.",
      scriptLines: sampleLines,
    };

    const { nextView, retainedState } = switchViewAndRetainState(currentState, "studio");

    expect(nextView).toBe("studio");
    expect(retainedState.reportText).toBe("Informe mantenido al cambiar de pestaña.");
    expect(retainedState.scriptLines).toHaveLength(2);
  });
});
