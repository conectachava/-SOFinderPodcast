import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";
import reputationMap from "@/config/reputation-map.json";

describe("SourceFinder Agent — Nuanced Scoring & Multilingual Support", () => {
  it("should have enriched reputation tiers and bias indicators in config", () => {
    expect(reputationMap).toHaveProperty("academic_government");
    expect(reputationMap).toHaveProperty("top_tier_news");
    expect(reputationMap).toHaveProperty("tech_press");
    expect(reputationMap).toHaveProperty("bias_indicators");
    expect(reputationMap).toHaveProperty("weights");

    const academic = (reputationMap as any).academic_government;
    expect(academic.score).toBeGreaterThanOrEqual(0.95);
    expect(academic.domains).toContain("nature.com");
    expect(academic.domains).toContain("arxiv.org");

    const bias = (reputationMap as any).bias_indicators;
    expect(bias.clickbait_keywords).toContain("shocking");
    expect(bias.clickbait_keywords).toContain("increíble");
    expect(bias.promotional_keywords).toContain("sponsored");
  });

  it("should run Python SourceFinder agent with English language flag (--lang en)", () => {
    const scriptPath = path.resolve(process.cwd(), "source_finder.py");
    const cmd = `python3 "${scriptPath}" --topic "Quantum Computing 2026" --type "Noticia Tecnológica" --lang en`;
    const output = execSync(cmd, { encoding: "utf-8" });

    // Should indicate English mode
    expect(output).toContain("Language: English (en)");
    expect(output).toContain("# Intelligence Report: Quantum Computing 2026");
    expect(output).toContain("## Executive Summary");
    expect(output).toContain("## Key Findings");
    expect(output).toContain("## Qualified Sources");
    expect(output).toContain("Dynamic Min Reputation");
  });

  it("should run Python SourceFinder agent with Spanish language flag (--lang es)", () => {
    const scriptPath = path.resolve(process.cwd(), "source_finder.py");
    const cmd = `python3 "${scriptPath}" --topic "Robótica y Agentes IA" --type "Noticia Tecnológica" --lang es`;
    const output = execSync(cmd, { encoding: "utf-8" });

    // Should indicate Spanish mode
    expect(output).toContain("Language: Español (es)");
    expect(output).toContain("# Informe de Inteligencia: Robótica y Agentes IA");
    expect(output).toContain("## Resumen Ejecutivo");
    expect(output).toContain("## Puntos Clave");
    expect(output).toContain("## Fuentes Calificadas");
    expect(output).toContain("Dynamic Min Reputation");
  });

  it("should dynamically elevate threshold and penalize clickbait/biased sources in Python agent", () => {
    const scriptPath = path.resolve(process.cwd(), "source_finder.py");
    const cmd = `python3 "${scriptPath}" --topic "Test AI Security" --type "Noticia Tecnológica" --lang en`;
    const output = execSync(cmd, { encoding: "utf-8" });

    // The sensationalist rumor blog should be rejected due to bias penalty
    expect(output).toContain("## Rejected Sources");
    expect(output).toContain("sensational-rumors-blog.net");
    expect(output).toContain("Bias Penalty");

    // Dynamic threshold audit section should be rendered
    expect(output).toContain("## Reputation Audit & Dynamic Threshold");
    expect(output).toContain("Composite Formula = (Domain Authority × 0.55) + (Recency × 0.25) + 0.20 - Bias Penalty");
  });

  it("should output structured JSON when --json flag is provided", () => {
    const scriptPath = path.resolve(process.cwd(), "source_finder.py");
    const cmd = `python3 "${scriptPath}" --topic "Semiconductors 2026" --type "General" --lang en --json`;
    const output = execSync(cmd, { encoding: "utf-8" });

    const json = JSON.parse(output);
    expect(json).toHaveProperty("topic", "Semiconductors 2026");
    expect(json).toHaveProperty("language", "en");
    expect(json).toHaveProperty("dynamic_min_reputation");
    expect(json).toHaveProperty("qualified_sources");
    expect(json).toHaveProperty("rejected_sources");
    expect(Array.isArray(json.qualified_sources)).toBe(true);

    const firstQual = json.qualified_sources[0];
    expect(firstQual).toHaveProperty("domain_authority");
    expect(firstQual).toHaveProperty("recency_score");
    expect(firstQual).toHaveProperty("bias_penalty");
    expect(firstQual).toHaveProperty("source_reputation");
    expect(firstQual.source_reputation).toBeGreaterThanOrEqual(json.dynamic_min_reputation);
  });
});
