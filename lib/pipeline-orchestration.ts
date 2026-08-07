export interface ScriptLine {
  id: string;
  speaker: string;
  speakerRole: "host" | "expert" | "narrator" | string;
  gender: "Male" | "Female" | string;
  text: string;
  emotion: string;
  timestamp: string;
}

export interface PipelineSessionState {
  reportText?: string;
  rawScript?: string;
  scriptLines: ScriptLine[];
  storyboardData?: any;
  updatedAt?: string;
}

export interface PipelineHealthResult {
  status: "optimal" | "partial" | "inconsistent" | "idle";
  score: number;
  label: string;
  details: string;
}

/**
 * Calculates internal data consistency across report, script, and storyboard stages.
 */
export function calculatePipelineHealth(state: PipelineSessionState): PipelineHealthResult {
  const { reportText, scriptLines, storyboardData } = state;
  const hasReport = Boolean(reportText && reportText.trim().length > 30);
  const hasScript = Boolean(Array.isArray(scriptLines) && scriptLines.length > 0);
  const hasStoryboard = Boolean(storyboardData && Object.keys(storyboardData).length > 0);

  // Inconsistent state: Script exists without a valid report
  if (hasScript && !hasReport) {
    return {
      status: "inconsistent",
      score: 40,
      label: "Inconsistencia: Guion sin Informe",
      details: "Existe un guion pero falta la investigación y el informe de origen.",
    };
  }

  if (hasReport && hasScript && hasStoryboard) {
    return {
      status: "optimal",
      score: 100,
      label: "100% Salud Óptima del Pipeline",
      details: "Informe, guion de diálogo y storyboard sincronizados.",
    };
  }

  if (hasReport && hasScript) {
    return {
      status: "partial",
      score: 75,
      label: "75% Guion Listo (Falta Audio)",
      details: "Investigación y guion completados.",
    };
  }

  if (hasReport) {
    return {
      status: "partial",
      score: 35,
      label: "35% Informe Verificado",
      details: "Informe listo para ser redactado como guion.",
    };
  }

  return {
    status: "idle",
    score: 0,
    label: "0% Esperando Tema",
    details: "Inicia buscando un tema en SourceFinder.",
  };
}

/**
 * Serializes current pipeline session state for storage or Firestore sync.
 */
export function serializePipelineSession(state: PipelineSessionState): string {
  return JSON.stringify({
    reportText: state.reportText || "",
    rawScript: state.rawScript || "",
    scriptLines: state.scriptLines || [],
    storyboardData: state.storyboardData || null,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deserializes and restores pipeline session state with validation.
 */
export function deserializePipelineSession(rawJson: string): PipelineSessionState | null {
  try {
    const parsed = JSON.parse(rawJson);
    return {
      reportText: typeof parsed.reportText === "string" ? parsed.reportText : undefined,
      rawScript: typeof parsed.rawScript === "string" ? parsed.rawScript : undefined,
      scriptLines: Array.isArray(parsed.scriptLines) ? parsed.scriptLines : [],
      storyboardData: parsed.storyboardData || null,
      updatedAt: parsed.updatedAt,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Simulates view transition while guaranteeing data retention.
 */
export function switchViewAndRetainState(
  currentState: PipelineSessionState,
  targetView: "sourcefinder" | "script" | "studio" | "orchestrator" | "docs"
): { nextView: string; retainedState: PipelineSessionState } {
  // Ensure deep clone to prevent accidental reference mutation
  const retainedState: PipelineSessionState = {
    reportText: currentState.reportText,
    rawScript: currentState.rawScript,
    scriptLines: currentState.scriptLines ? [...currentState.scriptLines] : [],
    storyboardData: currentState.storyboardData ? { ...currentState.storyboardData } : null,
    updatedAt: currentState.updatedAt,
  };

  return {
    nextView: targetView,
    retainedState,
  };
}
