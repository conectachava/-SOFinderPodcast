import { z } from "zod";

export const ScriptLineSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  speakerRole: z.string(),
  gender: z.string().optional(),
  accent: z.string().optional(),
  emotion: z.string().optional(),
  sentiment: z.string().optional(),
  text: z.string(),
  timestamp: z.string(),
});

export const OrchestratorResponseSchema = z.object({
  topic: z.string(),
  contentType: z.string(),
  showFormat: z.string(),
  durationMinutes: z.number(),
  intelligenceReport: z.string(),
  scriptText: z.string(),
  scriptLines: z.array(ScriptLineSchema),
  wordCount: z.number(),
});
