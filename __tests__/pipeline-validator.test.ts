import { describe, it, expect } from "vitest";
import {
  validateTopicInput,
  validateScriptLine,
  validateScriptLines,
  parseScriptWriterResponse,
  validatePipelineStageTransition,
} from "../lib/pipeline-validator";

describe("Pipeline Validator Suite", () => {
  describe("validateTopicInput", () => {
    it("debería rechazar temas vacíos o nulos", () => {
      expect(validateTopicInput("").isValid).toBe(false);
      expect(validateTopicInput("  ").isValid).toBe(false);
      // @ts-ignore
      expect(validateTopicInput(null).isValid).toBe(false);
    });

    it("debería rechazar temas demasiado cortos", () => {
      const res = validateTopicInput("ab");
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("al menos 3 caracteres");
    });

    it("debería aceptar y sanitizar temas válidos", () => {
      const res = validateTopicInput("  Avances en IA y Gemini 1.5   \n ");
      expect(res.isValid).toBe(true);
      expect(res.sanitizedTopic).toBe("Avances en IA y Gemini 1.5");
    });

    it("debería truncar temas extremadamente largos a 500 caracteres", () => {
      const longText = "a".repeat(600);
      const res = validateTopicInput(longText);
      expect(res.isValid).toBe(false);
      expect(res.sanitizedTopic.length).toBe(500);
    });
  });

  describe("validateScriptLine", () => {
    it("debería rechazar objetos de diálogo inválidos", () => {
      expect(validateScriptLine(null).isValid).toBe(false);
      expect(validateScriptLine({ speaker: "Host", text: "" }).isValid).toBe(false);
      expect(validateScriptLine({ speaker: "", text: "Hola" }).isValid).toBe(false);
    });

    it("debería sanitizar locutores y sentimientos correctamente", () => {
      const rawLine = {
        speaker: "  Host Principal  ",
        speakerRole: "host",
        text: "  Bienvenidos al episodio de hoy.  ",
        sentiment: "enthusiastic",
        timestamp: "0:05",
      };
      const res = validateScriptLine(rawLine);
      expect(res.isValid).toBe(true);
      expect(res.sanitized?.speaker).toBe("Host Principal");
      expect(res.sanitized?.text).toBe("Bienvenidos al episodio de hoy.");
      expect(res.sanitized?.sentiment).toBe("enthusiastic");
      expect(res.sanitized?.speakerRole).toBe("host");
      expect(res.sanitized?.timestamp).toBe("0:05");
    });

    it("debería asignar 'neutral' como sentimiento por defecto ante valores no reconocidos", () => {
      const rawLine = {
        speaker: "Analista",
        text: "Los datos revelan un crecimiento constante.",
        sentiment: "unknown_emotion",
      };
      const res = validateScriptLine(rawLine);
      expect(res.isValid).toBe(true);
      expect(res.sanitized?.sentiment).toBe("neutral");
    });
  });

  describe("validateScriptLines", () => {
    it("debería rechazar estructuras que no sean arreglos", () => {
      const res = validateScriptLines("no es un arreglo");
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain("deben ser una lista");
    });

    it("debería rechazar listas vacías", () => {
      const res = validateScriptLines([]);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain("no contiene ninguna línea");
    });

    it("debería validar y retornar líneas limpias cuando todas son válidas", () => {
      const lines = [
        { speaker: "Locutor 1", text: "Hola a todos.", speakerRole: "host" },
        { speaker: "Locutor 2", text: "Hola, un gusto estar aquí.", sentiment: "concerned", speakerRole: "caller" },
      ];
      const res = validateScriptLines(lines);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedLines.length).toBe(2);
    });
  });

  describe("parseScriptWriterResponse", () => {
    it("debería detectar y rechazar respuestas en HTML inesperadas (e.g. proxy o error 500)", () => {
      const htmlResponse = "<html><body>500 Internal Server Error</body></html>";
      const res = parseScriptWriterResponse(htmlResponse);
      expect(res.formatValid).toBe(false);
      expect(res.error).toContain("HTML inesperado");
    });

    it("debería parsear un JSON válido de guion", () => {
      const validJson = JSON.stringify({
        rawScript: "Locutor 1: Hola\nLocutor 2: Hola",
        lines: [
          { speaker: "Locutor 1", text: "Hola" },
          { speaker: "Locutor 2", text: "Hola" },
        ],
      });
      const res = parseScriptWriterResponse(validJson);
      expect(res.formatValid).toBe(true);
      expect(res.lines.length).toBe(2);
      expect(res.rawScript).toContain("Locutor 1");
    });
  });

  describe("validatePipelineStageTransition", () => {
    it("debería impedir avanzar al guion sin informe de fuentes", () => {
      const res = validatePipelineStageTransition(1, 2, { reportText: "" });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("informe de fuentes");
    });

    it("debería permitir avanzar al guion si existe informe de fuentes", () => {
      const res = validatePipelineStageTransition(1, 2, { reportText: "Informe de tendencias tech..." });
      expect(res.allowed).toBe(true);
    });

    it("debería impedir avanzar al audio studio sin guion redactado", () => {
      const res = validatePipelineStageTransition(2, 3, { scriptLines: [] });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("guion con líneas de diálogo");
    });

    it("debería permitir avanzar al audio studio si existen líneas de guion", () => {
      const res = validatePipelineStageTransition(2, 3, {
        scriptLines: [{ id: "1", speaker: "Locutor", speakerRole: "host", text: "Hola", sentiment: "neutral", timestamp: "0:00" }],
      });
      expect(res.allowed).toBe(true);
    });
  });
});
